"use client";

import React, { useState, useEffect } from 'react';
import { getSystemHealth, SystemHealthStatus } from '@/lib/services/platform/platformService';

const SystemHealthCard = () => {
  const [systemStatuses, setSystemStatuses] = useState<SystemHealthStatus[]>([
    { name: 'Authentication Service', status: 'Operational', statusColor: 'green' },
    { name: 'Storage Service', status: 'Operational', statusColor: 'green' },
    { name: 'Database Service', status: 'Operational', statusColor: 'green' },
    { name: 'Analytics Engine', status: 'Operational', statusColor: 'green' },
    { name: 'Notification Service', status: 'Degraded', statusColor: 'yellow' },
    { name: 'Search Service', status: 'Operational', statusColor: 'green' },
  ]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        setIsLoading(true);
        const healthData = await getSystemHealth();
        setSystemStatuses(healthData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching system health:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemHealth();
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Service Status</h3>
      <div className="space-y-3">
        {systemStatuses.map((service, index) => (
          <div key={index} className="flex justify-between items-center py-1.5">
            <span className="text-sm text-gray-700 dark:text-gray-300">{service.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              service.statusColor === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
              service.statusColor === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {service.status}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Last updated:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {isLoading ? 'Loading...' : `${Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000)} minutes ago`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;