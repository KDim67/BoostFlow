"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/firebase/useAuth';
import { queryDocuments } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';

// This needs to be moved to a separate metadata config file since 'use client' components can't export metadata
// export const metadata = {
//   title: 'Dashboard - BoostFlow',
//   description: 'Manage your projects, tasks, and team collaboration in one place.',
// };

// Define types for our data structures
interface Project {
  id: string;
  name: string;
  description?: string;
  progress: number;
  status: string;
  startDate?: string;
  dueDate: string;
  createdBy: string;
  createdAt: any; // Firestore timestamp
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  projectId?: string;
  assignedTo?: string;
  hoursTracked?: number;
  createdBy: string;
  createdAt: any;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  photoURL?: string;
  createdBy: string;
  createdAt: any;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const AnalyticsDashboard = dynamic(() => import('@/components/dashboard/AnalyticsDashboard'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Loading analytics dashboard...</div>
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const projectsData = await queryDocuments('projects', [
          where('createdBy', '==', user.uid)
        ]);
        setProjects(projectsData as Project[]);
        
        const tasksData = await queryDocuments('tasks', [
          where('createdBy', '==', user.uid)
        ]);
        setTasks(tasksData as Task[]);
        
        const teamData = await queryDocuments('team', [
          where('createdBy', '==', user.uid)
        ]);
        setTeamMembers(teamData as TeamMember[]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"> 
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link href="/dashboard/projects" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </span>
            </Link>
            <Link href="/dashboard/tasks" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
              <span className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Task
              </span>
            </Link>
          </div>
        </div>

        {/* Dashboard Content - Navigation tabs are handled by the layout component */}

        {/* Dashboard Content */}
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{isLoading ? '...' : projects.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Tasks</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {isLoading ? '...' : tasks.filter(task => task.status === 'Completed').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hours Tracked</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {isLoading ? '...' : tasks.reduce((total, task) => total + (task.hoursTracked || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Projects Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Projects</h3>
                <Link href="/dashboard/projects" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                  View all
                </Link>
              </div>
              <div className="px-6 py-5">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {projects.map((project) => (
                    <li key={project.id} className="py-4">
                      <Link href={`/dashboard/projects/${project.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-6 px-6 py-2 rounded-md transition-colors">
                        <div className="flex justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            project.status === 'In Progress' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                          <div 
                            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{project.progress}% Complete</span>
                          <span>Due: {project.dueDate}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Tasks Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Tasks</h3>
                <Link href="/dashboard/tasks" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                  View all
                </Link>
              </div>
              <div className="px-6 py-5">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.map((task) => (
                    <li key={task.id} className="py-4 flex items-start">
                      <div className="mr-3 pt-1">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.priority === 'High' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{task.status}</span>
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
          <div className="space-y-8">
            {/* Team Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Members</h3>
                <Link href="/dashboard/team" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                  View all
                </Link>
              </div>
              <div className="px-6 py-5">
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No team members yet</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {teamMembers.slice(0, 4).map((member) => (
                      <li key={member.id} className="py-4 flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {member.photoURL ? (
                            <img 
                              src={member.photoURL} 
                              alt={member.name} 
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Events</h3>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Weekly Team Meeting</h4>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">Today</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    2:00 PM - 3:00 PM
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Project Review</h4>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">Tomorrow</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    10:00 AM - 11:30 AM
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Client Presentation</h4>
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">Thursday</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    3:00 PM - 4:30 PM
                  </div>
                </div>
                <div className="pt-3">
                  <Link href="/dashboard/calendar" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                    View full calendar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}