'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/useAuth';
import { usePlatformAuth } from '@/lib/firebase/usePlatformAuth';
import {
  SystemConfiguration,
  getSystemConfiguration,
  updateSystemConfiguration,
  resetToDefaults,
  subscribeToSystemConfiguration,
  validateConfiguration
} from '@/lib/services/platform/systemConfigService';

export default function SystemConfigurationPage() {
  const { user } = useAuth();
  const { isPlatformAdmin } = usePlatformAuth();
  const [config, setConfig] = useState<SystemConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !isPlatformAdmin) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToSystemConfiguration(user.uid, (newConfig) => {
      setConfig(newConfig);
      setIsLoading(false);
      if (newConfig) {
        setError(null);
      }
    });

    return () => unsubscribe();
  }, [user, isPlatformAdmin]);

  const handleSaveChanges = async () => {
    if (!user || !config) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const errors = validateConfiguration(config);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      setValidationErrors([]);
      await updateSystemConfiguration(user.uid, config);
      setSuccessMessage('Configuration saved successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!user) return;

    try {
      setIsResetting(true);
      setError(null);
      setSuccessMessage(null);
      
      await resetToDefaults(user.uid);
      setSuccessMessage('Configuration reset to defaults successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
    } finally {
      setIsResetting(false);
    }
  };

  const updateConfigField = <T extends keyof SystemConfiguration>(
    section: T,
    field: keyof SystemConfiguration[T],
    value: SystemConfiguration[T][keyof SystemConfiguration[T]]
  ) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [section]: {
        ...config[section] as any,
        [field]: value
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user || !isPlatformAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Access Denied
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>You need platform administrator privileges to access this page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Configuration Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>Failed to load system configuration. Please try refreshing the page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">System Configuration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">System-wide configuration settings for platform administrators</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleResetDefaults}
            disabled={isResetting || isSaving}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? (
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
            {isResetting ? 'Resetting...' : 'Reset Defaults'}
          </button>
          <button 
            onClick={handleSaveChanges}
            disabled={isSaving || isResetting}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Validation Errors</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Security Settings</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Authentication Requirements</h3>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="mfa" 
                  className="mr-2" 
                  checked={config.securitySettings.mfaRequired}
                  onChange={(e) => updateConfigField('securitySettings', 'mfaRequired', e.target.checked)}
                />
                <label htmlFor="mfa" className="text-sm text-gray-700 dark:text-gray-300">Require Multi-Factor Authentication for Platform Admins</label>
              </div>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="password-complexity" 
                  className="mr-2" 
                  checked={config.securitySettings.passwordComplexity}
                  onChange={(e) => updateConfigField('securitySettings', 'passwordComplexity', e.target.checked)}
                />
                <label htmlFor="password-complexity" className="text-sm text-gray-700 dark:text-gray-300">Enforce Strong Password Requirements</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="session-timeout" 
                  className="mr-2" 
                  checked={config.securitySettings.sessionTimeout}
                  onChange={(e) => updateConfigField('securitySettings', 'sessionTimeout', e.target.checked)}
                />
                <label htmlFor="session-timeout" className="text-sm text-gray-700 dark:text-gray-300">Enable Session Timeout (30 minutes)</label>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Access Control</h3>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="ip-restriction" 
                  className="mr-2" 
                  checked={config.securitySettings.ipRestriction}
                  onChange={(e) => updateConfigField('securitySettings', 'ipRestriction', e.target.checked)}
                />
                <label htmlFor="ip-restriction" className="text-sm text-gray-700 dark:text-gray-300">Restrict Admin Access by IP Address</label>
              </div>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="audit-logging" 
                  className="mr-2" 
                  checked={config.securitySettings.auditLogging}
                  onChange={(e) => updateConfigField('securitySettings', 'auditLogging', e.target.checked)}
                />
                <label htmlFor="audit-logging" className="text-sm text-gray-700 dark:text-gray-300">Enable Comprehensive Audit Logging</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="auto-lockout" 
                  className="mr-2" 
                  checked={config.securitySettings.autoLockout}
                  onChange={(e) => updateConfigField('securitySettings', 'autoLockout', e.target.checked)}
                />
                <label htmlFor="auto-lockout" className="text-sm text-gray-700 dark:text-gray-300">Auto-Lockout After Failed Login Attempts</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Default Organization Settings */}
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
                <select 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  value={config.organizationDefaults.defaultPlan}
                  onChange={(e) => updateConfigField('organizationDefaults', 'defaultPlan', e.target.value as 'Standard' | 'Professional' | 'Enterprise')}
                >
                  <option value="Standard">Standard</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trial Period (Days)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" 
                  value={config.organizationDefaults.trialPeriodDays}
                  onChange={(e) => updateConfigField('organizationDefaults', 'trialPeriodDays', parseInt(e.target.value))}
                  min="1"
                  max="365"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage Limit</label>
                <select 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  value={config.organizationDefaults.storageLimit}
                  onChange={(e) => updateConfigField('organizationDefaults', 'storageLimit', e.target.value as '500 GB' | '1 TB' | '2 TB')}
                >
                  <option value="500 GB">500 GB</option>
                  <option value="1 TB">1 TB</option>
                  <option value="2 TB">2 TB</option>
                </select>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Default Security Policies</h3>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="data-encryption" 
                  className="mr-2" 
                  checked={config.organizationDefaults.dataEncryption}
                  onChange={(e) => updateConfigField('organizationDefaults', 'dataEncryption', e.target.checked)}
                />
                <label htmlFor="data-encryption" className="text-sm text-gray-700 dark:text-gray-300">Enable Data Encryption</label>
              </div>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="content-filtering" 
                  className="mr-2" 
                  checked={config.organizationDefaults.contentFiltering}
                  onChange={(e) => updateConfigField('organizationDefaults', 'contentFiltering', e.target.checked)}
                />
                <label htmlFor="content-filtering" className="text-sm text-gray-700 dark:text-gray-300">Enable Content Filtering</label>
              </div>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="domain-restriction" 
                  className="mr-2" 
                  checked={config.organizationDefaults.domainRestriction}
                  onChange={(e) => updateConfigField('organizationDefaults', 'domainRestriction', e.target.checked)}
                />
                <label htmlFor="domain-restriction" className="text-sm text-gray-700 dark:text-gray-300">Restrict Sign-ups to Verified Domains</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="auto-backup" 
                  className="mr-2" 
                  checked={config.organizationDefaults.autoBackup}
                  onChange={(e) => updateConfigField('organizationDefaults', 'autoBackup', e.target.checked)}
                />
                <label htmlFor="auto-backup" className="text-sm text-gray-700 dark:text-gray-300">Enable Automatic Backups</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* System Maintenance */}
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
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    value={config.maintenanceSettings.maintenanceWindow}
                    onChange={(e) => updateConfigField('maintenanceSettings', 'maintenanceWindow', e.target.value)}
                  >
                    <option value="Sunday, 2:00 AM - 4:00 AM">Sunday, 2:00 AM - 4:00 AM</option>
                    <option value="Saturday, 1:00 AM - 3:00 AM">Saturday, 1:00 AM - 3:00 AM</option>
                    <option value="Wednesday, 11:00 PM - 1:00 AM">Wednesday, 11:00 PM - 1:00 AM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notification Time</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    value={config.maintenanceSettings.notificationTime}
                    onChange={(e) => updateConfigField('maintenanceSettings', 'notificationTime', e.target.value)}
                  >
                    <option value="24 hours before">24 hours before</option>
                    <option value="48 hours before">48 hours before</option>
                    <option value="72 hours before">72 hours before</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Data Retention</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audit Log Retention</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    value={config.maintenanceSettings.auditLogRetention}
                    onChange={(e) => updateConfigField('maintenanceSettings', 'auditLogRetention', e.target.value)}
                  >
                    <option value="90 days">90 days</option>
                    <option value="180 days">180 days</option>
                    <option value="1 year">1 year</option>
                    <option value="2 years">2 years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Backup Retention</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    value={config.maintenanceSettings.backupRetention}
                    onChange={(e) => updateConfigField('maintenanceSettings', 'backupRetention', e.target.value)}
                  >
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* API Configuration */}
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
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" 
                    value={config.apiConfiguration.defaultRateLimit}
                    onChange={(e) => updateConfigField('apiConfiguration', 'defaultRateLimit', parseInt(e.target.value))}
                    min="1"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Burst Limit</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" 
                    value={config.apiConfiguration.burstLimit}
                    onChange={(e) => updateConfigField('apiConfiguration', 'burstLimit', parseInt(e.target.value))}
                    min="1"
                    max="20000"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">API Keys</h3>
              <div className="flex items-center mb-2">
                <input 
                  type="checkbox" 
                  id="api-key-rotation" 
                  className="mr-2" 
                  checked={config.apiConfiguration.apiKeyRotation}
                  onChange={(e) => updateConfigField('apiConfiguration', 'apiKeyRotation', e.target.checked)}
                />
                <label htmlFor="api-key-rotation" className="text-sm text-gray-700 dark:text-gray-300">Enforce API Key Rotation (90 days)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="api-key-scopes" 
                  className="mr-2" 
                  checked={config.apiConfiguration.apiKeyScopes}
                  onChange={(e) => updateConfigField('apiConfiguration', 'apiKeyScopes', e.target.checked)}
                />
                <label htmlFor="api-key-scopes" className="text-sm text-gray-700 dark:text-gray-300">Require Scope Limitation for API Keys</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}