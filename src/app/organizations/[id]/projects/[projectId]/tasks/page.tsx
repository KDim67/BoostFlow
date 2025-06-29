'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { queryDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { where, serverTimestamp } from 'firebase/firestore';
import { Organization } from '@/lib/types/organization';

import Badge from '@/components/Badge';

/**
 * Task interface defining the structure of a project task
 * Contains all necessary fields for task management including status tracking,
 * assignment, priority levels, and time tracking capabilities
 */
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed'; // Task workflow states
  priority: 'low' | 'medium' | 'high'; // Priority levels for task organization
  dueDate: string;
  projectId?: string; // Optional project association
  assignedTo?: string; // User ID of assignee
  assignee?: string; // Display name of assignee
  hoursTracked?: number; // Time tracking functionality
  timeSpent?: number; // Actual time spent on task
  organizationId: string; // Required organization context
  createdBy: string; // User ID of task creator
  createdAt: any; // Firestore timestamp
  completedAt?: any; // Completion timestamp for analytics
}

/**
 * Team member interface for task assignment dropdown
 * Represents users who can be assigned to tasks within the project
 */
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string; // Team role for permission context
}

/**
 * Main component for managing tasks within an organization's project
 * Handles task CRUD operations, permission checking, and UI state management
 * Uses dynamic routing parameters for organization and project context
 */
