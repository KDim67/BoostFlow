'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getDocument } from '@/lib/firebase/firestoreService';
import { Organization } from '@/lib/types/organization';

/**
 * ProjectLayout Component
 * 
 * A layout wrapper for project pages that handles:
 * - User authentication and authorization
 * - Organization and project data fetching
 * - Permission validation (minimum 'viewer' role required)
 * - Loading states and error handling
 * 
 * This component ensures users can only access projects within organizations
 * they have permission to view.
 */
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Extract dynamic route parameters from URL
  const { id, projectId } = useParams();
  
  // Component state management
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Authentication and navigation hooks
  const { user } = useAuth();
  const router = useRouter();
  
  // Normalize route parameters (handle both string and array cases)
  const organizationId = Array.isArray(id) ? id[0] : id;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

  // Effect to fetch and validate organization/project data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Early return if required data is missing
      if (!user || !organizationId || !projectIdString) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has minimum 'viewer' permission for the organization
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization data after permission validation
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        // Fetch project details for display purposes
        const projectData = await getDocument('projects', projectIdString);
        if (projectData) {
          setProjectName(projectData.name);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, organizationId, projectIdString]); // Re-run when dependencies change

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
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
    <div className="space-y-6">
      {/* Project Content */}
      {children}
    </div>
  );
}