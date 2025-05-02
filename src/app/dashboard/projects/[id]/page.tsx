"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getDocument, queryDocuments } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import AddTaskModal from './AddTaskModal';
import AddMilestoneModal from './AddMilestoneModal';
import AddTeamMemberModal from './AddTeamMemberModal';
import AddDocumentModal from './AddDocumentModal';
import AddCommentModal from './AddCommentModal';
import UpdateProgressModal from './UpdateProgressModal';
import UpdateStatusModal from './UpdateStatusModal';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

interface Task {
  id: number;
  title: string;
  status: 'Completed' | 'In Progress' | 'To Do';
  assignee: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  hoursTracked?: number; 
}

interface Milestone {
  id: number;
  title: string;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

interface Document {
  id: number;
  name: string;
  uploadedBy: string;
  uploadDate: string;
}

interface Comment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: string;
  startDate: string;
  dueDate: string;
  client: string;
  budget: string;
  teamMembers: TeamMember[];
  tasks: Task[];
  milestones: Milestone[];
  documents: Document[];
  comments: Comment[];
}

const getEmptyProject = (): Project => {
  return {
    id: 0,
    name: '',
    description: '',
    progress: 0,
    status: '',
    startDate: '',
    dueDate: '',
    client: '',
    budget: '',
    teamMembers: [],
    tasks: [],
    milestones: [],
    documents: [],
    comments: [],
  };
};

interface PageParams {
  id: string;
}

