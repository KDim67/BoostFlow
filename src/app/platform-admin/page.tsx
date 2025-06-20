'use client';

import React, { useState, useEffect } from 'react';
import SystemHealthCard from '@/components/platform-admin/SystemHealthCard';
import PlatformMetricsChart from '@/components/platform-admin/PlatformMetricsChart';
import RecentActivityLog from '@/components/platform-admin/RecentActivityLog';
import { getPlatformMetrics, getResourceUtilization } from '@/lib/services/platform/platformService';

import { NotificationService } from '@/lib/firebase/notificationService';
import { usePlatformAuth } from '@/lib/firebase/usePlatformAuth';

export default function PlatformAdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrganizations: 0,
    activeUsers: 0,
    systemUptime: 0,
    pendingApprovals: 0,
    organizationGrowthRate: 0,
    userGrowthRate: 0
  });
  const [resourceUsage, setResourceUsage] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    storageUsage: 0,
    networkBandwidth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const { user, isPlatformAdmin } = usePlatformAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [metricsData, resourceData] = await Promise.all([
          getPlatformMetrics(),
          getResourceUtilization()
        ]);
        
        setMetrics(metricsData);
        setResourceUsage(resourceData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && isPlatformAdmin) {
      fetchDashboardData();
    }
  }, [user, isPlatformAdmin]);

  const handleRefreshData = async () => {
    try {
      setIsLoading(true);
      const [metricsData, resourceData] = await Promise.all([
        getPlatformMetrics(),
        getResourceUtilization()
      ]);
      
      setMetrics(metricsData);
      setResourceUsage(resourceData);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    try {
      setIsSendingAnnouncement(true);
      
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const { users } = await response.json();
      
      const notificationPromises = users.map((user: any) => 
        NotificationService.createNotification(
          user.uid,
          announcementTitle,
          announcementMessage,
          'system_announcement',
          undefined
        )
      );
      
      await Promise.all(notificationPromises);
      
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setShowAnnouncementModal(false);
      alert(`System announcement sent to ${users.length} users successfully!`);
    } catch (error) {
      console.error('Error sending system announcement:', error);
      alert('Failed to send system announcement. Please try again.');
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Platform Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor system health and platform metrics</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowAnnouncementModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Send System Announcement
          </button>
          <button 
            onClick={handleRefreshData}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Organizations</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : metrics.totalOrganizations}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
            {metrics.totalOrganizations > 0 && metrics.organizationGrowthRate > 0 ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-green-500 dark:text-green-400">+{metrics.organizationGrowthRate}% from last month</span>
              </>
            ) : (
              <span>No growth data available</span>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : metrics.activeUsers.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
            {metrics.activeUsers > 0 && metrics.userGrowthRate > 0 ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-green-500 dark:text-green-400">+{metrics.userGrowthRate}% from last month</span>
              </>
            ) : (
              <span>No growth data available</span>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Uptime</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : `${metrics.systemUptime}%`}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
            Last 30 days
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {isLoading ? '...' : metrics.pendingApprovals}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs font-medium text-red-500 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {metrics.pendingApprovals > 0 ? 'Action required' : 'No action needed'}
          </div>
        </div>
      </div>

      {/* System Health Monitoring */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">System Health</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SystemHealthCard />
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">API Performance</h3>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Average Response Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">87ms</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Database Status</h3>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Query Performance</span>
                  <span className="font-medium text-gray-900 dark:text-white">Optimal</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-base font-medium text-gray-900 dark:text-white">User Growth</h2>
          </div>
          <div className="p-5">
            <PlatformMetricsChart />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-base font-medium text-gray-900 dark:text-white">Resource Utilization</h2>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">CPU Usage</span>
                <span className="font-medium text-gray-900 dark:text-white">{isLoading ? '...' : `${resourceUsage.cpuUsage}%`}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${resourceUsage.cpuUsage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                <span className="font-medium text-gray-900 dark:text-white">{isLoading ? '...' : `${resourceUsage.memoryUsage}%`}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${resourceUsage.memoryUsage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Storage Usage</span>
                <span className="font-medium text-gray-900 dark:text-white">{isLoading ? '...' : `${resourceUsage.storageUsage}%`}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${resourceUsage.storageUsage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Network Bandwidth</span>
                <span className="font-medium text-gray-900 dark:text-white">{isLoading ? '...' : `${resourceUsage.networkBandwidth}%`}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${resourceUsage.networkBandwidth}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Recent Platform Activity</h2>
        </div>
        <div className="p-5">
          <RecentActivityLog />
        </div>
      </div>

      {/* System Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Send System Announcement</h3>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSendAnnouncement();
            }} className="p-6 space-y-4">
              <div>
                <label htmlFor="announcement-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  id="announcement-title"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div>
                <label htmlFor="announcement-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  id="announcement-message"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter announcement message"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingAnnouncement}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingAnnouncement ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}