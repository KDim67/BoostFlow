import { useState, useEffect } from 'react';
import {
  Integration,
  getIntegration,
  updateIntegration,
  syncIntegration,
  getAvailableProviders,
  createIntegration
} from '@/lib/services/integration/integrationService';

interface IntegrationSettingsProps {
  currentUser: string;
  integrationId?: string;
}

export default function IntegrationSettings({
  currentUser,
  integrationId
}: IntegrationSettingsProps) {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Array<{ id: string; name: string; description: string; icon: string; }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('settings');
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    description: '',
    type: 'oauth' as const,
    provider: '',
    config: {},
    credentials: {},
    status: 'inactive' as const
  });
  const [showNewIntegrationForm, setShowNewIntegrationForm] = useState(false);

  // Load integration if integrationId is provided
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load available providers
        const providers = await getAvailableProviders();
        setAvailableProviders(providers);
        
        // Load integration if ID is provided
        if (integrationId) {
          const loadedIntegration = await getIntegration(integrationId);
          setIntegration(loadedIntegration);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading integration data:', err);
        setError('Failed to load integration data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [integrationId]);

  // Toggle integration active state
  const toggleIntegrationActive = async () => {
    if (!integration) return;

    try {
      const updatedIntegration = await updateIntegration(integration.id, {
        status: integration.status === 'active' ? 'inactive' : 'active'
      });
      setIntegration(updatedIntegration);
    } catch (err) {
      console.error('Error updating integration:', err);
      setError('Failed to update integration. Please try again.');
    }
  };

  // Sync integration with external service
  const handleSync = async () => {
    if (!integration) return;

    try {
      setIsSyncing(true);
      setSyncMessage('Syncing with external service...');
      
      const result = await syncIntegration(integration.id);
      
      if (result.success) {
        setSyncMessage(`Successfully synced! ${result.syncedItems} items processed.`);
        
        // Refresh integration data
        const refreshedIntegration = await getIntegration(integration.id);
        setIntegration(refreshedIntegration);
      } else {
        setSyncMessage(`Sync failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Error syncing integration:', err);
      setSyncMessage('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
      
      // Clear sync message after 5 seconds
      setTimeout(() => {
        setSyncMessage(null);
      }, 5000);
    }
  };

  // Create new integration
  const handleCreateIntegration = async () => {
    try {
      if (!newIntegration.name || !newIntegration.provider) {
        setError('Please provide a name and select a provider.');
        return;
      }
      
      const createdIntegration = await createIntegration({
        ...newIntegration,
        createdBy: currentUser
      });
      
      setIntegration(createdIntegration);
      setShowNewIntegrationForm(false);
      setError(null);
    } catch (err) {
      console.error('Error creating integration:', err);
      setError('Failed to create integration. Please try again.');
    }
  };

  if (loading) {
    return <div className="p-4">Loading integration settings...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Show new integration form if no integration exists or user wants to create a new one
  if (showNewIntegrationForm || (!integration && !integrationId)) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create New Integration</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Integration Name
            </label>
            <input
              type="text"
              value={newIntegration.name}
              onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              placeholder="Enter integration name"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newIntegration.description}
              onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              rows={2}
              placeholder="Enter integration description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Integration Type
            </label>
            <select
              value={newIntegration.type}
              onChange={(e) => setNewIntegration({ ...newIntegration, type: e.target.value as any })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="oauth">OAuth</option>
              <option value="api">API Key</option>
              <option value="webhook">Webhook</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Provider
            </label>
            <select
              value={newIntegration.provider}
              onChange={(e) => setNewIntegration({ ...newIntegration, provider: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="">Select a provider</option>
              {availableProviders.map(provider => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowNewIntegrationForm(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateIntegration}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Integration
          </button>
        </div>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Integration Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating a new integration with external services.</p>
          <button
            onClick={() => setShowNewIntegrationForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Integration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{integration.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{integration.description}</p>
          <div className="mt-1 flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${integration.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
              {integration.status === 'active' ? 'Active' : integration.status === 'error' ? 'Error' : 'Inactive'}
            </span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              Last synced: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSync}
            disabled={isSyncing || integration.status !== 'active'}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={toggleIntegrationActive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${integration.status === 'active' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${integration.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className={`mb-4 p-3 rounded-md ${syncMessage.includes('Successfully') ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
          {syncMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Sync History
          </button>
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provider
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 dark:text-white">{integration.provider}</span>
                {availableProviders.find(p => p.id === integration.provider) && (
                  <img 
                    src={availableProviders.find(p => p.id === integration.provider)?.icon} 
                    alt={integration.provider} 
                    className="h-5 w-5"
                  />
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Integration Type
              </label>
              <span className="text-gray-900 dark:text-white capitalize">{integration.type}</span>
            </div>
            
            {integration.config.syncInterval && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sync Interval
                </label>
                <select
                  value={integration.config.syncInterval}
                  onChange={async (e) => {
                    const updatedIntegration = await updateIntegration(integration.id, {
                      config: {
                        ...integration.config,
                        syncInterval: parseInt(e.target.value)
                      }
                    });
                    setIntegration(updatedIntegration);
                  }}
                  className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every hour</option>
                  <option value="360">Every 6 hours</option>
                  <option value="720">Every 12 hours</option>
                  <option value="1440">Every day</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowNewIntegrationForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Another Integration
            </button>
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

      {/* Data Mapping Tab */}
      {activeTab === 'mapping' && (
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Configure how data is mapped between BoostFlow and {integration.provider}.
          </p>
          
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">BoostFlow Field</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">External Field</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Transformation</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {/* Sample mapping rows - in a real app, these would come from the API */}
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">Title</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">name</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">None</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <input type="checkbox" checked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">Description</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">description</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">None</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">Due Date</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">due_date</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Date format</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <input type="checkbox" checked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Mapping
            </button>
          </div>
        </div>
      )}

      {/* Sync History Tab */}
      {activeTab === 'history' && (
        <div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            View recent synchronization history with {integration.provider}.
          </p>
          
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Items</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {/* Sample sync history - in a real app, these would come from the API */}
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{new Date().toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Success
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">42 items</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">3.2 seconds</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Success
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">38 items</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">2.8 seconds</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Failed
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">0 items</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">1.5 seconds</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};