'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlatformAuth } from '@/lib/firebase/usePlatformAuth';

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, isPlatformAdmin, isSuperAdmin, isLoading } = usePlatformAuth();

  useEffect(() => {
    if (!isLoading && !isPlatformAdmin) {
      router.push('/login');
    }
  }, [isLoading, isPlatformAdmin, router]);

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

  if (isLoading || !isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">You don't have permission to access the platform administration area.</p>
              <Link 
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Home
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
        className={`${isMobileView ? 'fixed inset-y-0 left-0 z-30' : 'fixed inset-y-0 left-0 z-10'} 
                   ${isSidebarCollapsed && !isMobileView ? 'w-20' : 'w-64'} 
                   ${isMobileView && !isMobileSidebarOpen ? '-translate-x-full' : 'translate-x-0'} 
                   bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm
                   transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden`}
        aria-label="Sidebar"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
              BoostFlow Admin
            </Link>
          )}
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
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-lg">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.displayName || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isSuperAdmin ? 'Super Administrator' : 'Platform Moderator'}
                </p>
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

            {/* Organizations Link - Only visible to Super Admins */}
            {isSuperAdmin && (
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
            )}


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
      <div className={`min-h-screen overflow-auto ${
        isMobileView 
          ? 'pt-16' 
          : isSidebarCollapsed 
            ? 'ml-20' 
            : 'ml-64'
      } transition-all duration-300 ease-in-out`}>
        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}