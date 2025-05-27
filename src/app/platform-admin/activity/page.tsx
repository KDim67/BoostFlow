'use client';

import React, { useState, useEffect } from 'react';
import { getRecentActivityLogs, ActivityLogEntry } from '@/lib/services/platform/platformService';
import RecentActivityLog from '@/components/platform-admin/RecentActivityLog';
import { usePlatformAuth } from '@/lib/firebase/usePlatformAuth';

export default function ActivityPage() {
  const { user, isPlatformAdmin } = usePlatformAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !isPlatformAdmin) {
      window.location.href = '/dashboard';
    } else {
      setIsLoading(false);
    }
  }, [user, isPlatformAdmin]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Platform Activity Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete history of platform activities and administrative events
          </p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">All Activity Logs</h2>
        </div>
        <div className="p-5">
          {/* Pass a higher limit to show more logs */}
          <RecentActivityLog limit={50} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Activity Filtering</h2>
        </div>
        <div className="p-5">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Advanced filtering options will be available in a future update. Currently, the logs display the most recent 50 activities.
          </p>
        </div>
      </div>
    </div>
  );
}