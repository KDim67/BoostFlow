'use client';

// React hooks for state management, lifecycle, and DOM references
import { useState, useEffect, useRef } from 'react';
// Next.js navigation hooks for routing and URL parameters
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// Custom authentication hook
import { useAuth } from '@/lib/firebase/useAuth';
// Organization permission validation service
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
// User profile data retrieval service
import { getUserProfile } from '@/lib/firebase/userProfileService';
// Communication services for messaging functionality
import { 
  sendMessage,
  Message,
  getOrCreateDirectMessageChannel
} from '@/lib/services/collaboration/communicationService';
// Date formatting utility
import { formatDistanceToNow } from 'date-fns';
// Firestore database utilities
import { queryDocuments, timestampToDate, getCollectionRef } from '@/lib/firebase/firestoreService';
// Firestore query operators and real-time subscription types
import { where, orderBy, query, onSnapshot, Unsubscribe } from 'firebase/firestore';

/**
 * DirectMessagePage Component
 * 
 * Renders a real-time direct messaging interface between two users within an organization.
 * Features include message history, real-time updates, typing indicators, and message sending.
 */
export default function DirectMessagePage() {
  // Extract URL parameters for organization and user IDs
  const { id, userId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Normalize URL parameters (handle both string and array formats)
  const organizationId = Array.isArray(id) ? id[0] : id;
  const otherUserId = Array.isArray(userId) ? userId[0] : userId;
  
  // User profile states
  const [otherUser, setOtherUser] = useState<any>(null); // Profile of the user being messaged
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null); // Current user's profile
  
  // Message and UI states
  const [messages, setMessages] = useState<Message[]>([]); // Array of conversation messages
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetch
  const [error, setError] = useState<string | null>(null); // Error message display
  const [newMessage, setNewMessage] = useState(''); // Current message being typed
  const [isSending, setIsSending] = useState(false); // Prevents duplicate sends

  // Typing indicator states
  const [isTyping, setIsTyping] = useState(false); // Shows typing indicator
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null); // Debounce typing status
  
  // Scroll behavior state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); // Shows scroll-to-bottom button
  
  // DOM element references
  const messagesEndRef = useRef<HTMLDivElement>(null); // Reference for auto-scrolling to bottom
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Reference for message input field
  const messagesContainerRef = useRef<HTMLDivElement>(null); // Reference for scroll detection
  const unsubscribeRef = useRef<Unsubscribe | null>(null); // Reference to Firestore subscription cleanup

  /**
   * Smoothly scrolls the messages container to the bottom
   * and hides the scroll-to-bottom button
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  /**
   * Generates user initials for avatar display
   * Priority: displayName (first + last initial) > email (first char) > 'U' fallback
   */
  const getInitials = (user: any) => {
    const displayName = user?.displayName;
    const email = user?.email;
    
    if (displayName) {
      const names = displayName.split(' ').filter(Boolean);
      // Use first and last name initials if available
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return displayName[0].toUpperCase();
    }
    
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U'; // Default fallback
  };

  /**
   * Handles scroll events to show/hide the scroll-to-bottom button
   * Shows button when user scrolls up more than 100px from bottom
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

  /**
   * Main effect for setting up real-time message subscription
   * Handles: permission validation, user profile fetching, and Firestore real-time updates
   */
  useEffect(() => {
    const setupRealtimeMessages = async () => {
      // Early return if required data is missing
      if (!user || !organizationId || !otherUserId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Verify user has permission to access this organization
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        if (!permission) {
          setError('You do not have permission to view this organization.');
          return;
        }
        
        // Fetch the profile of the user being messaged
        const userProfile = await getUserProfile(otherUserId);
        if (!userProfile) {
          setError('User not found.');
          return;
        }
        setOtherUser(userProfile);
        
        // Fetch current user's profile for message display
        const currentProfile = await getUserProfile(user.uid);
        setCurrentUserProfile(currentProfile);
        
        // Create deterministic conversation ID by sorting user IDs
        const conversationId = [user.uid, otherUserId].sort().join('_');
        
        // Set up real-time Firestore query for messages
        const messagesRef = getCollectionRef('messages');
        const q = query(
          messagesRef,
          where('channelId', '==', conversationId),
          orderBy('createdAt', 'asc') // Chronological order
        );
        
        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesData: any[] = [];
          querySnapshot.forEach((doc) => {
            messagesData.push({ id: doc.id, ...doc.data() });
          });
          
          // Convert Firestore timestamps to JavaScript Date objects
          const convertedMessages = messagesData.map(msg => ({
            ...msg,
            createdAt: timestampToDate(msg.createdAt) || new Date(),
            updatedAt: msg.updatedAt ? timestampToDate(msg.updatedAt) || undefined : undefined
          })) as Message[];
          
          setMessages(convertedMessages);
          setIsLoading(false);
        }, (error) => {
          console.error('Error in messages subscription:', error);
          setError('Failed to load conversation. Please try again.');
          setIsLoading(false);
        });
        
        // Store unsubscribe function for cleanup
        unsubscribeRef.current = unsubscribe;
        
      } catch (error) {
        console.error('Error setting up real-time messages:', error);
        setError('Failed to load conversation. Please try again.');
        setIsLoading(false);
      }
    };

    setupRealtimeMessages();
    
    // Cleanup: unsubscribe from Firestore listener on component unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, organizationId, otherUserId]); // Re-run when these dependencies change

  /**
   * Handles sending a new message
   * Creates/ensures channel exists, sends message, and resets input state
   */
  const handleSendMessage = async () => {
    // Validation: ensure message content and required data exist
    if (!newMessage.trim() || !user || !organizationId || !otherUserId || isSending) return;

    try {
      setIsSending(true);
      // Use same conversation ID generation logic as subscription
      const conversationId = [user.uid, otherUserId].sort().join('_');

      // Ensure the direct message channel exists in the database
      await getOrCreateDirectMessageChannel(user.uid, otherUserId, organizationId);

      // Prepare message data for Firestore
      const messageData = {
        channelId: conversationId,
        author: user.uid,
        authorName: user.displayName || user.email || 'Unknown User',
        content: newMessage.trim()
      };

      await sendMessage(messageData);
      setNewMessage(''); // Clear input after successful send
      
      // Reset textarea height to default
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handles Enter key press to send message
   * Enter alone sends, Shift+Enter creates new line
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handles textarea input changes
   * Features: auto-resize, typing indicator with debounce
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea based on content (max 120px height)
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
   * Formats message timestamps based on age
   * - < 24 hours: time only (e.g., "2:30 PM")
   * - < 7 days: weekday + time (e.g., "Mon 2:30 PM")
   * - > 7 days: date + time (e.g., "Jan 15 2:30 PM")
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
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state: show error message with navigation back to communication hub
  if (error || !otherUser) {
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
              {error || 'User not found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't load this conversation. Please try again or go back to communication.
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
                {otherUser.profilePicture ? (
                  <img 
                    src={otherUser.profilePicture} 
                    alt={otherUser.displayName || otherUser.email} 
                    className="w-12 h-12 rounded-full ring-2 ring-blue-500/20 object-cover"
                  />
                ) : otherUser.photoURL ? (
                  <img 
                    src={otherUser.photoURL} 
                    alt={otherUser.displayName || otherUser.email} 
                    className="w-12 h-12 rounded-full ring-2 ring-blue-500/20 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-blue-500/20">
                    <span className="text-white font-semibold text-lg">
                      {getInitials(otherUser)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {otherUser.displayName || otherUser.email}
                </h1>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active now
                  </p>
                </div>
              </div>
            </div>
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
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Start a conversation with {otherUser.displayName || otherUser.email}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              This is the beginning of your direct message conversation. Send a message to get started!
            </p>
          </div>
        ) : (
          // Message list: Render each message with conditional styling and grouping
          messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].author !== message.author;
            const isCurrentUser = message.author === user?.uid;
            const sender = isCurrentUser ? currentUserProfile : otherUser;
            const showTimestamp = showAvatar || (index > 0 && 
              new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000); // 5 minutes
            
            return (
              <div key={message.id} className={`flex items-start group ${showAvatar ? 'mt-6' : 'mt-1'} ${
                isCurrentUser ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'
              } hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-full p-3 -mx-3 transition-all duration-200 hover:scale-[1.01]`}>
                {showAvatar ? (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    {sender?.profilePicture ? (
                      <img 
                        src={sender.profilePicture} 
                        alt={sender.displayName || sender.email} 
                        className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm object-cover"
                      />
                    ) : sender?.photoURL ? (
                      <img 
                        src={sender.photoURL} 
                        alt={sender.displayName || sender.email} 
                        className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getInitials(sender)}
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
                        {isCurrentUser ? 'You' : (otherUser.displayName || otherUser.email)}
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
                placeholder={`Message ${otherUser.displayName || otherUser.email}...`}
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
    </div>
  );
}