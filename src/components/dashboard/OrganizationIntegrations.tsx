'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import {
  Integration,
  getIntegration,
  updateIntegration,
  syncIntegration,
  getAvailableProviders,
  createIntegration,
  getAllIntegrations,
  deleteIntegration
} from '@/lib/services/integration/integrationService';
import {
  getGoogleOAuthUrl,
  getGitHubOAuthUrl,
  getProviderScopes,
  OAuthConfig
} from '@/lib/services/integration/oauthHelpers';
import Badge from '@/components/Badge';

/**
 * Props interface for the OrganizationIntegrations component
 * @param currentUser - The current user's identifier
 * @param organizationId - The ID of the organization to manage integrations for
 */

interface OrganizationIntegrationsProps {
  currentUser: string;
  organizationId: string;
}

/**
 * OrganizationIntegrations component manages third-party integrations for an organization.
 * Handles OAuth connections, integration management, and synchronization with external services.
 * Requires admin permissions to access and modify organization integrations.
 */

export default function OrganizationIntegrations({
  currentUser,
  organizationId
}: OrganizationIntegrationsProps) {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableProviders, setAvailableProviders] = useState<Array<{ id: string; name: string; description: string; icon: string; }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuth();

  /**
   * Load integration data on component mount and when dependencies change.
   * Verifies user permissions before loading organization-specific integrations.
   */
  useEffect(() => {
    const loadData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check if user has admin permissions for this organization
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'admin');
        
        if (!permission) {
          setError('You do not have permission to manage integrations for this organization.');
          setLoading(false);
          return;
        }
        
        // Fetch available providers and all integrations in parallel for efficiency
        const [providers, allIntegrations] = await Promise.all([
          getAvailableProviders(),
          getAllIntegrations()
        ]);
        
        setAvailableProviders(providers);
        // Filter integrations to only show those belonging to this organization
        const orgIntegrations = allIntegrations.filter(int => 
          int.config?.organizationId === organizationId
        );
        setIntegrations(orgIntegrations);
        
        setError(null);
      } catch (err) {
        console.error('Error loading integration data:', err);
        setError('Failed to load integration data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, organizationId]);

  /**
   * Initiates OAuth connection flow for a specific provider (Google, GitHub, etc.).
   * Stores necessary state in localStorage and redirects to provider's OAuth URL.
   * @param provider - The integration provider to connect to
   */
  const handleOAuthConnect = async (provider: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      let authUrl: string;
      let clientId: string;
      
      // Get client ID based on provider type
      switch (provider) {
        case 'google':
          clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
          break;
        case 'github':
          clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Generate random state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store OAuth context in localStorage for callback handling
      localStorage.setItem('oauth_provider', provider);
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_organization_id', organizationId);
      localStorage.setItem('oauth_context', 'organization');
      
      const oauthConfig: OAuthConfig = {
        clientId,
        redirectUri: `${window.location.origin}/oauth/callback`,
        scopes: getProviderScopes(provider as any)
      };
      
      // Generate provider-specific OAuth URL
      switch (provider) {
        case 'google':
          authUrl = getGoogleOAuthUrl(oauthConfig);
          break;
        case 'github':
          authUrl = getGitHubOAuthUrl(oauthConfig);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
      
    } catch (err) {
      console.error('OAuth connection error:', err);
      setError(`Failed to connect to ${provider}. Please try again.`);
      setIsConnecting(false);
    }
  };
  
  /**
   * Deletes an integration and updates the UI state.
   * If the deleted integration is currently selected, clears the selection.
   * @param integrationId - The ID of the integration to delete
   */
  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await deleteIntegration(integrationId);
      // Remove from local state
      setIntegrations(prev => prev.filter(int => int.id !== integrationId));
      
      // Clear selection if deleted integration was currently selected
      if (integration?.id === integrationId) {
        setIntegration(null);
        setActiveTab('list');
      }
    } catch (err) {
      console.error('Error deleting integration:', err);
      setError('Failed to delete integration. Please try again.');
    }
  };

  /**
   * Toggles the active/inactive status of the currently selected integration.
   * Updates both the selected integration and the integrations list.
   */
  const toggleIntegrationActive = async () => {
    if (!integration) return;

    try {
      // Toggle status between active and inactive
      const updatedIntegration = await updateIntegration(integration.id, {
        status: integration.status === 'active' ? 'inactive' : 'active'
      });
      setIntegration(updatedIntegration);
      // Update the integration in the list
      setIntegrations(prev => prev.map(int => 
        int.id === updatedIntegration.id ? updatedIntegration : int
      ));
    } catch (err) {
      console.error('Error updating integration:', err);
      setError('Failed to update integration. Please try again.');
    }
  };

  /**
   * Synchronizes the current integration with its external service.
   * Updates the integration data after successful sync and shows feedback to user.
   */
  const handleSync = async () => {
    if (!integration) return;

    try {
      setIsSyncing(true);
      setSyncMessage(null);
      setError(null);
      
      const result = await syncIntegration(integration.id);
      
      if (result.success) {
        setSyncMessage('Sync completed successfully!');
        // Refresh integration data after successful sync
        const updatedIntegration = await getIntegration(integration.id);
        if (updatedIntegration) {
          setIntegration(updatedIntegration);
        }
      } else {
        setError(`Sync failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Error syncing integration:', err);
      setError('Failed to sync integration. Please try again.');
    } finally {
      setIsSyncing(false);
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state with navigation back to organizations
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have the necessary permissions to manage integrations for this organization.
        </p>
        <Link 
          href="/organizations"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Organizations
        </Link>
      </div>
    );
  }

  const renderIntegrationsList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Organization Integrations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage integrations that are shared across your organization
          </p>
        </div>
      </div>
      
      {integrations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No organization integrations configured yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {integrations.map((int) => (
            <div key={int.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {int.provider.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{int.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{int.provider} • {int.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge type="status" value={int.status} size="sm" />
                  <button
                    onClick={() => {
                      setIntegration(int);
                      setActiveTab('settings');
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
                  >
                    Configure
                  </button>
                  <button
                    onClick={() => handleDeleteIntegration(int.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Available Providers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableProviders.map((provider) => (
            <div key={provider.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <img 
                      src={provider.icon} 
                      alt={`${provider.name} icon`}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">{provider.name}</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{provider.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleOAuthConnect(provider.id)}
                disabled={isConnecting}
                className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!integration && activeTab !== 'list') {
    return (
      <div>
        {renderIntegrationsList()}
      </div>
    );
  }

  if (activeTab === 'list') {
    return (
      <div>
        {renderIntegrationsList()}
      </div>
    );
  }

  if (!integration) {
    return (
      <div>
        {renderIntegrationsList()}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{integration.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{integration.description}</p>
          <div className="mt-1 flex items-center">
            <Badge type="status" value={integration.status} size="sm" />
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              Last synced: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIntegration(null);
              setActiveTab('list');
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to List
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing || integration.status !== 'active'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={toggleIntegrationActive}
            className={`px-4 py-2 rounded-md ${
              integration.status === 'active'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {integration.status === 'active' ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
          {syncMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['settings', 'credentials'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Integration Name
              </label>
              <input
                type="text"
                value={integration.name}
                disabled
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-75"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provider
              </label>
              <input
                type="text"
                value={integration.provider}
                disabled
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-75 capitalize"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={integration.description}
                disabled
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-75"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Integration Type
              </label>
              <input
                type="text"
                value={integration.type}
                disabled
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-75 capitalize"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <input
                type="text"
                value={integration.status}
                disabled
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-75 capitalize"
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Integration Configuration</h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {JSON.stringify(integration.config, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Credentials are securely stored and encrypted. For security reasons, we only show partial information.
            </p>
          </div>
          
          <div className="space-y-4">
            {Object.entries(integration.credentials).map(([key, value]) => (
              <div key={key} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                  </label>
                </div>
                <div>
                  <input
                    type="password"
                    value="••••••••••••••••"
                    disabled
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm disabled:opacity-75"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update Credentials
            </button>
          </div>
        </div>
      )}
    </div>
  );
}