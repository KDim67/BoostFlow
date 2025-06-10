'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { Organization } from '@/lib/types/organization';
import { useFileUpload } from '@/lib/hooks/useFileUpload';

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const { user } = useAuth();
  const { uploading, uploadOrganizationLogo } = useFileUpload();
  const router = useRouter();
  const organizationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        setHasPermission(permission);
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization details
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setError('Failed to load organization data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationData();
  }, [user, organizationId]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organizationId) return;

    try {
      const result = await uploadOrganizationLogo(file, organizationId, {
        onSuccess: (result) => {
          if (organization) {
            setOrganization({
              ...organization,
              logoUrl: result.url
            });
          }
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Dashboard
              </Link>
            </li>
            <li className="text-gray-500 dark:text-gray-400">/</li>
            <li>
              <Link href="/organizations" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Organizations
              </Link>
            </li>
            <li className="text-gray-500 dark:text-gray-400">/</li>
            <li className="text-gray-900 dark:text-white font-medium">{organization.name}</li>
          </ol>
        </nav>

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
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{organization.name}</h1>
                {organization.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{organization.description}</p>
                )}
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)} Plan
                  </span>
                </div>
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

        {/* Organization Content */}
        {children}
      </div>
    </div>
  );
}