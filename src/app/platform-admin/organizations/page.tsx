'use client';

// React component for platform administrators to manage organizations
// Provides functionality for viewing, filtering, suspending, and deleting organizations
import React, { useEffect, useState } from 'react';
import { Metadata } from 'next';
import { useRouter } from 'next/navigation';
import { getAllOrganizations, updateOrganization } from '@/lib/firebase/organizationService';
import { Organization, SubscriptionPlan } from '@/lib/types/organization';
import { timestampToDate } from '@/lib/firebase/firestoreService';
import { auth } from '@/lib/firebase/config';
import { usePlatformAuth } from '@/lib/firebase/usePlatformAuth';

import Badge from '@/components/Badge';

/**
 * Platform admin page for managing organizations
 * Requires super admin privileges to access
 * Features: search, filter, pagination, suspend/unsuspend, delete, plan management
 */
export default function OrganizationManagementPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = usePlatformAuth();
  
  // Core organization data state
  const [organizations, setOrganizations] = useState<Organization[]>([]); // Master list of all organizations
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]); // Organizations after applying filters
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState<string>(''); // Text search by organization name
  const [planFilter, setPlanFilter] = useState<string>(''); // Filter by subscription plan
  const [statusFilter, setStatusFilter] = useState<string>(''); // Filter by status (active/suspended/trial)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5); // Number of organizations per page
  const [paginatedOrganizations, setPaginatedOrganizations] = useState<Organization[]>([]); // Current page data
  
  // Modal state for user interactions
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  
  // Redirect non-super-admin users to platform admin dashboard
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/platform-admin');
    }
  }, [authLoading, isSuperAdmin, router]);

  // Fetch all organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const orgs = await getAllOrganizations();
        setOrganizations(orgs);
        setFilteredOrganizations(orgs); // Initialize filtered list with all organizations
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to load organizations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Re-apply filters whenever search/filter criteria or data changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, planFilter, statusFilter, organizations]);

  // Re-calculate pagination whenever filtered data or pagination settings change
  useEffect(() => {
    applyPagination();
  }, [filteredOrganizations, currentPage, pageSize]);

  // Reset to first page when page size changes to avoid empty pages
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  /**
   * Apply search and filter criteria to the organizations list
   * Filters are applied in sequence: search -> plan -> status
   * Resets pagination to first page after filtering
   */
  const applyFilters = () => {
    let result = [...organizations];
    
    // Text search by organization name (case-insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(org => 
        org.name.toLowerCase().includes(query)
      );
    }
    
    // Filter by subscription plan
    if (planFilter) {
      result = result.filter(org => org.plan === planFilter.toLowerCase());
    }
    
    // Filter by organization status
    if (statusFilter) {
      if (statusFilter === 'active') {
        result = result.filter(org => !org.suspended);
      } else if (statusFilter === 'suspended') {
        result = result.filter(org => org.suspended);
      } else if (statusFilter === 'trial') {
        result = result.filter(org => org.onTrial);
      }
    }
    
    setFilteredOrganizations(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  /**
   * Calculate which organizations to display on the current page
   * Uses zero-based indexing for array slicing
   */
  const applyPagination = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedOrganizations(filteredOrganizations.slice(startIndex, endIndex));
  };

  // Pagination calculations for UI display
  const totalPages = Math.ceil(filteredOrganizations.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredOrganizations.length);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  /**
   * Format Firestore timestamp or Date object for display
   * Handles both Firestore Timestamp objects and regular Date objects
   */
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp objects vs regular Date objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  /**
   * Toggle organization suspension status
   * Updates both database and local state, then re-applies filters
   */
  const handleSuspendOrganization = async (org: Organization) => {
    if (confirm(`Are you sure you want to ${org.suspended ? 'unsuspend' : 'suspend'} ${org.name}?`)) {
      try {
        // Update in database
        await updateOrganization(org.id, { 
          suspended: !org.suspended,
          updatedAt: new Date()
        });
        
        // Update local state to reflect changes immediately
        const updatedOrgs = organizations.map(o => {
          if (o.id === org.id) {
            return { ...o, suspended: !o.suspended, updatedAt: new Date() };
          }
          return o;
        });
        
        setOrganizations(updatedOrgs);
        applyFilters(); // Re-apply filters to update filtered list
      } catch (err) {
        console.error('Error suspending organization:', err);
        alert('Failed to update organization. Please try again.');
      }
    }
  };

  /**
   * Initiate organization deletion process
   * Opens confirmation modal instead of immediate deletion
   */
  const handleDeleteOrganization = async (org: Organization) => {
    setOrganizationToDelete(org);
    setDeleteModalOpen(true);
  };

  /**
   * Execute organization deletion after user confirmation
   * Calls API endpoint with authentication, then updates local state
   * Handles cleanup of modal state on success or failure
   */
  const handleConfirmDelete = async () => {
    if (!organizationToDelete) return;
    
    try {
      // Ensure user is authenticated before making API call
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const token = await user.getIdToken();
      
      // Call deletion API with authentication
      const response = await fetch('/api/organizations/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId: organizationToDelete.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }
      
      // Remove organization from local state
      const updatedOrgs = organizations.filter(o => o.id !== organizationToDelete.id);
      setOrganizations(updatedOrgs);
      applyFilters();
      
      // Clean up modal state
      setDeleteModalOpen(false);
      setOrganizationToDelete(null);
    } catch (err) {
      console.error('Error deleting organization:', err);
      alert('Failed to delete organization. Please try again.');
    }
  };

  /**
   * Update organization's subscription plan
   * Updates database, local state, and closes management modal
   */
  const handlePlanChange = async (organizationId: string, newPlan: SubscriptionPlan) => {
    try {
      // Update plan in database
      await updateOrganization(organizationId, { 
        plan: newPlan,
        updatedAt: new Date()
      });
      
      // Update local state to reflect changes
      const updatedOrgs = organizations.map(org => {
        if (org.id === organizationId) {
          return { ...org, plan: newPlan, updatedAt: new Date() };
        }
        return org;
      });
      
      setOrganizations(updatedOrgs);
      applyFilters();
      
      // Close management modal and clear selection
      setIsManageModalOpen(false);
      setSelectedOrganization(null);
    } catch (err) {
      console.error('Error updating organization plan:', err);
      alert('Failed to update organization plan. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Organization Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage organizations and their resources</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Filter Organizations</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                placeholder="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
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
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => {
                setSearchQuery('');
                setPlanFilter('');
                setStatusFilter('');
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

      {/* Organizations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Organizations</h2>
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
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading organizations...</p>
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
                  Organization
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>

                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedOrganizations.length > 0 ? (
                  paginatedOrganizations.map((org) => (
                <tr key={org.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-bold">
                        {org.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {org.memberCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      type="status" 
                      value={org.suspended ? 'suspended' : org.onTrial ? 'pending' : 'active'} 
                      size="sm" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(org.createdAt)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => {
                        setSelectedOrganization(org);
                        setIsManageModalOpen(true);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                    >
                      Manage
                    </button>
                    <button 
                      onClick={() => handleSuspendOrganization(org)}
                      className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 mr-3"
                    >
                      {org.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button 
                      onClick={() => handleDeleteOrganization(org)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      {filteredOrganizations.length === 0 ? 'No organizations found' : 'No organizations on this page'}
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
                Showing <span className="font-medium">{filteredOrganizations.length > 0 ? startIndex : 0}</span> to <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{filteredOrganizations.length}</span> results
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
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

      {/* Plan Management Modal */}
      {isManageModalOpen && selectedOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Manage Organization Plan</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Update the subscription plan for <strong>{selectedOrganization.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Plan</label>
              <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                {selectedOrganization.plan}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select New Plan</label>
              <div className="space-y-2">
                {(['free', 'starter', 'professional', 'enterprise'] as SubscriptionPlan[]).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => handlePlanChange(selectedOrganization.id, plan)}
                    disabled={plan === selectedOrganization.plan}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      plan === selectedOrganization.plan
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{plan}</span>
                      {plan === selectedOrganization.plan && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">Current</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsManageModalOpen(false);
                  setSelectedOrganization(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Organization Modal */}
      {deleteModalOpen && organizationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Remove Organization</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to permanently remove <strong>{organizationToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This will permanently delete the organization and all its data and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setDeleteModalOpen(false);
                  setOrganizationToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove Organization
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}