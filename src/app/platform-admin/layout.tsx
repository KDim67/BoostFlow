'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getActiveTab = () => {
    if (pathname.includes('/platform-admin/users')) return 'users';
    if (pathname.includes('/platform-admin/organizations')) return 'organizations';
    if (pathname.includes('/platform-admin/content')) return 'content';
    if (pathname.includes('/platform-admin/system')) return 'system';
    if (pathname.includes('/platform-admin/monitoring')) return 'monitoring';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Mobile overlay */}
      {isMobileView && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20" 
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${isMobileView ? 'fixed inset-y-0 left-0 z-30' : 'relative'} 
                   ${isSidebarCollapsed && !isMobileView ? 'w-20' : 'w-64'} 
                   ${isMobileView && !isMobileSidebarOpen ? '-translate-x-full' : 'translate-x-0'} 
                   bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm
                   transition-all duration-300 ease-in-out flex flex-col`}
        aria-label="Sidebar"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">BoostFlow Admin</h1>
          )}
          
          {/* Hamburger toggle button */}
          <button 
            onClick={isMobileView ? toggleMobileSidebar : toggleSidebar}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isSidebarCollapsed && !isMobileView ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Platform Administrator</p>
              </div>
            </div>
          )}
          
          <nav className="space-y-1" aria-label="Main Navigation">
            {/* Dashboard Link */}
            <Link 
              href="/platform-admin" 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                        ${activeTab === 'dashboard' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} 
                        group transition-colors duration-150 ease-in-out`}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${activeTab === 'dashboard' ? '' : 'text-gray-500 dark:text-gray-400'} 
                              group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 ease-in-out`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              {(!isSidebarCollapsed || isMobileView) && <span className="ml-2">Dashboard</span>}
              {isSidebarCollapsed && !isMobileView && (
                <span className="sr-only">Dashboard</span>
              )}
            </Link>

            {/* User Management Link */}
            <Link 
              href="/platform-admin/users" 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                        ${activeTab === 'users' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} 
                        group transition-colors duration-150 ease-in-out`}
              aria-current={activeTab === 'users' ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${activeTab === 'users' ? '' : 'text-gray-500 dark:text-gray-400'} 
                              group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 ease-in-out`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              {(!isSidebarCollapsed || isMobileView) && <span className="ml-2">User Management</span>}
              {isSidebarCollapsed && !isMobileView && (
                <span className="sr-only">User Management</span>
              )}
            </Link>

            {/* Organizations Link */}
            <Link 
              href="/platform-admin/organizations" 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                        ${activeTab === 'organizations' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} 
                        group transition-colors duration-150 ease-in-out`}
              aria-current={activeTab === 'organizations' ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${activeTab === 'organizations' ? '' : 'text-gray-500 dark:text-gray-400'} 
                              group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 ease-in-out`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              {(!isSidebarCollapsed || isMobileView) && <span className="ml-2">Organizations</span>}
              {isSidebarCollapsed && !isMobileView && (
                <span className="sr-only">Organizations</span>
              )}
            </Link>

            {/* Content Governance Link */}
            <Link 
              href="/platform-admin/content" 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                        ${activeTab === 'content' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} 
                        group transition-colors duration-150 ease-in-out`}
              aria-current={activeTab === 'content' ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${activeTab === 'content' ? '' : 'text-gray-500 dark:text-gray-400'} 
                              group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 ease-in-out`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              {(!isSidebarCollapsed || isMobileView) && <span className="ml-2">Content Governance</span>}
              {isSidebarCollapsed && !isMobileView && (
                <span className="sr-only">Content Governance</span>
              )}
            </Link>

            {/* System Configuration Link */}
            <Link 
              href="/platform-admin/system" 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                        ${activeTab === 'system' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} 
                        group transition-colors duration-150 ease-in-out`}
              aria-current={activeTab === 'system' ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${activeTab === 'system' ? '' : 'text-gray-500 dark:text-gray-400'} 
                              group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 ease-in-out`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              {(!isSidebarCollapsed || isMobileView) && <span className="ml-2">System Configuration</span>}
              {isSidebarCollapsed && !isMobileView && (
                <span className="sr-only">System Configuration</span>
              )}
            </Link>

            {/* Platform Monitoring Link */}
            <Link 
              href="/platform-admin/monitoring" 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md 
                        ${activeTab === 'monitoring' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} 
                        group transition-colors duration-150 ease-in-out`}
              aria-current={activeTab === 'monitoring' ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${activeTab === 'monitoring' ? '' : 'text-gray-500 dark:text-gray-400'} 
                              group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 ease-in-out`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              {(!isSidebarCollapsed || isMobileView) && <span className="ml-2">Platform Monitoring</span>}
              {isSidebarCollapsed && !isMobileView && (
                <span className="sr-only">Platform Monitoring</span>
              )}
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <Link 
            href="/logout" 
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md group transition-colors duration-150 ease-in-out"
            aria-label="Logout"
          >
            <span className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-150 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {(!isSidebarCollapsed || isMobileView) && <span className="ml-2">Logout</span>}
            {isSidebarCollapsed && !isMobileView && (
              <span className="sr-only">Logout</span>
            )}
          </Link>
        </div>

        {/* Tooltip container for collapsed sidebar */}
        {isSidebarCollapsed && !isMobileView && (
          <div className="absolute left-full top-0 z-50 hidden group-hover:block">
            {/* Tooltips will be shown on hover via CSS */}
          </div>
        )}
      </aside>

      {/* Mobile header with hamburger menu */}
      {isMobileView && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 z-20">
          <button 
            onClick={toggleMobileSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Open sidebar menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 ml-4">BoostFlow Admin</h1>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 overflow-auto ${isMobileView ? 'pt-16' : ''}`}>
        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}