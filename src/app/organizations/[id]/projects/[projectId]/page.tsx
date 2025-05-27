'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getDocument, queryDocuments } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import { Organization } from '@/lib/types/organization';
import OrganizationProjectsTasks from './tasks/page';

interface Task {
  id: string;
  title: string;
  status: string;
  assignee: string;
  dueDate: string;
  priority: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: string;
  startDate: string;
  dueDate: string;
  client: string;
  budget: string;
  organizationId: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  milestones?: Milestone[];
  teamMembers?: TeamMember[];
  tasks?: Task[];
}

export default function ProjectDetailPage() {
  const { id, projectId } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const organizationId = Array.isArray(id) ? id[0] : id;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!user || !organizationId || !projectIdString) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        const projectData = await getDocument('projects', projectIdString);
        
        if (!projectData) {
          setError('Project not found');
          setIsLoading(false);
          return;
        }
        
        if (projectData.organizationId !== organizationId) {
          setError('This project does not belong to the selected organization');
          setIsLoading(false);
          return;
        }
        
        setProject(projectData as Project);
        
        const tasksData = await queryDocuments('tasks', [
          where('projectId', '==', projectIdString)
        ]);
        setTasks(tasksData as Task[]);

        const teamData = await queryDocuments('team', [
          where('organizationId', '==', organizationId)
        ]);
        
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
  }, [user, organizationId, projectIdString]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
          href={`/organizations/${organizationId}/projects`}
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
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Progress: {project.progress}%
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
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
              onClick={() => router.push(`/organizations/${organizationId}/projects/${projectId}/team`)}
              className={`py-4 px-1 ${activeTab === 'team' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Team
            </button>
            <Link
              href={`/organizations/${organizationId}/projects/${projectId}/analytics`}
              className={`py-4 px-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium`}
            >
              Analytics
            </Link>
            <Link
              href={`/organizations/${organizationId}/projects/${projectId}/automation`}
              className={`py-4 px-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium`}
            >
              Automation
            </Link>
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
                    {project.milestones && project.milestones.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {project.milestones.map((milestone) => (
                          <li key={milestone.id} className="py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${milestone.status === 'Completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : milestone.status === 'In Progress' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
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
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{milestone.title}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Due: {milestone.dueDate}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${milestone.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : milestone.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {milestone.status}
                              </span>
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
                                checked={task.status === 'Completed'}
                                readOnly
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" 
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                  {task.priority}
                                </span>
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

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Add Team Member
                </button>
              </div>
              
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No Team Members Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add team members to collaborate on this project.
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Add Team Member
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}