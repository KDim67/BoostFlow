'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { hasOrganizationPermission, getOrganizationMembers } from '@/lib/firebase/organizationService';
import { getUserProfile } from '@/lib/firebase/userProfileService';
import { 
  getChannel,
  getChannelMessages,
  sendMessage,
  getChannelMembers,
  addChannelMember,
  updateChannel,
  deleteChannel,
  Channel,
  Message
} from '@/lib/services/collaboration/communicationService';
import { formatDistanceToNow } from 'date-fns';

/**
 * ChannelPage Component - Real-time chat interface for organization channels
 * 
 * Provides a complete messaging experience with:
 * - Real-time message display and sending
 * - Channel management (edit, delete for creators)
 * - Member management for private channels
 * - Permission-based access control
 * - Responsive UI with typing indicators and scroll management
 */
export default function ChannelPage() {
  // Extract URL parameters for organization and channel identification
  const { id, channelId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Normalize URL parameters (handle both string and array formats from Next.js)
  const organizationId = Array.isArray(id) ? id[0] : id;
  const channelIdStr = Array.isArray(channelId) ? channelId[0] : channelId;
  
  // Core channel data state
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  
  // User profile caching for message display optimization
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Message input and sending state
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Modal and user management state (for private channels)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // Channel management UI state (only available to channel creators)
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Chat UX enhancement state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // DOM references for scroll management and UI interactions
  const messagesEndRef = useRef<HTMLDivElement>(null); // Auto-scroll target
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Message input auto-resize
  const messagesContainerRef = useRef<HTMLDivElement>(null); // Scroll detection
  const dropdownRef = useRef<HTMLDivElement>(null); // Click-outside detection

  /**
   * Smoothly scrolls to the bottom of the message list
   * Used when new messages arrive or user clicks scroll button
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  /**
   * Generates user initials for avatar display when profile picture is unavailable
   * Priority: displayName (first + last initial) > displayName (first initial) > email (first char) > 'U'
   * 
   * @param user - User object with displayName and/or email
   * @returns String of 1-2 uppercase characters
   */
  const getInitials = (user: any) => {
    const displayName = user?.displayName;
    const email = user?.email;
    
    if (displayName) {
      const names = displayName.trim().split(' ');
      // Use first and last name initials if available
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return displayName[0].toUpperCase();
    }
    
    if (email) {
      return email[0].toUpperCase();
    }
    
    // Fallback for users with no displayName or email
    return 'U';
  };
  
  /**
   * Handles scroll events in the messages container
   * Shows/hides the "scroll to bottom" button based on scroll position
   * Button appears when user scrolls up more than 100px from bottom
   */
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && messages.length > 0);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle click-outside behavior for dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup event listener to prevent memory leaks
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  /**
   * Main data fetching effect - loads channel data, messages, and user profiles
   * Implements comprehensive permission checking and error handling
   * 
   * Security checks:
   * 1. Organization viewer permission
   * 2. Channel existence
   * 3. Private channel membership
   */
  useEffect(() => {
    const fetchChannelData = async () => {
      // Early return if required data is missing
      if (!user || !organizationId || !channelIdStr) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check organization-level permissions first
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        if (!permission) {
          setError('You do not have permission to view this organization.');
          return;
        }
        
        // Verify channel exists
        const channelData = await getChannel(channelIdStr);
        if (!channelData) {
          setError('Channel not found.');
          return;
        }
        
        // Check private channel access permissions
        if (channelData.type === 'private' && !channelData.memberIds?.includes(user.uid)) {
          setError('You do not have access to this private channel.');
          return;
        }
        
        setChannel(channelData);
        
        // Parallel fetch of messages and members for better performance
        const [messagesData, membersData] = await Promise.all([
          getChannelMessages(channelIdStr),
          getChannelMembers(channelIdStr)
        ]);
        
        setMessages(messagesData);
        setMembers(membersData);
        
        // Fetch user profiles for message authors
        const uniqueAuthorIds = [...new Set(messagesData.map(msg => msg.author))];
        // Fetch profiles with error handling for individual failures
        const profilePromises = uniqueAuthorIds.map(async (authorId) => {
          try {
            const profile = await getUserProfile(authorId);
            return { [authorId]: profile };
          } catch (error) {
            console.error(`Error fetching profile for user ${authorId}:`, error);
            // Return null profile to prevent UI breaks
            return { [authorId]: null };
          }
        });
        
        const profileResults = await Promise.all(profilePromises);
        // Merge all profile objects into a single map for efficient lookups
        const profilesMap = profileResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setUserProfiles(profilesMap);
        
        // Fetch current user's profile for consistent display
        const currentProfile = await getUserProfile(user.uid);
        setCurrentUserProfile(currentProfile);
        
        // Load organization members for private channel management (creator only)
        if (channelData.type === 'private' && channelData.createdBy === user.uid) {
          const orgMembers = await getOrganizationMembers(organizationId);
          // Filter to show only active members not already in the channel
          setOrganizationMembers(orgMembers.filter(member => 
            member.status === 'active' && !channelData.memberIds.includes(member.userId)
          ));
        }
      } catch (error) {
        console.error('Error fetching channel data:', error);
        setError('Failed to load channel. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();
  }, [user, organizationId, channelIdStr]);

  /**
   * Handles message sending with optimistic UI updates
   * Validates input, sends message, and updates local state immediately
   * Includes error handling and UI cleanup
   */
  const handleSendMessage = async () => {
    // Validate required data and non-empty message
    if (!user || !channelIdStr || !newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
      const messageData = {
        channelId: channelIdStr,
        content: newMessage.trim(),
        author: user.uid,
        authorName: user.displayName || user.email || 'Unknown User'
      };
      
      const sentMessage = await sendMessage(messageData);
      // Optimistically update local messages for immediate UI feedback
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handles keyboard shortcuts in message input
   * Enter: Send message, Shift+Enter: New line
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handles textarea input changes with auto-resize and typing indicator
   * Features:
   * - Auto-resize textarea based on content (max 120px height)
   * - Typing indicator with 1-second timeout
   * - Debounced typing state management
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea based on content
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    // Show typing indicator
    if (!isTyping) {
      setIsTyping(true);
    }
    
    // Clear existing timeout to debounce typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Hide typing indicator after 1 second of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };
  
  /**
   * Adds a user to the current private channel
   * Updates local state optimistically and refreshes member list
   * Only available to channel creators
   * 
   * @param userId - ID of the user to add to the channel
   */
  const handleAddUser = async (userId: string) => {
    // Prevent duplicate requests and validate required data
    if (!channelIdStr || isAddingUser) return;
    
    try {
      setIsAddingUser(true);
      const success = await addChannelMember(channelIdStr, userId, 'member');
      
      if (success) {
        // Refresh member list from server
        const updatedMembers = await getChannelMembers(channelIdStr);
        setMembers(updatedMembers);
        
        // Remove user from available organization members list
        setOrganizationMembers(prev => prev.filter(member => member.userId !== userId));
        
        // Update local channel state with new member
        if (channel) {
          setChannel({
            ...channel,
            memberIds: [...channel.memberIds, userId]
          });
        }
      }
    } catch (error) {
      console.error('Error adding user to channel:', error);
      setError('Failed to add user to channel');
    } finally {
      setIsAddingUser(false);
    }
  };
  
  /**
   * Updates channel name and description
   * Validates input, updates server, and refreshes local state
   * Only available to channel creators
   */
  const handleEditChannel = async () => {
    // Validate required data and prevent duplicate requests
    if (!channelIdStr || !editChannelName.trim() || isUpdating) return;
    
    try {
      setIsUpdating(true);
      const success = await updateChannel(channelIdStr, {
        name: editChannelName.trim(),
        description: editChannelDescription.trim() || undefined
      });
      
      if (success && channel) {
        // Update local channel state immediately
        setChannel({
          ...channel,
          name: editChannelName.trim(),
          description: editChannelDescription.trim() || undefined
        });
        setShowEditModal(false);
        setShowDropdown(false);
      } else {
        setError('Failed to update channel');
      }
    } catch (error) {
      console.error('Error updating channel:', error);
      setError('Failed to update channel');
    } finally {
      setIsUpdating(false);
    }
  };
  
  /**
   * Permanently deletes the channel and all its messages
   * Redirects to communication hub on success
   * Only available to channel creators
   */
  const handleDeleteChannel = async () => {
    // Prevent duplicate requests
    if (!channelIdStr || isDeleting) return;
    
    try {
      setIsDeleting(true);
      const success = await deleteChannel(channelIdStr);
      
      if (success) {
        // Redirect to communication hub after successful deletion
        router.push(`/organizations/${organizationId}/communication`);
      } else {
        setError('Failed to delete channel');
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      setError('Failed to delete channel');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  /**
   * Opens the edit channel modal with current channel data pre-filled
   * Closes the dropdown menu when opening
   */
  const openEditModal = () => {
    if (channel) {
      setEditChannelName(channel.name);
      setEditChannelDescription(channel.description || '');
      setShowEditModal(true);
      setShowDropdown(false);
    }
  };
  
  /**
   * Filters organization members based on search query
   * Searches both display name and email fields (case-insensitive)
   */
  const filteredOrganizationMembers = organizationMembers.filter(member =>
    member.userProfile?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.userProfile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  /**
   * Formats message timestamps based on age
   * - < 24 hours: Time only (e.g., "2:30 PM")
   * - < 7 days: Weekday + time (e.g., "Mon 2:30 PM")
   * - > 7 days: Date + time (e.g., "Jan 15 2:30 PM")
   * 
   * @param date - Message creation date
   * @returns Formatted time string
   */
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading channel...</p>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {error || 'Channel not found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't load this channel. Please try again or go back to communication.
            </p>
            <Link 
              href={`/organizations/${organizationId}/communication`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Communication</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                {channel.type === 'private' ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center ring-2 ring-purple-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-blue-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  #{channel.name}
                </h1>
                {channel.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {channel.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span>{members.length} members</span>
            </div>
            
            {/* Channel Settings Dropdown for Channel Creator */}
             {channel.createdBy === user?.uid && (
               <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="py-1">
                      <button
                        onClick={openEditModal}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Channel</span>
                      </button>
                      
                      {channel.type === 'private' && (
                        <button
                          onClick={() => {
                            setShowAddUserModal(true);
                            setShowDropdown(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add User</span>
                        </button>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowDropdown(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Channel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(156 163 175) transparent'
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              {channel.type === 'private' ? (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              )}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Welcome to #{channel.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {channel.description || 'This is the beginning of your conversation. Send a message to get started!'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].author !== message.author;
            const isCurrentUser = message.author === user?.uid;
            const showTimestamp = showAvatar || (index > 0 && 
              new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000); // 5 minutes
            
            const authorProfile = userProfiles[message.author];
            const displayName = isCurrentUser 
              ? (user?.displayName || user?.email || 'You')
              : (authorProfile?.displayName || message.authorName || 'Unknown User');
            
            return (
              <div key={message.id} className={`flex items-start group ${showAvatar ? 'mt-6' : 'mt-1'} ${
                isCurrentUser ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'
              } hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-full p-3 -mx-3 transition-all duration-200 hover:scale-[1.01]`}>
                {showAvatar ? (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    {(isCurrentUser && (currentUserProfile?.profilePicture || currentUserProfile?.photoURL)) || (!isCurrentUser && (authorProfile?.profilePicture || authorProfile?.photoURL)) ? (
                      <img 
                        src={isCurrentUser ? (currentUserProfile?.profilePicture || currentUserProfile?.photoURL) : (authorProfile?.profilePicture || authorProfile?.photoURL)} 
                        alt={displayName} 
                        className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                        <span className="text-white font-semibold text-sm">
                          {getInitials(isCurrentUser ? currentUserProfile : authorProfile)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 flex-shrink-0" />
                )}
                
                <div className={`flex-1 min-w-0 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                  {showAvatar && (
                    <div className={`flex items-center space-x-2 mb-2 ${
                      isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {isCurrentUser ? 'You' : displayName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {formatMessageTime(new Date(message.createdAt))}
                      </span>
                    </div>
                  )}
                  
                  <div className={`group/message relative inline-block px-4 py-3 rounded-full max-w-xs lg:max-w-md whitespace-pre-wrap break-words shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 backdrop-blur-sm'
                  }`}>
                    {message.content}
                    
                    {/* Message status indicator for sent messages */}
                    {isCurrentUser && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="px-6 py-2 flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>You are typing...</span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${channel.name}...`}
                className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none shadow-sm transition-all duration-200 hover:shadow-md"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={isSending}
              />
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-full transition-all duration-200 hover:scale-105 shadow-sm ${
              !newMessage.trim() || isSending
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Members to #{channel.name}
                </h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="mt-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search organization members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Members List */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {filteredOrganizationMembers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No members found matching your search.' : 'All organization members are already in this channel.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrganizationMembers.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                          {member.userProfile?.profilePicture ? (
                            <img 
                              src={member.userProfile.profilePicture} 
                              alt={member.userProfile.displayName || member.userProfile.email} 
                              className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm object-cover"
                            />
                          ) : member.userProfile?.photoURL ? (
                            <img 
                              src={member.userProfile.photoURL} 
                              alt={member.userProfile.displayName || member.userProfile.email} 
                              className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {getInitials(member.userProfile)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.userProfile?.displayName || member.userProfile?.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddUser(member.userId)}
                        disabled={isAddingUser}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {isAddingUser ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Channel Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Channel
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={editChannelName}
                  onChange={(e) => setEditChannelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter channel name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={editChannelDescription}
                  onChange={(e) => setEditChannelDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Enter channel description"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditChannel}
                disabled={!editChannelName.trim() || isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Updating...' : 'Update Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Channel Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Channel
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete <strong>#{channel?.name}</strong>? This will permanently delete the channel and all its messages.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChannel}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}