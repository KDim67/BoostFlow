'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import WorkflowAutomation from '@/components/dashboard/WorkflowAutomation';

export default function ProjectAutomationPage() {
  const { id, projectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const organizationId = Array.isArray(id) ? id[0] : id;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'member');
        
        if (!permission) {
          setError('You do not have permission to access automation features.');
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setError('Failed to verify permissions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user, organizationId]);

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
          You need member or higher permissions to access automation features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Automation</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Create and manage automated workflows for this project
            </p>
          </div>
        </div>

        {user && (
          <WorkflowAutomation 
            projectId={projectIdString} 
            currentUser={user.uid} 
          />
        )}
      </div>
    </div>
  );
}