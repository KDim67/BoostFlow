'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { useOrganization } from '@/lib/firebase/OrganizationProvider';
import { OrganizationWithDetails } from '@/lib/types/organization';

/**
 * OrganizationSelector - A dropdown component for switching between organizations
 * Displays the current organization and allows users to select a different one
 * Shows different UI states based on loading, empty organizations, or organization management page
 */
export default function OrganizationSelector() {
  // Controls the dropdown open/closed state
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { 
    activeOrganization, 
    organizations, 
    isLoading, 
    setActiveOrganization 
  } = useOrganization();

  // Check if user is currently on the organizations management page
  const isOnOrganizationsPage = pathname === '/organizations';

  /**
   * Handles organization selection from dropdown
   * Updates the active organization and navigates to its page
   */
  const handleOrganizationSelect = (org: OrganizationWithDetails) => {
    setActiveOrganization(org);
    setIsOpen(false); // Close dropdown after selection
    router.push(`/organizations/${org.id}`);
  };

  // Show loading state while data is being fetched or user is not authenticated
  if (isLoading || !user) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  // Show create organization link when user has no organizations
  if (organizations.length === 0) {
    return (
      <Link 
        href="/organizations"
className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Create Organization
      </Link>
    );
  }

  return (
    <div className="relative">
      {/* Main dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        {/* Show organization logo/avatar only when not on organizations page */}
        {!isOnOrganizationsPage && (
          activeOrganization?.logoUrl ? (
            <img 
              src={activeOrganization.logoUrl} 
              alt={activeOrganization.name} 
              className="w-6 h-6 rounded-full" 
            />
          ) : (
            // Fallback avatar with organization initials
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-xs">
                {activeOrganization?.name.substring(0, 2).toUpperCase() || 'OR'}
              </span>
            </div>
          )
        )}
        {/* Dynamic button text based on current page and organization state */}
        <span>{isOnOrganizationsPage ? 'Manage Organizations' : (activeOrganization?.name || 'Select Organization')}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {/* List of available organizations */}
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org)}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${activeOrganization?.id === org.id ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                role="menuitem"
              >
                {/* Organization logo or fallback avatar */}
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="w-5 h-5 rounded-full mr-3" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold text-xs">
                      {org.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                {org.name}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
              <Link
                href="/organizations"
className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                Manage Organizations
              </Link>
              <Link
                href="/organizations"
className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                Create New Organization
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}