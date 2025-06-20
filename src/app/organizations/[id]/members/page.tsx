'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, getOrganizationMembers, hasOrganizationPermission, inviteTeamMember, updateOrganizationMembership, removeOrganizationMember } from '@/lib/firebase/organizationService';
import { Organization, OrganizationMembership } from '@/lib/types/organization';
import { NotificationService } from '@/lib/firebase/notificationService';
import Badge from '@/components/Badge';

export default function OrganizationMembers() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const { user } = useAuth();
  const organizationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchMembersData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        const membersData = await getOrganizationMembers(organizationId);
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching members data:', error);
        setError('Failed to load members data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembersData();
  }, [user, organizationId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteEmail || !organizationId) return;
    
    try {
      setIsInviting(true);
      setInviteError(null);
      
      // Get the user's ID token
      const token = await user.getIdToken();

      // Call the API route instead of the service directly
      const response = await fetch(`/api/organizations/${organizationId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      if (result.success) {
        setInviteEmail('');
        setInviteRole('member');
        setShowInviteForm(false);

        const membersData = await getOrganizationMembers(organizationId);
        setMembers(membersData);
      } else {
        setInviteError(result.error || 'Failed to send invitation. Please try again.');
      }
    } catch (error: any) {
      console.error('Error inviting member:', error);
      setInviteError('Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleEditMember = (member: OrganizationMembership) => {
    setEditingMember(member.id);
    setEditRole(member.role as 'admin' | 'member' | 'viewer');
  };

  const handleUpdateMember = async (membershipId: string) => {
    if (!user || !organizationId) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      await updateOrganizationMembership(membershipId, { role: editRole });
      
      setEditingMember(null);
      
      const membersData = await getOrganizationMembers(organizationId);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error updating member:', error);
      setError(error.message || 'Failed to update member. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!user || !organizationId) return;
    
    if (!confirm('Are you sure you want to remove this member from the organization?')) {
      return;
    }
    
    try {
      setIsRemoving(membershipId);
      setError(null);
      
      await removeOrganizationMember(membershipId);
      
      const membersData = await getOrganizationMembers(organizationId);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error removing member:', error);
      setError(error.message || 'Failed to remove member. Please try again.');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!user || !organizationId || !organization) return;

    const currentUserMembership = members.find(member => member.userId === user.uid);
    if (!currentUserMembership) return;

    if (currentUserMembership.role === 'owner') {
      setError('Owners cannot leave the organization. Please transfer ownership first in Settings.');
      return;
    }

    if (!confirm('Are you sure you want to leave this organization? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLeaving(true);
      setError(null);

      await removeOrganizationMember(currentUserMembership.id);

      try {
        const remainingMembers = await getOrganizationMembers(organizationId);
        const allRemainingMembers = remainingMembers.filter(member => member.userId !== user.uid);

        const notificationPromises = allRemainingMembers.map(member =>
          NotificationService.createNotification(
            member.userId,
            'Member Left Organization',
            `${currentUserMembership.userProfile?.displayName || currentUserMembership.userProfile?.email || 'A member'} has left the organization.`,
            'member_left',
            organizationId,
            `/organizations/${organizationId}/members`,
            {
              leftMemberId: user.uid,
              leftMemberName: currentUserMembership.userProfile?.displayName || currentUserMembership.userProfile?.email,
              organizationId: organizationId
            }
          )
        );

        await Promise.all(notificationPromises);
      } catch (notificationError) {
        console.warn('Failed to send notifications to members:', notificationError);
      }

      window.location.href = '/organizations';
    } catch (error: any) {
      console.error('Error leaving organization:', error);
      setError(error.message || 'Failed to leave organization. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const getInitials = (member: OrganizationMembership) => {
    const displayName = member.userProfile?.displayName;
    const email = member.userProfile?.email;
    
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

   const getCurrentUserRole = () => {
    if (!user) return null;
    const currentUserMembership = members.find(member => member.userId === user.uid);
    return currentUserMembership?.role || null;
  };

  const canEditMemberRole = (member: OrganizationMembership) => {
    const currentUserRole = getCurrentUserRole();
    if (!currentUserRole || member.role === 'owner') return false;

    if (currentUserRole === 'owner') {
      return true;
    }

    if (currentUserRole === 'admin') {
      return member.role !== 'admin';
    }

    return false;
  };

  const getAvailableRoles = (member: OrganizationMembership) => {
    const currentUserRole = getCurrentUserRole();

    if (currentUserRole === 'owner') {
      return ['admin', 'member', 'viewer'];
    }

    if (currentUserRole === 'admin' && member.role !== 'admin') {
      return ['member', 'viewer'];
    }

    return [];
  };

  const getRoleRank = (role: string) => {
    const roleHierarchy = {
      'owner': 1,
      'admin': 2,
      'member': 3,
      'viewer': 4
    };
    return roleHierarchy[role as keyof typeof roleHierarchy] || 5;
  };

  const sortedMembers = [...members].sort((a, b) => {
    const rankA = getRoleRank(a.role);
    const rankB = getRoleRank(b.role);
    return rankA - rankB;
  });



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error || 'Organization not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The organization you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link 
          href="/organizations"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Members Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Team Members
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your organization's team members and their permissions
        </p>
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Members ({members.length})</h2>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showInviteForm ? 'Cancel' : 'Invite Member'}
          </button>
        </div>

        {showInviteForm && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Invite New Member</h3>
            {inviteError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
                <p className="text-red-800 dark:text-red-200 text-sm">{inviteError}</p>
              </div>
            )}
            <form onSubmit={handleInviteMember}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {members.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {member.userProfile?.profilePicture || member.userProfile?.photoURL ? (
                            <img
                              src={member.userProfile.profilePicture || member.userProfile.photoURL}
                              alt={member.userProfile?.displayName || 'User avatar'}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${
                            member.userProfile?.profilePicture || member.userProfile?.photoURL ? 'hidden' : ''
                          }`}>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">{getInitials(member)}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.userProfile?.displayName || member.userProfile?.email || 'Unknown User'}
                            {member.status === 'invited' && (
                              <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">(Pending)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.userProfile?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMember === member.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'admin' | 'member' | 'viewer')}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          disabled={member.role === 'owner'}
                        >
                          {getAvailableRoles(member).map(role => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge
                          type="role"
                          value={member.role}
                          size="sm"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                         type="status"
                         value={member.status}
                         size="sm"
                       />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.joinedAt ? new Date(member.joinedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingMember === member.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleUpdateMember(member.id)}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            disabled={isUpdating}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          {canEditMemberRole(member) && (
                            <button
                              onClick={() => handleEditMember(member)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit
                            </button>
                          )}
                          {member.userId === user?.uid && member.role !== 'owner' && (
                            <button
                              onClick={handleLeaveOrganization}
                              disabled={isLeaving}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            >
                              {isLeaving ? 'Leaving...' : 'Leave Organization'}
                            </button>
                          )}
                          {member.role !== 'owner' && member.userId !== user?.uid && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={isRemoving === member.id}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            >
                              {isRemoving === member.id ? 'Removing...' : 'Remove'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permissions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Role Permissions</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Permission</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Owner</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admin</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Viewer</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">View organization</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">View projects & documents</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Create projects</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Upload project documents</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Access automation & workflows</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Invite members</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Manage integrations</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Manage billing</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Edit member roles</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><span className="text-xs text-gray-500">Limited</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Remove members</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><span className="text-xs text-gray-500">Limited</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Organization settings</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Transfer ownership</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Delete organization</td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><CheckIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><XIcon /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);