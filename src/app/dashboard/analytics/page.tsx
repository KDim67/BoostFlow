'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

export default function AnalyticsPage() {
  const AnalyticsDashboard = dynamic(() => import('@/components/dashboard/AnalyticsDashboard'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Loading analytics dashboard...</div>
  });

  return (
    <div>
      {/* Analytics Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Track your project performance and team productivity</p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}