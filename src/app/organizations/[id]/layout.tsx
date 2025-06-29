'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getDocument } from '@/lib/firebase/firestoreService';
import { Organization } from '@/lib/types/organization';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import Badge from '@/components/Badge';

/**
 * OrganizationLayout - Layout component for organization pages
 * 
 * Provides a consistent layout structure for all organization-related pages including:
 * - Authentication and permission checks
 * - Organization header with logo and metadata
 * - Breadcrumb navigation
 * - Logo upload functionality for authorized users
 * 
 * @param children - Child components to render within the layout
 */

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Extract organization ID from URL parameters
  const { id } = useParams();
  
  // State management for organization data and UI
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('projects'); // Currently unused but reserved for future tabs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  
  // External hooks for authentication and file operations
  const { user, loading: authLoading } = useAuth();
  const { uploading, uploadOrganizationLogo } = useFileUpload();
  
  // Project-specific state for breadcrumb navigation
  const [projectName, setProjectName] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();
  
  // Handle both string and array ID formats from Next.js params
  const organizationId = Array.isArray(id) ? id[0] : id;

  // Determine if current page is a project detail page for breadcrumb logic
  const isProjectPage = pathname?.includes('/projects/') && pathname?.split('/').length > 4;
  const projectId = isProjectPage ? pathname?.split('/')[4] : null;

  // Main data fetching effect - runs when authentication completes
  useEffect(() => {
    /**
     * Fetches organization data and validates user permissions
     * Also fetches project name if on a project detail page for breadcrumbs
     */
    const fetchOrganizationData = async () => {
      // Wait for user authentication and organization ID
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has at least viewer permission for this organization
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        setHasPermission(permission);
        
        // Early return if user lacks permission
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }

        // Fetch organization details
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);

        // If on a project page, fetch project name for breadcrumb display
        if (isProjectPage && projectId) {
          const projectData = await getDocument('projects', projectId);
          if (projectData) {
            setProjectName(projectData.name);
          }
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setError('Failed to load organization data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data after authentication is complete
    if (!authLoading) {
      fetchOrganizationData();
    }
  }, [user, organizationId, isProjectPage, projectId, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  // Redirect unauthenticated users to login with clear messaging
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            You need to be logged in to view this organization. Please sign in to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Handles organization logo upload with success/error callbacks
   * Updates local state and dispatches global event for cross-component updates
   */
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organizationId) return;

    try {
      const result = await uploadOrganizationLogo(file, organizationId, {
        onSuccess: (result) => {
          // Update local organization state with new logo URL
          if (organization) {
            setOrganization({
              ...organization,
              logoUrl: result.url
            });
          }
          // Dispatch event to update organization logo across the app
          window.dispatchEvent(new CustomEvent('organizationLogoUpdated', {
            detail: { organizationId, logoUrl: result.url }
          }));
          setShowImageUpload(false);
        },
        onError: (error) => {
          console.error('Logo upload failed:', error);
          setError('Failed to upload logo. Please try again.');
        }
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      setError('Failed to upload logo. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading organization...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Organization Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative group mr-6">
                {organization.logoUrl ? (
                  <img src={organization.logoUrl} alt={organization.name} className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-2xl">
                      {organization.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Upload overlay for users with access */}
                {hasPermission && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                       onClick={() => setShowImageUpload(true)}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{organization.name}</h1>
              {organization.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{organization.description}</p>
              )}
              <div className="mt-2">
                <Badge
                  type="plan"
                  value={organization.plan}
                  size="sm"
                  variant="with-icon"
                />
              </div>
            </div>

            {/* Quick upload button for users with access */}
            {hasPermission && (
              <button
                onClick={() => setShowImageUpload(true)}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {organization.logoUrl ? 'Change Logo' : 'Add Logo'}
              </button>
            )}
          </div>

          {/* Image Upload Modal */}
          {showImageUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Upload Organization Logo
                </h3>

                <div className="space-y-4">
                  <input
                    type="file"
                    id="logoUploadModal"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 5MB. Recommended size: 256x256px
                  </p>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowImageUpload(false)}
                      disabled={uploading}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {uploading && (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/organizations" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Organizations
              </Link>
            </li>
            <li className="text-gray-500 dark:text-gray-400">/</li>
            <li>
              {pathname?.endsWith('/projects') ? (
                <span className="text-gray-900 dark:text-white font-medium">Projects</span>
              ) : (
                <Link href={`/organizations/${organizationId}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Projects
                </Link>
              )}
            </li>
            {isProjectPage && projectName ? (
              <>
                <li className="text-gray-500 dark:text-gray-400">/</li>
                <li className="text-gray-900 dark:text-white font-medium">{projectName}</li>
              </>
            ) : null}
          </ol>
        </nav>

        {/* Organization Content */}
        {children}
      </div>
    </div>
  );
}