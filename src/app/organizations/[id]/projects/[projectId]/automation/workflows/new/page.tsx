'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { hasOrganizationPermission, getOrganization } from '@/lib/firebase/organizationService';
import { getDocument } from '@/lib/firebase/firestoreService';
import WorkflowAutomation from '@/components/dashboard/WorkflowAutomation';
import { ArrowLeft } from 'lucide-react';
import { Organization, Project } from '@/lib/types/organization';

export default function NewWorkflowPage() {
  // Extract route parameters for organization and project IDs
  const { id, projectId } = useParams();
  const router = useRouter();
  
  // Component state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  
  // Get current authenticated user
  const { user } = useAuth();
  
  // Handle potential array values from Next.js dynamic routes
  // useParams() can return string[] for catch-all routes, so we extract the first element
  const organizationId = Array.isArray(id) ? id[0] : id as string;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId as string;

  // Load organization and project data with permission validation
  useEffect(() => {
    const loadData = async () => {
      // Early return if required data is missing
      if (!user || !organizationId || !projectIdString) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has at least 'member' permission for automation features
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'member');
        
        if (!permission) {
          setError('You do not have permission to access automation features.');
          return;
        }

        // Fetch organization and project data in parallel for better performance
        const [orgData, projectData] = await Promise.all([
          getOrganization(organizationId),
          getDocument('projects', projectIdString) as Promise<Project | null>
        ]);

        setOrganization(orgData);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load organization or project data. Please try again.');
      } finally {
        // Ensure loading state is cleared regardless of success/failure
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, organizationId, projectIdString]); // Re-run when user or route params change

  // Navigate back to the project page
  const handleBack = () => {
    router.push(`/organizations/${organizationId}/projects/${projectIdString}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state with back navigation option
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need member or higher permissions to access automation features.
        </p>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>
    );
  }

  // Render the main workflow creation interface
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Manual Workflow</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Build a new manual workflow for {project?.name || 'your project'} in {organization?.name || 'your organization'} - will run only when you execute it
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {user && (
            <WorkflowAutomation 
              projectId={projectIdString}
              currentUser={user.uid}
              organizationId={organizationId}
            />
          )}
        </div>
      </div>
    </div>
  );
}