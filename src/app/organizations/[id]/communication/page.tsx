'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { 
  getChannelsByOrganizationForUser, 
  createChannel, 
  Channel 
} from '@/lib/services/collaboration/communicationService';
import { getOrganizationMembers } from '@/lib/firebase/organizationService';
import { OrganizationMembership } from '@/lib/types/organization';
import Badge from '@/components/Badge';

export default function CommunicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = Array.isArray(id) ? id[0] : id;
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<OrganizationMembership[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [isCreating, setIsCreating] = useState(false);

  const getInitials = (profile: any) => {
    const displayName = profile?.displayName || 
      `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    const email = profile?.email;
    
    if (displayName) {
      const names = displayName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return displayName[0].toUpperCase();
    }
    
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        if (!permission) {
          setError('You do not have permission to view this organization.');
          return;
        }
        
        const [channelsData, membersData] = await Promise.all([
          getChannelsByOrganizationForUser(organizationId, user.uid),
          getOrganizationMembers(organizationId)
        ]);
        
        setChannels(channelsData);
        const activeMembers = membersData.filter(member => 
          member.status === 'active' && member.userId !== user.uid
        );
        setMembers(activeMembers);
        setFilteredMembers(activeMembers);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, organizationId]);

  useEffect(() => {
    if (!memberSearchQuery.trim()) {
      setFilteredMembers(members);
    } else {
      const query = memberSearchQuery.toLowerCase();
      const filtered = members.filter(member => {
        const profile = member.userProfile;
        if (!profile) return false;
        
        const displayName = profile.displayName?.toLowerCase() || '';
        const firstName = profile.firstName?.toLowerCase() || '';
        const lastName = profile.lastName?.toLowerCase() || '';
        const email = profile.email?.toLowerCase() || '';
        const jobTitle = profile.jobTitle?.toLowerCase() || '';
        
        return displayName.includes(query) ||
               firstName.includes(query) ||
               lastName.includes(query) ||
               email.includes(query) ||
               jobTitle.includes(query) ||
               `${firstName} ${lastName}`.includes(query);
      });
      setFilteredMembers(filtered);
    }
  }, [memberSearchQuery, members]);

  const handleCreateChannel = async () => {
    if (!user || !organizationId || !newChannelName.trim()) return;
    
    try {
      setIsCreating(true);
      
      const channelData = {
        name: newChannelName.trim(),
        description: newChannelDescription.trim(),
        type: newChannelType,
        organizationId,
        createdBy: user.uid,
        memberIds: [user.uid],
        isArchived: false
      };
      
      const newChannel = await createChannel(channelData);
      setChannels(prev => [newChannel, ...prev]);
      
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
      setShowCreateModal(false);
      
      router.push(`/organizations/${organizationId}/communication/channels/${newChannel.id}`);
    } catch (error) {
      console.error('Error creating channel:', error);
      setError('Failed to create channel. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading communication hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-8 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              {error}
            </h2>
          </div>
          <Link 
            href={`/organizations/${organizationId}/dashboard`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 rounded-3xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 space-y-4 sm:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Communication Hub
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Collaborate seamlessly with your team through channels and direct messages
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Create Channel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Channels Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Channels
                </h2>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full">
                  {channels.length}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {channels.map((channel, index) => (
                <Link
                  key={channel.id}
                  href={`/organizations/${organizationId}/communication/channels/${channel.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        channel.type === 'private' 
                          ? 'bg-orange-100 dark:bg-orange-900'
                          : 'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        {channel.type === 'private' ? (
                           <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                           </svg>
                         ) : (
                           <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                           </svg>
                         )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          #{channel.name}
                        </h3>
                      </div>
                    </div>
                    <Badge 
                      type="visibility" 
                      value={channel.type} 
                      size="sm" 
                    />
                  </div>
                  
                  {channel.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed line-clamp-2">
                      {channel.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                       <div className="flex items-center space-x-1">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                       </svg>
                         <span className="font-medium">{channel.memberIds?.length || 0}</span>
                       </div>
                       <span className="text-gray-300 dark:text-gray-600">•</span>
                       <span className="text-xs">
                         {new Date(channel.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </span>
                     </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
              
              {channels.length === 0 && (
                <div className="col-span-full">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        No channels yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        Create your first channel to start collaborating with your team. Channels help organize conversations by topic, project, or team.
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Your First Channel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Direct Messages Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Direct Messages
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Start private conversations with team members
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search team members..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm transition-all duration-200 bg-gray-50 dark:bg-gray-700/50"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {memberSearchQuery && (
                    <button
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Members List */}
                <div className="max-h-80 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member, index) => {
                      const profile = member.userProfile;
                      if (!profile) return null;
                      
                      const displayName = profile.displayName || 
                        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 
                        profile.email;
                      
                      return (
                        <Link
                          key={member.id}
                          href={`/organizations/${organizationId}/communication/direct/${member.userId}`}
                          className="group flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-700"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="relative">
                            {profile.profilePicture ? (
                              <img
                                src={profile.profilePicture}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 group-hover:ring-purple-200 dark:group-hover:ring-purple-700 transition-all duration-200"
                              />
                            ) : profile.photoURL ? (
                              <img
                                src={profile.photoURL}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 group-hover:ring-purple-200 dark:group-hover:ring-purple-700 transition-all duration-200"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white dark:ring-gray-800 group-hover:ring-purple-200 dark:group-hover:ring-purple-700 transition-all duration-200">
                                {getInitials(profile)}
                              </div>
                            )}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                              member.status === 'active' 
                                ? 'bg-green-400' 
                                : 'bg-gray-400'
                            }`}></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                              {displayName}
                            </p>
                            {profile.jobTitle && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {profile.jobTitle}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {memberSearchQuery ? 'No members found' : 'No team members available'}
                      </p>
                      {memberSearchQuery && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              

            </div>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Create New Channel
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Channel Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">#</span>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="general, marketing, development"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 bg-gray-50 dark:bg-gray-700/50"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Channel names must be lowercase, without spaces or periods, and less than 50 characters.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Description <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="What's this channel about? What topics will be discussed here?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 resize-none"
                  maxLength={250}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {newChannelDescription.length}/250 characters
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                  Channel Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group">
                    <input
                      type="radio"
                      value="public"
                      checked={newChannelType === 'public'}
                      onChange={(e) => setNewChannelType(e.target.value as 'public' | 'private')}
                      className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          Public Channel
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Anyone in the organization can find and join this channel
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 group">
                    <input
                      type="radio"
                      value="private"
                      checked={newChannelType === 'private'}
                      onChange={(e) => setNewChannelType(e.target.value as 'public' | 'private')}
                      className="mt-1 mr-3 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-300">
                          Private Channel
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Only invited members can access this channel
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-all duration-200 border border-gray-300 dark:border-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim() || isCreating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none font-medium flex items-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Channel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}