"use client";

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskAssignments: true,
    projectUpdates: true,
    teamMessages: true,
    weeklyDigest: false,
  });
  const [accountSettings, setAccountSettings] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Project Manager',
    timezone: 'UTC-5 (Eastern Time)',
    language: 'English',
    theme: 'system',
  });
  const [teamPermissions, setTeamPermissions] = useState({
    canInviteMembers: true,
    canCreateProjects: true,
    canDeleteProjects: false,
    canManageTeamRoles: false,
    canAccessBilling: false,
  });

  const handleNotificationChange = (setting: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting as keyof typeof notificationSettings],
    });
  };

  const handleThemeChange = (theme: string) => {
    setAccountSettings({
      ...accountSettings,
      theme,
    });
  };

  const handlePermissionChange = (permission: string) => {
    setTeamPermissions({
      ...teamPermissions,
      [permission]: !teamPermissions[permission as keyof typeof teamPermissions],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Manage your account preferences and workspace settings.</p>
        </div>

        {/* Settings Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Settings Sidebar */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'account' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'notifications' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'team' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Team Permissions
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'security' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'billing' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Billing
                </button>
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6">
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          value={accountSettings.name}
                          onChange={(e) => setAccountSettings({...accountSettings, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          value={accountSettings.email}
                          onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                      <select
                        id="role"
                        value={accountSettings.role}
                        onChange={(e) => setAccountSettings({...accountSettings, role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option>Project Manager</option>
                        <option>Developer</option>
                        <option>Designer</option>
                        <option>Content Writer</option>
                        <option>Marketing Specialist</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                        <select
                          id="timezone"
                          value={accountSettings.timezone}
                          onChange={(e) => setAccountSettings({...accountSettings, timezone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option>UTC-8 (Pacific Time)</option>
                          <option>UTC-7 (Mountain Time)</option>
                          <option>UTC-6 (Central Time)</option>
                          <option>UTC-5 (Eastern Time)</option>
                          <option>UTC+0 (GMT)</option>
                          <option>UTC+1 (Central European Time)</option>
                          <option>UTC+8 (China Standard Time)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                        <select
                          id="language"
                          value={accountSettings.language}
                          onChange={(e) => setAccountSettings({...accountSettings, language: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                          <option>Chinese</option>
                          <option>Japanese</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme Preference</label>
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <input
                            id="theme-system"
                            name="theme"
                            type="radio"
                            checked={accountSettings.theme === 'system'}
                            onChange={() => handleThemeChange('system')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="theme-system" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            System Default
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="theme-light"
                            name="theme"
                            type="radio"
                            checked={accountSettings.theme === 'light'}
                            onChange={() => handleThemeChange('light')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="theme-light" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Light
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="theme-dark"
                            name="theme"
                            type="radio"
                            checked={accountSettings.theme === 'dark'}
                            onChange={() => handleThemeChange('dark')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="theme-dark" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Dark
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications for important updates</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleNotificationChange('emailNotifications')}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                          role="switch"
                          aria-checked={notificationSettings.emailNotifications}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${notificationSettings.emailNotifications ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Task Assignments</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when you're assigned to a task</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleNotificationChange('taskAssignments')}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${notificationSettings.taskAssignments ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                          role="switch"
                          aria-checked={notificationSettings.taskAssignments}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${notificationSettings.taskAssignments ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Team Permissions</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Invite Team Members</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow this user to invite new team members</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handlePermissionChange('canInviteMembers')}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${teamPermissions.canInviteMembers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                          role="switch"
                          aria-checked={teamPermissions.canInviteMembers}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${teamPermissions.canInviteMembers ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                          <input
                            type="password"
                            id="current-password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                          <input
                            type="password"
                            id="new-password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            id="confirm-password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="pt-2">
                          <button
                            type="button"
                            className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Billing Information</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">You are currently on the <span className="font-medium">Pro Plan</span> billed monthly.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Payment Method</h3>
                      <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                        <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4ZM20 10H4V8H20V10Z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Visa ending in 4242</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Expires 12/2024</p>
                        </div>
                        <button className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
                          Change
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Billing History</h3>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Amount
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Invoice
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                May 1, 2023
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                $29.00
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                  Paid
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 dark:text-blue-400">
                                <a href="#" className="hover:text-blue-500">Download</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}