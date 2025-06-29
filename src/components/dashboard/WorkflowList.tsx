'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow, getWorkflowsByProject, deleteWorkflow, executeWorkflow } from '@/lib/services/automation/workflowService';
import { getUserProfile, UserProfile } from '@/lib/firebase/userProfileService';
import { Play, Edit, Trash2, Plus, Clock, User, Calendar } from 'lucide-react';

/**
 * Props interface for the WorkflowList component
 * Defines the required data and callbacks for workflow management
 */
interface WorkflowListProps {
  projectId: string;
  organizationId: string;
  currentUser: string;
  onCreateWorkflow: () => void;
}

/**
 * WorkflowList component displays and manages manual workflows for a project
 * Provides functionality to view, run, edit, and delete workflows
 * All workflows are manual execution only - no automatic triggers
 */
export default function WorkflowList({
  projectId,
  organizationId,
  currentUser,
  onCreateWorkflow
}: WorkflowListProps) {
  // Core workflow data and UI state
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track individual workflow operations to show loading states
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);
  const [executingWorkflowId, setExecutingWorkflowId] = useState<string | null>(null);
  
  // Cache user display names to avoid repeated API calls
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const router = useRouter();

  // Load workflows when component mounts or projectId changes
  useEffect(() => {
    loadWorkflows();
  }, [projectId]);

  /**
   * Loads workflows for the current project and resolves user display names
   * Fetches user profiles in parallel to build a name cache for better UX
   */
  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projectWorkflows = await getWorkflowsByProject(projectId);
      setWorkflows(projectWorkflows);
      
      // Extract unique user IDs to minimize API calls
      const uniqueUserIds = [...new Set(projectWorkflows.map(w => w.createdBy))];
      const userNameMap: Record<string, string> = {};
      
      // Fetch all user profiles in parallel for better performance
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const userProfile = await getUserProfile(userId);
            if (userProfile) {
              let displayName = userProfile.displayName;
              
              // Fallback hierarchy: displayName -> firstName lastName -> firstName -> lastName -> email -> userId
              if (!displayName && userProfile.firstName && userProfile.lastName) {
                displayName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
              } else if (!displayName && userProfile.firstName) {
                displayName = userProfile.firstName;
              } else if (!displayName && userProfile.lastName) {
                displayName = userProfile.lastName;
              }
              
              userNameMap[userId] = displayName || userProfile.email || userId;
            } else {
              // Fallback to userId if profile not found
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

  /**
   * Navigates to the workflow editor page for the specified workflow
   */
  const handleEditWorkflow = (workflowId: string) => {
    router.push(`/organizations/${organizationId}/projects/${projectId}/automation/workflows/${workflowId}`);
  };

  /**
   * Deletes a workflow after user confirmation
   * Updates local state immediately for optimistic UI updates
   */
  const handleDeleteWorkflow = async (workflowId: string) => {
    // Require explicit user confirmation for destructive action
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingWorkflowId(workflowId); // Show loading state on specific workflow
      await deleteWorkflow(workflowId);
      // Update UI by filtering out deleted workflow
      setWorkflows(workflows.filter(w => w.id !== workflowId));
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setError('Failed to delete workflow');
    } finally {
      setDeletingWorkflowId(null);
    }
  };

  /**
   * Executes a workflow with proper validation and error handling
   * Only actve workflows can be executed
   */
  const handleRunWorkflow = async (workflow: Workflow) => {
    // Prevent execution of disabled workflows
    if (!workflow.isActive) {
      setError('Cannot run disabled workflow. Please enable it first.');
      return;
    }

    try {
      setExecutingWorkflowId(workflow.id); // Show loading state for this specific workflow
      setError(null);
      
      // Execute workflow with full context for proper authorization and data access
      const executionContext = await executeWorkflow(workflow.id, {
        projectId: projectId,
        currentUser: currentUser,
        organizationId: organizationId
      });
      
      // Handle execution results with appropriate user feedback
      if (executionContext.status === 'completed') {
        alert('Workflow executed successfully!');
      } else if (executionContext.status === 'failed') {
        setError(`Workflow execution failed: ${executionContext.error}`);
      }
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError('Failed to execute workflow');
    } finally {
      setExecutingWorkflowId(null);
    }
  };

  /**
   * Formats dates in a consistent, user-friendly format
   * Uses browser's locale-aware formatting for better internationalization
   */
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Show loading spinner while fetching workflows
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state with retry option
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
            Manual Workflows
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create workflows that run when you need them - all workflows require manual execution
          </p>
        </div>
        <button
          onClick={onCreateWorkflow}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Manual Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No manual workflows yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Create your first manual workflow that you can run when needed.
          </p>
          <button
            onClick={onCreateWorkflow}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Manual Workflow
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
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {workflow.isActive ? 'Ready to Run' : 'Disabled'}
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
                    onClick={() => handleRunWorkflow(workflow)}
                    disabled={!workflow.isActive || executingWorkflowId === workflow.id}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      workflow.isActive
                        ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                        : 'text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {executingWorkflowId === workflow.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500 mr-1"></div>
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    {executingWorkflowId === workflow.id ? 'Running...' : 'Run'}
                  </button>
                  
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