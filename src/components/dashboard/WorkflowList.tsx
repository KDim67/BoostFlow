'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow, getWorkflowsByProject, deleteWorkflow } from '@/lib/services/automation/workflowService';
import { getUserProfile, UserProfile } from '@/lib/firebase/userProfileService';
import { Play, Edit, Trash2, Plus, Clock, User, Calendar } from 'lucide-react';

interface WorkflowListProps {
  projectId: string;
  organizationId: string;
  currentUser: string;
  onCreateWorkflow: () => void;
}

export default function WorkflowList({
  projectId,
  organizationId,
  currentUser,
  onCreateWorkflow
}: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    loadWorkflows();
  }, [projectId]);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projectWorkflows = await getWorkflowsByProject(projectId);
      setWorkflows(projectWorkflows);
      
      const uniqueUserIds = [...new Set(projectWorkflows.map(w => w.createdBy))];
      const userNameMap: Record<string, string> = {};
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const userProfile = await getUserProfile(userId);
            if (userProfile) {
              userNameMap[userId] = userProfile.displayName || userProfile.firstName && userProfile.lastName 
                ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
                : userProfile.email || userId;
            } else {
              userNameMap[userId] = userId;
            }
          } catch (error) {
            console.error(`Error fetching user profile for ${userId}:`, error);
            userNameMap[userId] = userId;
          }
        })
      );
      
      setUserNames(userNameMap);
    } catch (err) {
      console.error('Error loading workflows:', err);
      setError('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWorkflow = (workflowId: string) => {
    router.push(`/organizations/${organizationId}/projects/${projectId}/automation/workflows/${workflowId}`);
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingWorkflowId(workflowId);
      await deleteWorkflow(workflowId);
      setWorkflows(workflows.filter(w => w.id !== workflowId));
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setError('Failed to delete workflow');
    } finally {
      setDeletingWorkflowId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={loadWorkflows}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Workflows
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage automated workflows for this project
          </p>
        </div>
        <button
          onClick={onCreateWorkflow}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No workflows yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Create your first workflow to automate tasks and processes in this project.
          </p>
          <button
            onClick={onCreateWorkflow}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Workflow
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {workflow.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        workflow.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {workflow.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Created by {userNames[workflow.createdBy] || workflow.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(workflow.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{workflow.steps.length} steps</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditWorkflow(workflow.id)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    disabled={deletingWorkflowId === workflow.id}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingWorkflowId === workflow.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500 mr-1"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}