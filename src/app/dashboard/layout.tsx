'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.includes('/projects')) return 'projects';
    if (pathname.includes('/tasks')) return 'tasks';
    if (pathname.includes('/team')) return 'team';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">Welcome back! Here's an overview of your workspace.</p>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/dashboard"
              className={`pb-4 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Overview
            </Link>
            <Link
              href="/dashboard/projects"
              className={`pb-4 px-1 ${activeTab === 'projects' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Projects
            </Link>
            <Link
              href="/dashboard/tasks"
              className={`pb-4 px-1 ${activeTab === 'tasks' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Tasks
            </Link>
            <Link
              href="/dashboard/team"
              className={`pb-4 px-1 ${activeTab === 'team' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Team
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`pb-4 px-1 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Analytics
            </Link>
            <Link 
              href="/dashboard/settings"
              className={`pb-4 px-1 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Settings
            </Link>
          </nav>
        </div>

        {/* Dashboard Content */}
        {children}
      </div>
    </div>
  );
}