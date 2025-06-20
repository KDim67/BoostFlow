'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { hasOrganizationPermission, getOrganization } from '@/lib/firebase/organizationService';
import { getDocument } from '@/lib/firebase/firestoreService';
import WorkflowList from '@/components/dashboard/WorkflowList';

import { useRouter } from 'next/navigation';
import { Organization, Project } from '@/lib/types/organization';

export default function ProjectWorkflowsPage() {
  const { id, projectId } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const { user } = useAuth();
  const organizationId = Array.isArray(id) ? id[0] : id as string;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId as string;

  useEffect(() => {
    const loadData = async () => {
      if (!user || !organizationId || !projectIdString) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'member');
        
        if (!permission) {
          setError('You do not have permission to access workflows features.');
          return;
        }

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
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, organizationId, projectIdString]);

  const handleCreateWorkflow = () => {
    router.push(`/organizations/${organizationId}/projects/${projectIdString}/automation/workflows/new`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need member or higher permissions to access workflows features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project?.name || 'Project'} Workflows</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Create and manage workflows for {project?.name || 'this project'} in {organization?.name || 'your organization'}
              </p>
            </div>
          </div>
          

        </div>

        <div className="p-6">
          {user && projectIdString && (
            <WorkflowList 
              projectId={projectIdString}
              organizationId={organizationId}
              currentUser={user.uid}
              onCreateWorkflow={handleCreateWorkflow}
            />
          )}
        </div>
      </div>
    </div>
  );
}