export default function ProjectDetailsPage({ params }: { params: PageParams }) {
  const projectId = params.id;
  const [project, setProject] = useState<Project>(getEmptyProject());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const fetchProject = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const projectData = await getDocument('projects', projectId);
      
      if (projectData) {
        const [tasksData, milestonesData, teamMembersData, documentsData, commentsData] = await Promise.all([
          queryDocuments('tasks', [where('projectId', '==', projectId)]),
          queryDocuments('milestones', [where('projectId', '==', projectId)]),
          queryDocuments('team', [where('projectId', '==', projectId)]),
          queryDocuments('documents', [where('projectId', '==', projectId)]),
          queryDocuments('comments', [where('projectId', '==', projectId)])
        ]);
        
        setProject({
          id: parseInt(projectId),
          name: projectData.name || '',
          description: projectData.description || '',
          progress: projectData.progress || 0,
          status: projectData.status || '',
          startDate: projectData.startDate || '',
          dueDate: projectData.dueDate || '',
          client: projectData.client || '',
          budget: projectData.budget || '',
          teamMembers: teamMembersData.map((member: any) => ({
            id: parseInt(member.id),
            name: member.name,
            role: member.role,
            avatar: ''
          })),
          tasks: tasksData.map((task: any) => ({
            id: parseInt(task.id),
            title: task.title,
            status: task.status,
            assignee: task.assignee,
            dueDate: task.dueDate,
            priority: task.priority,
            hoursTracked: task.hoursTracked
          })),
          milestones: milestonesData.map((milestone: any) => ({
            id: parseInt(milestone.id),
            title: milestone.title,
            dueDate: milestone.dueDate,
            status: milestone.status
          })),
          documents: documentsData.map((document: any) => ({
            id: parseInt(document.id),
            name: document.name,
            uploadedBy: document.uploadedBy,
            uploadDate: document.uploadDate
          })),
          comments: commentsData.map((comment: any) => ({
            id: parseInt(comment.id),
            author: comment.author,
            content: comment.content,
            timestamp: comment.timestamp
          })),
        });
      } else {
        setError('Project not found');
      }
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 max-w-md text-center">
          <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Project</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/dashboard/projects" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 mr-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Project
              </span>
            </button>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <span className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Task
              </span>
            </button>
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : project.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                  {project.status}
                </span>
                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  title="Update Status"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Progress</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                <button
                  onClick={() => setIsProgressModalOpen(true)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  title="Update Progress"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{project.dueDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Client</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{project.client}</p>
            </div>
          </div>
        </div>

        {/* Project Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-4 px-1 ${activeTab === 'tasks' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`pb-4 px-1 ${activeTab === 'team' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Team
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-4 px-1 ${activeTab === 'documents' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-4 px-1 ${activeTab === 'comments' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Comments
            </button>
          </nav>
        </div>

        {/* Project Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Milestones */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Milestones</h3>
                    <button 
                      onClick={() => setIsMilestoneModalOpen(true)}
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
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {project.tasks.slice(0, 3).map((task) => (
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{project.startDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{project.budget}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Team Size</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{project.teamMembers.length} members</p>
                    </div>
                  </div>
                </div>
                
                {/* Team Members */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Members</h3>
                  </div>
                  <div className="px-6 py-5">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {project.teamMembers.map((member) => (
                        <li key={member.id} className="py-4 flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            {member.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Tasks</h3>
                <div className="flex space-x-2">
                  <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5">
                    <option>All Statuses</option>
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                  <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5">
                    <option>All Priorities</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-5">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {project.tasks.map((task) => (
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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-0">{task.title}</h4>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Assigned to: {task.assignee}</span>
                          <span>Due: {task.dueDate}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'team' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Members</h3>
                <button 
                  onClick={() => setIsTeamMemberModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
                >
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Member
                  </span>
                </button>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {project.teamMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                          View Profile
                        </button>
                        <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Documents</h3>
                <button 
                  onClick={() => setIsDocumentModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
                >
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload Document
                  </span>
                </button>
              </div>
              <div className="px-6 py-5">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {project.documents.map((document) => (
                    <li key={document.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{document.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded by {document.uploadedBy} on {document.uploadDate}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'comments' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Discussion</h3>
              </div>
              <div className="px-6 py-5 space-y-6">
                {/* Comment Form */}
                <div className="mb-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (commentText.trim()) {
                      setIsCommentModalOpen(true);
                    }
                  }}>
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    ></textarea>
                    <div className="mt-2 flex justify-end">
                      <button 
                        type="submit"
                        disabled={!commentText.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post Comment
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* Comments List */}
                <ul className="space-y-6">
                  {project.comments.map((comment) => (
                    <li key={comment.id} className="relative">
                      <div className="flex">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                          {comment.author.charAt(0)}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{comment.author}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                          </div>
                          <div className="mt-1 ml-2 flex space-x-4">
                            <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Reply</button>
                            <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Edit</button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        projectId={projectId} 
        onTaskAdded={fetchProject} 
      />
      <AddMilestoneModal 
        isOpen={isMilestoneModalOpen} 
        onClose={() => setIsMilestoneModalOpen(false)} 
        projectId={projectId} 
        onMilestoneAdded={fetchProject} 
      />
      <AddTeamMemberModal 
        isOpen={isTeamMemberModalOpen} 
        onClose={() => setIsTeamMemberModalOpen(false)} 
        projectId={projectId} 
        onTeamMemberAdded={fetchProject} 
      />
      <AddDocumentModal 
        isOpen={isDocumentModalOpen} 
        onClose={() => setIsDocumentModalOpen(false)} 
        projectId={projectId} 
        onDocumentAdded={fetchProject} 
      />
      <AddCommentModal 
        isOpen={isCommentModalOpen} 
        onClose={() => {
          setIsCommentModalOpen(false);
          setCommentText('');
        }} 
        projectId={projectId} 
        onCommentAdded={fetchProject}
        commentText={commentText}
      />
      <UpdateProgressModal 
        isOpen={isProgressModalOpen} 
        onClose={() => setIsProgressModalOpen(false)} 
        projectId={projectId} 
        currentProgress={project.progress} 
        onProgressUpdated={fetchProject}
      />
      <UpdateStatusModal 
        isOpen={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
        projectId={projectId} 
        currentStatus={project.status} 
        onStatusUpdated={fetchProject}
      />
    </div>
  );
}