export default function OrganizationProjectsTasks() {
  // Extract route parameters (can be arrays in Next.js dynamic routes)
  const { id, projectId } = useParams();
  
  // Core data state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // Controls which task dropdown is open
  
  // Authentication context
  const { user } = useAuth();
  
  // Normalize route parameters
  const organizationId = Array.isArray(id) ? id[0] : id;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

  // Effect hook to fetch all necessary data when component mounts or dependencies change
  useEffect(() => {
    /**
     * Fetches tasks, organization data, and team members with permission validation
     * Implements proper error handling and loading states
     */
    const fetchTasksData = async () => {
      // Early return if required data is missing
      if (!user || !organizationId || !projectIdString) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check user permissions before fetching sensitive data
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization details for context
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        // Fetch tasks filtered by organization and project
        const tasksData = await queryDocuments('tasks', [
          where('organizationId', '==', organizationId),
          where('projectId', '==', projectIdString)
        ]);
        setTasks(tasksData as Task[]);
        
        // Fetch team members for task assignment dropdown
        const teamMembersData = await queryDocuments('projectMembers', [
          where('projectId', '==', projectIdString)
        ]);
        setTeamMembers(teamMembersData as TeamMember[]);
      } catch (error) {
        console.error('Error fetching tasks data:', error);
        setError('Failed to load tasks data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasksData();
  }, [user, organizationId, projectIdString]); // Re-run when user or route params change

  // Loading state with spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state or missing organization data
  if (error || !organization) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error || 'Organization not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The organization you're looking for doesn't exist or you don't have permission to view it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tasks Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Project Tasks
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage and track tasks for this project
            </p>
          </div>
          <Link 
            href={`/organizations/${organizationId}/projects/${projectIdString}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Project
          </Link>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Tasks</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first task to get started</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Task
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => (
              <li key={task.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-1">
                    {/* Task completion checkbox with updates */}
                    <input 
                      type="checkbox" 
                      checked={task.status === 'completed'}
                      onChange={async () => {
                        try {
                          // Toggle between completed and pending states
                          const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                          const updateData: any = { status: newStatus };
                          
                          // Set completion timestamp when marking as completed
                          if (newStatus === 'completed') {
                            updateData.completedAt = serverTimestamp();
                          } else {
                            // Clear completion timestamp when unmarking
                            updateData.completedAt = null;
                          }
                          
                          // Update in Firestore
                          await updateDocument('tasks', task.id, updateData);
                          
                          // Update local state for immediate UI feedback
                          setTasks(tasks.map(t => 
                            t.id === task.id ? { 
                              ...t, 
                              status: newStatus,
                              completedAt: newStatus === 'completed' ? new Date() : undefined
                            } : t
                          ));
                        } catch (error) {
                          console.error('Error updating task status:', error);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" 
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge type="priority" value={task.priority} variant="with-icon" size="md" />
                        {/* Task actions dropdown menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === task.id ? null : task.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {/* Dropdown menu */}
                          {openDropdownId === task.id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                              {/* Edit task option */}
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsModalOpen(true);
                                  setOpenDropdownId(null); // Close dropdown
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              {/* Delete task option */}
                              <button
                                onClick={async () => {
                                  try {
                                    // Delete from Firestore
                                    await deleteDocument('tasks', task.id);
                                    // Remove from local state for immediate UI update
                                    setTasks(tasks.filter(t => t.id !== task.id));
                                    setOpenDropdownId(null); // Close dropdown
                                  } catch (error) {
                                    console.error('Error deleting task:', error);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          type="status" 
                          value={task.status} 
                          variant="with-icon" 
                          size="sm" 
                        />
                        {task.assignee && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                            {task.assignee}
                          </span>
                        )}
                      </div>
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={() => {
            // Close modal and reset editing state
            setIsModalOpen(false);
            setEditingTask(null);
          }} 
          editingTask={editingTask}
          organizationId={organizationId}
          projectId={projectIdString}
          onTaskCreated={(newTask) => {
            // Add new task to local state for immediate UI update
            setTasks([...tasks, newTask]);
          }}
          onTaskUpdated={(updatedTask) => {
            // Update existing task in local state
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
          }} 
        />
      )}
    </div>
  );
}

/**
 * TaskModal - Modal component for creating and editing tasks
 * Handles form state, validation, and submission for task operations
 */
function TaskModal({ isOpen, onClose, editingTask, organizationId, projectId, onTaskCreated, onTaskUpdated }: TaskModalProps) {
  // Early return if required props are missing
  if (!organizationId || !projectId) return null;
  
  // Determine if we're editing an existing task or creating a new one
  const isEditing = !!editingTask;
  
  // Form state - initialized with editing task data or defaults
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(editingTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(editingTask?.dueDate || '');
  const [assignee, setAssignee] = useState(editingTask?.assignee || '');
  const [status, setStatus] = useState(editingTask?.status || 'pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { user } = useAuth();
  
  // Reset form fields when modal opens or editing task changes
  useEffect(() => {
    if (isOpen) {
      setTitle(editingTask?.title || '');
      setDescription(editingTask?.description || '');
      setPriority(editingTask?.priority || 'medium');
      setDueDate(editingTask?.dueDate || '');
      setAssignee(editingTask?.assignee || '');
      setStatus(editingTask?.status || 'pending');
    }
  }, [isOpen, editingTask]);
  
  // Fetch team members for assignee dropdown when modal opens
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!isOpen || !projectId || !organizationId) return;
      try {
        const membersData = await queryDocuments('team', [
          where('organizationId', '==', organizationId),
          where('projectId', '==', projectId)
        ]);
        setTeamMembers(membersData as TeamMember[]);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };
    fetchTeamMembers();
  }, [isOpen, projectId, organizationId]);

  /**
   * Handle form submission for creating or updating tasks
   * Manages completion timestamps and optimistic UI updates
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure user is authenticated before proceeding
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      if (isEditing && editingTask) {
        // Update existing task
        const updateData: any = {
          title,
          description,
          priority,
          dueDate,
          assignee: assignee || 'Unassigned',
          assignedTo: assignee || undefined,
          status,
        };
        
        // Handle completion timestamp logic
        if (status === 'completed' && editingTask.status !== 'completed') {
          // Task is being marked as completed
          updateData.completedAt = serverTimestamp();
        } else if (status !== 'completed') {
          // Task is being unmarked as completed
          updateData.completedAt = null;
        }
        
        // Update task in Firestore
        await updateDocument('tasks', editingTask.id, updateData);
        
        // Update local state with UI update
        onTaskUpdated({
          ...editingTask,
          ...updateData,
          completedAt: status === 'completed' && editingTask.status !== 'completed' ? new Date() : editingTask.completedAt,
        });
      } else {
        // Create new task
        const taskData = {
          title,
          description,
          priority,
          dueDate,
          assignee: assignee || 'Unassigned',
          assignedTo: assignee || undefined,
          status: 'pending' as const, // New tasks always start as pending
          organizationId,
          projectId,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          timeSpent: 0, // Initialize time tracking
        };
        
        // Create task in Firestore and get the new ID
        const newTaskId = await createDocument('tasks', taskData);
        
        // Add to local state with UI update
        onTaskCreated({
          id: newTaskId,
          ...taskData,
          createdAt: new Date(), // Use local timestamp for immediate UI update
        });
      }
      
      // Close modal on successful submission
      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} task:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render modal if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          {isEditing && (
            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pending' | 'in-progress' | 'completed')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="pending">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
            <select
              id="task-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="task-dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input
              type="date"
              id="task-dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Props interface for the TaskModal component
 * Defines the contract for modal behavior and task operations
 */
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  organizationId: string | undefined;
  projectId: string | undefined;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
}