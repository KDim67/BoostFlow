import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Configuration | Platform Admin',
  description: 'System-wide configuration settings for platform administrators',
};

export default function SystemConfigurationPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">System Configuration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">System-wide configuration settings for platform administrators</p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Reset Defaults
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Security Settings</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Authentication Requirements</h3>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="mfa" className="mr-2" defaultChecked />
                <label htmlFor="mfa">Require Multi-Factor Authentication for Platform Admins</label>
              </div>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="password-complexity" className="mr-2" defaultChecked />
                <label htmlFor="password-complexity">Enforce Strong Password Requirements</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="session-timeout" className="mr-2" defaultChecked />
                <label htmlFor="session-timeout">Enable Session Timeout (30 minutes)</label>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Access Control</h3>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="ip-restriction" className="mr-2" />
                <label htmlFor="ip-restriction">Restrict Admin Access by IP Address</label>
              </div>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="audit-logging" className="mr-2" defaultChecked />
                <label htmlFor="audit-logging">Enable Comprehensive Audit Logging</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="auto-lockout" className="mr-2" defaultChecked />
                <label htmlFor="auto-lockout">Auto-Lockout After Failed Login Attempts</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Default Organization Settings</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-2">New Organization Defaults</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Plan</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <option>Standard</option>
                  <option>Professional</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trial Period (Days)</label>
                <input type="number" className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" defaultValue="14" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage Limit</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <option>500 GB</option>
                  <option>1 TB</option>
                  <option>2 TB</option>
                </select>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Default Security Policies</h3>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="data-encryption" className="mr-2" defaultChecked />
                <label htmlFor="data-encryption">Enable Data Encryption</label>
              </div>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="content-filtering" className="mr-2" defaultChecked />
                <label htmlFor="content-filtering">Enable Content Filtering</label>
              </div>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="domain-restriction" className="mr-2" />
                <label htmlFor="domain-restriction">Restrict Sign-ups to Verified Domains</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="auto-backup" className="mr-2" defaultChecked />
                <label htmlFor="auto-backup">Enable Automatic Backups</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">System Maintenance</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Scheduled Maintenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maintenance Window</label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <option>Sunday, 2:00 AM - 4:00 AM</option>
                    <option>Saturday, 1:00 AM - 3:00 AM</option>
                    <option>Wednesday, 11:00 PM - 1:00 AM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notification Time</label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <option>24 hours before</option>
                    <option>48 hours before</option>
                    <option>72 hours before</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Data Retention</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audit Log Retention</label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <option>90 days</option>
                    <option>180 days</option>
                    <option>1 year</option>
                    <option>2 years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Backup Retention</label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">API Configuration</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Rate Limiting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Rate Limit (requests/min)</label>
                  <input type="number" className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" defaultValue="1000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Burst Limit</label>
                  <input type="number" className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" defaultValue="2000" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">API Keys</h3>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="api-key-rotation" className="mr-2" defaultChecked />
                <label htmlFor="api-key-rotation">Enforce API Key Rotation (90 days)</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="api-key-scopes" className="mr-2" defaultChecked />
                <label htmlFor="api-key-scopes">Require Scope Limitation for API Keys</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}