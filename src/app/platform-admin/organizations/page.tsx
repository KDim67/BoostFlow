'use client';

import React, { useEffect, useState } from 'react';
import { Metadata } from 'next';
import { getAllOrganizations, updateOrganization } from '@/lib/firebase/organizationService';
import { Organization } from '@/lib/types/organization';
import { timestampToDate } from '@/lib/firebase/firestoreService';
import { CSVLink } from 'react-csv';

export default function OrganizationManagementPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  const getCsvData = () => {
    return filteredOrganizations.map(org => ({
      Name: org.name,
      Plan: org.plan,
      Users: org.memberCount || 0,
      Status: org.suspended ? 'Suspended' : 'Active',
      Created: org.createdAt ? formatDate(org.createdAt) : 'N/A',
      Storage: `${org.storageUsed || 0} GB / ${org.planFeatures?.maxStorage || 0} GB`
    }));
  };

  const csvHeaders = [
    { label: 'Name', key: 'Name' },
    { label: 'Plan', key: 'Plan' },
    { label: 'Users', key: 'Users' },
    { label: 'Status', key: 'Status' },
    { label: 'Created', key: 'Created' },
    { label: 'Storage', key: 'Storage' }
  ];

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const orgs = await getAllOrganizations();
        setOrganizations(orgs);
        setFilteredOrganizations(orgs);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to load organizations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, planFilter, statusFilter, organizations]);

  const applyFilters = () => {
    let result = [...organizations];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(org => 
        org.name.toLowerCase().includes(query)
      );
    }
    
    if (planFilter) {
      result = result.filter(org => org.plan === planFilter.toLowerCase());
    }
    
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
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleSuspendOrganization = async (org: Organization) => {
    if (confirm(`Are you sure you want to ${org.suspended ? 'unsuspend' : 'suspend'} ${org.name}?`)) {
      try {
        await updateOrganization(org.id, { 
          suspended: !org.suspended,
          updatedAt: new Date()
        });
        
        const updatedOrgs = organizations.map(o => {
          if (o.id === org.id) {
            return { ...o, suspended: !o.suspended, updatedAt: new Date() };
          }
          return o;
        });
        
        setOrganizations(updatedOrgs);
        applyFilters();
      } catch (err) {
        console.error('Error suspending organization:', err);
        alert('Failed to update organization. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Organization Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage organizations and their resources</p>
        </div>
        <div className="flex space-x-3">
          <CSVLink 
            data={getCsvData()} 
            headers={csvHeaders}
            filename={`organizations-export-${new Date().toISOString().split('T')[0]}.csv`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data
          </CSVLink>
          <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Organization
          </button>
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
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Organizations</h2>
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
                  Storage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((org) => (
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
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      org.suspended ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                      org.onTrial ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {org.suspended ? 'Suspended' : org.onTrial ? 'Trial' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(org.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      {`${org.storageUsed || 0} GB / ${org.planFeatures?.maxStorage || 0} GB`}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            (org.storageUsed || 0) / (org.planFeatures?.maxStorage || 1) > 0.8 ? 'bg-yellow-500' :
                            (org.storageUsed || 0) / (org.planFeatures?.maxStorage || 1) > 0.6 ? 'bg-green-500' : 'bg-blue-500'
                          }`} 
                          style={{ width: `${Math.min(((org.storageUsed || 0) / (org.planFeatures?.maxStorage || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3">Manage</button>
                    <button 
                      onClick={() => handleSuspendOrganization(org)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      {org.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No organizations found
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
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOrganizations.length}</span> of{' '}
                <span className="font-medium">{filteredOrganizations.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-indigo-50 dark:bg-indigo-900/20 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                  1
                </button>

                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}