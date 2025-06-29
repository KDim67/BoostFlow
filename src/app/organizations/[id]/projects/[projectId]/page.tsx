'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getDocument, queryDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import { Organization } from '@/lib/types/organization';

import Badge from '@/components/Badge';
import OrganizationProjectsTasks from './tasks/page';
import OrganizationProjectsTeam from './team/page';
import ProjectDocumentsPage from './documents/page';
import OrganizationProjectsAnalytics from './analytics/page';
import ProjectWorkflowsPage from './automation/page';

// Interface for individual task items within a project
interface Task {
  id: string;
  title: string;
  status: string; // 'pending' | 'in-progress' | 'completed'
  assignee: string;
  dueDate: string;
  priority: string; // 'low' | 'medium' | 'high'
}

// Interface for project milestones with strict status typing
interface Milestone {
  id: string;
  title: string;
  description?: string; // Optional milestone description
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  projectId: string; // Foreign key to parent project
  createdBy: string; // User ID who created the milestone
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

// Interface for team member information
interface TeamMember {
  id: string;
  name: string;
  role: string; // Job title or project role
  avatar: string; // URL to profile image
}

// Main project interface with all related data
interface Project {
  id: string;
  name: string;
  description: string;
  progress: number; // Percentage completion (0-100)
  status: string; // 'planning' | 'active' | 'on-hold' | 'completed'
  startDate: string;
  dueDate: string;
  client: string; // Client name or organization
  budget: string; // Project budget as string for flexibility
  organizationId: string; // Foreign key to parent organization
  createdBy: string; // User ID who created the project
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  milestones?: Milestone[];
  teamMembers?: TeamMember[];
  tasks?: Task[];
}

/**
 * ProjectDetailPage Component
 * 
 * Main component for displaying detailed project information including:
 * - Project overview with milestones and recent tasks
 * - Tabbed interface for tasks, documents, team, analytics, and workflows
 * - Modal forms for editing projects and managing milestones
 * - Permission-based access control
 */
export default function ProjectDetailPage() {
  // Extract URL parameters for organization and project IDs
  const { id, projectId } = useParams();
  
  // Core data state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  // UI state management
  const [activeTab, setActiveTab] = useState('overview'); // Controls which tab content is displayed
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetch
  const [error, setError] = useState<string | null>(null); // Error message display
  
  // Milestone modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null); // null for new, object for edit
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'Pending' as 'Completed' | 'In Progress' | 'Pending'
  });
  
  // Project edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', description: '', status: '', startDate: '', 
    dueDate: '', client: '', budget: '', progress: 0 
  });
  
  // Authentication and navigation
  const { user } = useAuth();
  const router = useRouter();
  
  // Convert URL params to strings
  const organizationId = Array.isArray(id) ? id[0] : id;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

  /**
   * Main data fetching effect
   * 
   * Handles:
   * 1. Permission verification for organization access
   * 2. Loading project, organization, tasks, milestones, and team data
   * 3. Data validation and error handling
   * 4. Cross-referencing project ownership with organization
   */
  useEffect(() => {
    const fetchProjectData = async () => {
      // Early return if required data is missing
      if (!user || !organizationId || !projectIdString) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has permission to view this organization
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization data
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        // Fetch main project document
        const projectData = await getDocument('projects', projectIdString);
        
        if (!projectData) {
          setError('Project not found');
          setIsLoading(false);
          return;
        }
        
        // Verify project belongs to the current organization (security check)
        if (projectData.organizationId !== organizationId) {
          setError('This project does not belong to the selected organization');
          setIsLoading(false);
          return;
        }
        
        setProject(projectData as Project);
        
        // Fetch related data in parallel for better performance
        const tasksData = await queryDocuments('tasks', [
          where('projectId', '==', projectIdString)
        ]);
        setTasks(tasksData as Task[]);

        const milestonesData = await queryDocuments('milestones', [
          where('projectId', '==', projectIdString)
        ]);
        setMilestones(milestonesData as Milestone[]);

        const teamData = await queryDocuments('team', [
          where('projectId', '==', projectIdString)
        ]);
        
        // Update project with team members if any exist
        if (projectData && teamData.length > 0) {
          setProject(prev => ({
            ...prev!,
            teamMembers: teamData as TeamMember[]
          }));
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Failed to load project data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [user, organizationId, projectIdString]); // Re-run when user or IDs change



  /**
   * Milestone Management Functions
   */
  
  // Initialize form for creating a new milestone
  const handleAddMilestone = () => {
    setEditingMilestone(null); // Clear editing state
    setMilestoneForm({
      title: '',
      description: '',
      dueDate: '',
      status: 'Pending'
    });
    setShowMilestoneModal(true);
  };

  // Populate form with existing milestone data for editing
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description || '',
      dueDate: milestone.dueDate,
      status: milestone.status
    });
    setShowMilestoneModal(true);
  };

  // Save milestone
  const handleSaveMilestone = async () => {
    // Validate required fields
    if (!milestoneForm.title.trim() || !milestoneForm.dueDate || !user || !projectIdString) return;

    try {
      if (editingMilestone) {
        // Update existing milestone in Firestore
        await updateDocument('milestones', editingMilestone.id, {
          title: milestoneForm.title.trim(),
          description: milestoneForm.description.trim(),
          dueDate: milestoneForm.dueDate,
          status: milestoneForm.status
        });
        
        // Update local state to reflect changes immediately
        setMilestones(prev => prev.map(m => 
          m.id === editingMilestone.id 
            ? { ...m, ...milestoneForm }
            : m
        ));
      } else {
        // Create new milestone in Firestore
        const newMilestoneId = await createDocument('milestones', {
          title: milestoneForm.title.trim(),
          description: milestoneForm.description.trim(),
          dueDate: milestoneForm.dueDate,
          status: milestoneForm.status,
          projectId: projectIdString,
          createdBy: user.uid
        });
        
        // Create local milestone object with generated ID
        const newMilestone: Milestone = {
          id: newMilestoneId,
          ...milestoneForm,
          projectId: projectIdString,
          createdBy: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add to local state for immediate UI update
        setMilestones(prev => [...prev, newMilestone]);
      }
      
      // Close modal and reset form state
      setShowMilestoneModal(false);
      setEditingMilestone(null);
    } catch (error) {
      console.error('Error saving milestone:', error);
    }
  };

  // Delete milestone with confirmation
  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    
    try {
      await deleteDocument('milestones', milestoneId);
      // Remove from local state immediately
      setMilestones(prev => prev.filter(m => m.id !== milestoneId));
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  // Quick status change for milestones
  const handleMilestoneStatusChange = async (milestoneId: string, newStatus: 'Completed' | 'In Progress' | 'Pending') => {
    try {
      await updateDocument('milestones', milestoneId, { status: newStatus });
      // Update local state for immediate feedback
      setMilestones(prev => prev.map(m => 
        m.id === milestoneId ? { ...m, status: newStatus } : m
      ));
    } catch (error) {
      console.error('Error updating milestone status:', error);
    }
  };

  /**
   * Task Management Functions
   */
  
  // Update task status with completion timestamp tracking
  const handleTaskStatusChange = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    try {
      const updateData: any = { status: newStatus };
      
      // Set completion timestamp when task is marked as completed
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null; // Clear completion time for non-completed tasks
      }
      
      await updateDocument('tasks', taskId, updateData);
      
      // Update local state for immediate UI feedback
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: newStatus,
          completedAt: updateData.completedAt
        } : t
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  /**
   * Project Management Functions
   */
  
  // Initialize project edit form with current project data
  const handleEditProject = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate || '',
      dueDate: project.dueDate,
      client: project.client || '',
      budget: project.budget || '',
      progress: project.progress
    });
    setShowEditModal(true);
  };

  // Save project changes to Firestore and update local state
  const handleSaveProject = async () => {
    // Validate required fields
    if (!project || !editForm.name.trim()) return;

    try {
      // Update project in Firestore
      await updateDocument('projects', project.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
        startDate: editForm.startDate,
        dueDate: editForm.dueDate,
        client: editForm.client.trim(),
        budget: editForm.budget.trim(),
        progress: editForm.progress
      });

      // Update local project state for immediate UI update
      setProject(prev => prev ? {
        ...prev,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
        startDate: editForm.startDate,
        dueDate: editForm.dueDate,
        client: editForm.client.trim(),
        budget: editForm.budget.trim(),
        progress: editForm.progress
      } : null);

      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !organization || !project) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error || 'Project not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The project you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link 
          href={`/organizations/${organizationId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <div className="flex items-center mt-2">
              <Badge 
                type="status" 
                value={project.status} 
                size="sm" 
              />
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Progress: {project.progress}%
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleEditProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Project
            </button>
          </div>
        </div>
      </div>

      {/* Project Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 ${activeTab === 'tasks' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 ${activeTab === 'documents' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-4 px-1 ${activeTab === 'team' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Team
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`py-4 px-1 ${activeTab === 'workflows' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Workflows
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Milestones */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Milestones</h3>
                    <button 
                      onClick={handleAddMilestone}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
                    >
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Milestone
                      </span>
                    </button>
                  </div>
                  <div className="px-6 py-5">
                    {milestones && milestones.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {milestones.map((milestone) => (
                          <li key={milestone.id} className="py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 cursor-pointer ${milestone.status === 'Completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : milestone.status === 'In Progress' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                     onClick={() => {
                                       const nextStatus = milestone.status === 'Pending' ? 'In Progress' : milestone.status === 'In Progress' ? 'Completed' : 'Pending';
                                       handleMilestoneStatusChange(milestone.id, nextStatus);
                                     }}>
                                  {milestone.status === 'Completed' ? (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : milestone.status === 'In Progress' ? (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{milestone.title}</h4>
                                  {milestone.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{milestone.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due: {milestone.dueDate}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  type="status" 
                                  value={milestone.status} 
                                  variant="with-icon" 
                                  size="sm" 
                                />
                                <button
                                  onClick={() => handleEditMilestone(milestone)}
                                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400">No milestones added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recent Tasks */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Tasks</h3>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
                    >
                      View all
                    </button>
                  </div>
                  <div className="px-6 py-5">
                    {tasks && tasks.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tasks.slice(0, 3).map((task) => (
                          <li key={task.id} className="py-4 flex items-start">
                            <div className="mr-3 pt-1">
                              <input 
                                type="checkbox" 
                                checked={task.status === 'completed'}
                                onChange={(e) => {
                                  const newStatus = e.target.checked ? 'completed' : 'pending';
                                  handleTaskStatusChange(task.id, newStatus);
                                }}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" 
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
                                <Badge type="priority" value={task.priority?.toLowerCase() as 'low' | 'medium' | 'high' || 'medium'} variant="with-icon" size="md" />
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Assigned to: {task.assignee}</span>
                                <span>Due: {task.dueDate}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400">No tasks added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Project Info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Info</h3>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{project.startDate || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{project.dueDate || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Client</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{project.client || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{project.budget || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Team Members */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Members</h3>
                  </div>
                  <div className="px-6 py-5">
                    {project.teamMembers && project.teamMembers.length > 0 ? (
                      <>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {project.teamMembers.slice(0, 5).map((member) => (
                            <li key={member.id} className="py-4 flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mr-3">
                                {member.avatar ? (
                                  <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full" />
                                ) : (
                                  member.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                        {project.teamMembers.length > 5 && (
                          <div className="mt-4 text-center">
                            <Link 
                              href={`/organizations/${organizationId}/projects/${projectId}/team`}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                            >
                              <span>View All Team Members ({project.teamMembers.length})</span>
                              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </Link>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 mx-auto mb-3">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No team members yet</p>
                        <Link href={`/organizations/${organizationId}/projects/${projectId}/team`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                          Add Team Member
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <OrganizationProjectsTasks />
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <ProjectDocumentsPage />
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <OrganizationProjectsTeam/>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <OrganizationProjectsAnalytics />
            </div>
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div>
              <ProjectWorkflowsPage />
            </div>
          )}
        </div>
      </div>
      
      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter milestone title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter milestone description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={milestoneForm.status}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, status: e.target.value as 'Completed' | 'In Progress' | 'Pending' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                disabled={!milestoneForm.title.trim() || !milestoneForm.dueDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingMilestone ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Project
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    min={editForm.startDate || undefined}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client
                  </label>
                  <input
                    type="text"
                    value={editForm.client}
                    onChange={(e) => setEditForm(prev => ({ ...prev, client: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Client name or organization"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Budget
                  </label>
                  <input
                    type="text"
                    value={editForm.budget}
                    onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Project budget"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Progress ({editForm.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={(e) => setEditForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!editForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}