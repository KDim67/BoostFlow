'use client';

import React, { useEffect, useState } from 'react';
import { getAllUserProfiles, UserProfile, updateUserProfile, deleteUserProfile } from '@/lib/firebase/userProfileService';
import { timestampToDate } from '@/lib/firebase/firestoreService';
import { where, orderBy, QueryConstraint } from 'firebase/firestore';
import { queryDocuments } from '@/lib/firebase/firestoreService';
import { PlatformRole, usePlatformAuth } from '@/lib/firebase/usePlatformAuth';
import { getUserOrganizations } from '@/lib/firebase/organizationService';
import { OrganizationWithDetails } from '@/lib/types/organization';

import Badge from '@/components/Badge';

// Extended user profile interface that includes organization names for display
interface UserWithOrganizations extends UserProfile {
  organizations: string[];
}

/**
 * Platform admin page for managing users across the entire platform.
 * Provides functionality for viewing, editing, suspending, and deleting user accounts.
 * Only accessible to super administrators.
 */
export default function UserManagementPage() {
  // Core user data states
  const [users, setUsers] = useState<UserWithOrganizations[]>([]); // All users with their organizations
  const [filteredUsers, setFilteredUsers] = useState<UserWithOrganizations[]>([]); // Users after applying filters
  const [paginatedUsers, setPaginatedUsers] = useState<UserWithOrganizations[]>([]); // Current page of users
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states for user search and filtering
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search by name or email
  const [roleFilter, setRoleFilter] = useState<string>(''); // Filter by platform role
  const [statusFilter, setStatusFilter] = useState<string>(''); // Filter by active/inactive/suspended
  const [organizationFilter, setOrganizationFilter] = useState<string>(''); // Filter by organization
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null); // User being edited
  const [editedRole, setEditedRole] = useState<string>('');
  const [editedName, setEditedName] = useState<string>('');
  const [editedEmail, setEditedEmail] = useState<string>('');
  
  // Suspension modal states
  const [suspendModalOpen, setSuspendModalOpen] = useState<boolean>(false);
  const [suspensionReason, setSuspensionReason] = useState<string>('');
  
  // Delete confirmation modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // List of all organizations for filter dropdown
  const [allOrganizations, setAllOrganizations] = useState<string[]>([]);

  const { isSuperAdmin } = usePlatformAuth();



  // Fetch all users and their associated organizations on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userProfiles = await getAllUserProfiles();
        
        // Enrich each user profile with their organization names
        const usersWithOrganizations = await Promise.all(
          userProfiles.map(async (user) => {
            try {
              const userOrgs = await getUserOrganizations(user.uid);
              return {
                ...user,
                organizations: userOrgs.map(org => org.name)
              };
            } catch (error) {
              // If fetching organizations fails, continue with empty array
              console.error(`Error fetching organizations for user ${user.uid}:`, error);
              return {
                ...user,
                organizations: []
              };
            }
          })
        );
        
        // Extract unique organization names for filter dropdown
        const orgSet = new Set<string>();
        usersWithOrganizations.forEach(user => {
          user.organizations.forEach(org => orgSet.add(org));
        });
        setAllOrganizations(Array.from(orgSet).sort());
        
        setUsers(usersWithOrganizations);
        setFilteredUsers(usersWithOrganizations);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Re-apply filters whenever filter criteria or user data changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, roleFilter, statusFilter, organizationFilter, users]);

  // Re-paginate whenever filtered results or pagination settings change
  useEffect(() => {
    applyPagination();
  }, [filteredUsers, currentPage, pageSize]);

  // Reset to first page when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  /**
   * Apply all active filters to the user list.
   * Filters are applied in sequence: search -> role -> status -> organization
   */
  const applyFilters = () => {
    let result = [...users];
    
    // Text search in display name and email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.displayName?.toLowerCase().includes(query) || 
         user.email.toLowerCase().includes(query))
      );
    }
    
    // Filter by platform role
    if (roleFilter) {
      result = result.filter(user => user.platformRole === roleFilter);
    }
    
    // Filter by user status (active/inactive/suspended)
    if (statusFilter) {
      if (statusFilter === 'active') {
        // Active: not suspended and has recent activity
        result = result.filter(user => !user.suspended && !!user.updatedAt);
      } else if (statusFilter === 'inactive') {
        // Inactive: not suspended but no recent activity
        result = result.filter(user => !user.suspended && !user.updatedAt);
      } else if (statusFilter === 'suspended') {
        result = result.filter(user => user.suspended);
      }
    }
    
    // Filter by organization membership
    if (organizationFilter) {
      result = result.filter(user => user.organizations.includes(organizationFilter));
    }
    
    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  /**
   * Extract the current page of users from filtered results
   */
  const applyPagination = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  };

  // Calculate pagination metadata
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredUsers.length);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  /**
   * Initialize edit modal with selected user's current data
   */
  const handleEditUser = (user: UserProfile) => {
    setCurrentUser(user);
    setEditedRole(user.platformRole || 'user');
    setEditedName(user.displayName || '');
    setEditedEmail(user.email);
    setIsEditModalOpen(true);
  };

  /**
   * Open suspension modal for the selected user
   */
  const handleSuspendUser = async (user: UserProfile) => {
    setCurrentUser(user);
    setSuspendModalOpen(true);
  };

  /**
   * Open delete confirmation modal for the selected user
   */
  const handleDeleteUser = async (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  /**
   * Permanently delete a user profile from the system.
   * Updates local state to reflect the deletion immediately.
   */
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUserProfile(userToDelete.uid);
      
      // Remove user from local state
      const updatedUsers = users.filter(u => u.uid !== userToDelete.uid);
      setUsers(updatedUsers);
      applyFilters(); // Refresh filtered view
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };

  /**
   * Toggle user suspension status.
   * When suspending: adds reason and timestamp
   * When unsuspending: clears suspension data
   */
  const handleConfirmSuspension = async () => {
    if (!currentUser) return;
    
    try {
      const updateData: any = {
        suspended: !currentUser.suspended,
        updatedAt: new Date()
      };
      
      // Add suspension metadata when suspending
      if (!currentUser.suspended) {
        updateData.suspensionReason = suspensionReason || 'No reason provided';
        updateData.suspendedAt = new Date();
      } else {
        // Clear suspension metadata when unsuspending
        updateData.suspensionReason = null;
        updateData.suspendedAt = null;
      }
      
      await updateUserProfile(currentUser.uid, updateData);
      
      // Update local state to reflect changes
      const updatedUsers = users.map(u => {
        if (u.uid === currentUser.uid) {
          return { ...u, ...updateData };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      applyFilters(); // Refresh filtered view
      setSuspendModalOpen(false);
      setSuspensionReason('');
    } catch (err) {
      console.error('Error suspending user:', err);
      alert('Failed to suspend user. Please try again.');
    }
  };

  /**
   * Format timestamp into human-readable "time ago" format.
   * Handles both Firestore timestamps and regular Date objects.
   */
  const formatLastActive = (timestamp: any) => {
    if (!timestamp) return 'Never';
    
    // Handle Firestore timestamp or regular Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Return appropriate time format based on recency
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  /**
   * Save changes made to user profile in edit modal.
   * Updates both remote database and local state.
   */
  const handleSaveUserChanges = async () => {
    if (!currentUser) return;
    
    try {
      await updateUserProfile(currentUser.uid, { 
        platformRole: editedRole as PlatformRole,
        displayName: editedName,
        email: editedEmail,
        updatedAt: new Date()
      });
      
      // Update local state to reflect changes immediately
      const updatedUsers = users.map(u => {
        if (u.uid === currentUser.uid) {
          return { 
            ...u, 
            platformRole: editedRole as PlatformRole, 
            displayName: editedName,
            email: editedEmail,
            updatedAt: new Date() 
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      applyFilters(); // Refresh filtered view
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform users and their permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Filter Users</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="platform_moderator">Platform Moderator</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
              >
                <option value="">All Organizations</option>
                {allOrganizations.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('');
                setStatusFilter('');
                setOrganizationFilter('');
                setCurrentPage(1);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Users</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</label>
            <select 
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 dark:text-red-400">
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-bold">
                            {user.displayName ? user.displayName.charAt(0) : user.email.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.displayName || user.email.split('@')[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.platformRole || 'User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          type="status" 
                          value={user.suspended ? 'suspended' : !user.updatedAt ? 'inactive' : 'active'} 
                          size="sm" 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.organizations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.organizations.slice(0, 2).map((org, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                                {org}
                              </span>
                            ))}
                            {user.organizations.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                +{user.organizations.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          'Not specified'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatLastActive(user.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleSuspendUser(user)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 mr-3"
                        >
                          {user.suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-700 dark:text-red-500 hover:text-red-900 dark:hover:text-red-300 font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{filteredUsers.length > 0 ? startIndex : 0}</span> to <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{filteredUsers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" 
                  value={editedName || currentUser.displayName || ''} 
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" 
                  value={editedEmail || currentUser.email} 
                  onChange={(e) => setEditedEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  className={`w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={editedRole}
                  onChange={(e) => setEditedRole(e.target.value)}
                  disabled={!isSuperAdmin}
                >
                  <option value="user">User</option>
                  <option value="platform_moderator">Platform Moderator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {!isSuperAdmin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Only super admins can modify user roles
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveUserChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {suspendModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{currentUser.suspended ? 'Unsuspend' : 'Suspend'} User</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to {currentUser.suspended ? 'unsuspend' : 'suspend'} {currentUser.displayName || currentUser.email}?
            </p>
            {!currentUser.suspended && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Reason for suspension (optional)</label>
                <textarea 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter reason for suspension"
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSuspension}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {currentUser.suspended ? 'Unsuspend' : 'Suspend'} User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Remove User</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to permanently remove <strong>{userToDelete.displayName || userToDelete.email}</strong>? This action cannot be undone.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This will permanently delete the user's profile and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}