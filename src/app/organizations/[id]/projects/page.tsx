'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { queryDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import { Organization, Project } from '@/lib/types/organization';
import Badge from '@/components/Badge';

/**
 * Organization Projects Page Component
 * 
 * Displays and manages projects within a specific organization.
 * Implements role-based access control where:
 * - Admins/Owners can see all projects
 * - Regular users only see projects they're assigned to
 * 
 * Features:
 * - Project listing with search and status filtering
 * - Inline project editing via modal
 * - Project deletion with confirmation
 * - Project statistics dashboard
 */
export default function OrganizationProjects() {
  // Extract organization ID from URL parameters
  const { id } = useParams();
  const router = useRouter();
  
  // Core data state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal and editing state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '', startDate: '', dueDate: '', client: '', budget: '', progress: 0 });
  
  // Deletion state to prevent multiple simultaneous deletions
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Authentication context
  const { user } = useAuth();
  
  // Handle array or string ID from URL params (Next.js dynamic routes)
  const organizationId = Array.isArray(id) ? id[0] : id;

  /**
   * Main data fetching effect
   * 
   * Implements role-based project filtering:
   * 1. Checks user permissions for the organization
   * 2. Fetches organization data
   * 3. Determines user role (admin/owner vs regular user)
   * 4. Fetches appropriate projects based on role:
   *    - Admins: All organization projects
   *    - Regular users: Only projects they're assigned to via team membership
   * 
   */
  useEffect(() => {
    const fetchProjectsData = async () => {
      // Early return if required dependencies are missing
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Verify user has at least viewer permission for this organization
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization details
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        // Check if user has admin privileges for broader project access
        const isOwnerOrAdmin = await hasOrganizationPermission(user.uid, organizationId, 'admin');
        
        let projectsData: any[];
        
        if (isOwnerOrAdmin) {
          // Admins can see all projects in the organization
          projectsData = await queryDocuments('projects', [
            where('organizationId', '==', organizationId)
          ]);
        } else {
          // Regular users only see projects they're assigned to
          // First, get all projects in the organization
          const allProjects = await queryDocuments('projects', [
            where('organizationId', '==', organizationId)
          ]);
          
          // Filter projects based on team membership
          const userProjects = [];
          for (const project of allProjects) {
            // Check if user is a team member of this project
            const teamMembers = await queryDocuments('team', [
              where('projectId', '==', project.id),
              where('userId', '==', user.uid)
            ]);
            
            // Include project if user is a team member
            if (teamMembers.length > 0) {
              userProjects.push(project);
            }
          }
          
          projectsData = userProjects;
        }
        
        setProjects(projectsData as Project[]);
      } catch (error) {
        console.error('Error fetching projects data:', error);
        setError('Failed to load projects data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectsData();
  }, [user, organizationId]);

  /**
   * Initiates project editing by populating the edit form
   * 
   */
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      description: project.description || '', // Default to empty string for optional field
      status: project.status,
      startDate: project.startDate || '', // Default to empty string for optional field
      dueDate: project.dueDate,
      client: project.client || '', // Default to empty string for optional field
      budget: project.budget || '', // Default to empty string for optional field
      progress: project.progress
    });
    setShowEditModal(true);
  };

  /**
   * Saves project changes to Firestore and updates local state
   * 
   */
  const handleSaveProject = async () => {
    // Validation: ensure we have a project and valid name
    if (!editingProject || !editForm.name.trim()) return;

    try {
      // Update project in Firestore with trimmed string values
      await updateDocument('projects', editingProject.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
        startDate: editForm.startDate,
        dueDate: editForm.dueDate,
        client: editForm.client.trim(),
        budget: editForm.budget.trim(),
        progress: editForm.progress
      });

      // Update local state to reflect changes immediately (optimistic update)
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id 
          ? { ...p, ...editForm, name: editForm.name.trim(), description: editForm.description.trim(), client: editForm.client.trim(), budget: editForm.budget.trim() }
          : p
      ));

      // Close modal and clear editing state
      setShowEditModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  /**
   * Handles project deletion with confirmation and cleanup
   * 
   */
  const handleDeleteProject = async (projectId: string) => {
    // Confirm user intent with warning about permanent deletion
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone. All project documents and files will also be permanently deleted.')) {
      return;
    }

    try {
      // Set deletion state to show loading indicator and prevent multiple deletions
      setIsDeleting(projectId);
      
      // Get authentication token for API call
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // Call API endpoint for secure deletion (handles cascading deletes)
      const response = await fetch('/api/projects/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // Remove project from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      // Clear deletion state regardless of success/failure
      setIsDeleting(null);
    }
  };

  /**
   * Computed filtered and sorted projects list
   * 
   * Filtering logic:
   * - Text search: case-insensitive match on project name
   * - Status filter: exact match on project status (or 'all' for no filter)
   * 
   * Sorting:
   * - Orders by creation date (newest first)
   * - Handles optional createdAt field safely
   */
  const filteredProjects = projects
    .filter(project => {
      // Apply search term filter (case-insensitive)
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by creation date (newest first), handle missing timestamps
      return b.createdAt?.seconds - a.createdAt?.seconds;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
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
    <div className="space-y-8">
      {/* Projects Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Projects
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your organization's projects and workflows
        </p>
      </div>

      {/* Projects Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="planning">Planning</option>
            </select>
            <Link 
              href={`/organizations/${organizationId}/projects/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            {projects.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No Projects Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first project to get started with BoostFlow.
                </p>
                <Link 
                  href={`/organizations/${organizationId}/projects/new`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No Matching Projects</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search or filter criteria.
                </p>
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Progress</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <Link 
                          href={`/organizations/${organizationId}/projects/${project.id}`}
                          className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {project.name}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {project.description || 'No description provided'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge type="status" value={project.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{project.progress}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(project.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/organizations/${organizationId}/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => handleEditProject(project)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={isDeleting === project.id}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {isDeleting === project.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Total Projects</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{projects.length}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Active Projects</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {projects.filter(p => p.status === 'active').length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Completed</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {projects.filter(p => p.status === 'completed').length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Average Progress</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
            </p>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
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
                 <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                   <span>0%</span>
                   <span>50%</span>
                   <span>100%</span>
                 </div>
               </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!editForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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