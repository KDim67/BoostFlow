/**
 * Core integration entity representing a third-party service connection
 * Supports various integration types including API, webhook, OAuth, and custom implementations
 */
export interface Integration {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'webhook' | 'oauth' | 'custom';
  provider: string;
  config: Record<string, any>;
  credentials: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  errorMessage?: string;
}

/**
 * Represents an event triggered by an integration
 * Used for tracking integration activities and processing status
 */
export interface IntegrationEvent {
  id: string;
  integrationId: string;
  eventType: string;
  payload: Record<string, any>;
  status: 'pending' | 'processed' | 'failed';
  timestamp: Date;
  processedAt?: Date;
  error?: string;
}

/**
 * Defines field mapping between source and target systems
 * Enables data transformation during integration synchronization
 */
export interface DataMapping {
  id: string;
  integrationId: string;
  sourceField: string;
  targetField: string;
  transformationRule?: string;
  isRequired: boolean;
}

/**
 * Retrieves integrations from localStorage with SSR safety
 * @returns Array of stored integrations or empty array if unavailable
 */
function getStoredIntegrations(): Integration[] {
  // Server-side rendering safety check
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('boostflow_integrations');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading integrations from localStorage:', error);
    return [];
  }
}

/**
 * Fetches all integrations and converts date strings to Date objects
 * @returns Promise resolving to array of integrations with proper date types
 */
export const getAllIntegrations = async (): Promise<Integration[]> => {
  try {
    const integrations = getStoredIntegrations();
    // Convert stored date strings back to Date objects for proper type safety
    return integrations.map(integration => ({
      ...integration,
      createdAt: new Date(integration.createdAt),
      updatedAt: new Date(integration.updatedAt),
      lastSyncAt: integration.lastSyncAt ? new Date(integration.lastSyncAt) : undefined
    }));
  } catch (error) {
    console.error('Error getting all integrations:', error);
    return [];
  }
};

/**
 * Removes an integration from storage
 * @param integrationId - Unique identifier of the integration to delete
 * @returns Promise resolving to true if successful, false otherwise
 */
export const deleteIntegration = async (integrationId: string): Promise<boolean> => {
  try {
    const integrations = getStoredIntegrations();
    // Filter out the integration to be deleted
    const filteredIntegrations = integrations.filter(i => i.id !== integrationId);
    
    localStorage.setItem('boostflow_integrations', JSON.stringify(filteredIntegrations));
    
    console.log('Deleted integration:', integrationId);
    return true;
  } catch (error) {
    console.error('Error deleting integration:', error);
    return false;
  }
};

/**
 * Creates a new integration with auto-generated metadata
 * @param integration - Integration data without id and timestamps
 * @returns Promise resolving to the created integration with generated fields
 */
export const createIntegration = async (integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Integration> => {
  // Generate unique ID and timestamps for new integration
  const newIntegration: Integration = {
    ...integration,
    id: `integration-${Date.now()}`, // Simple timestamp-based ID generation
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    const integrations = getStoredIntegrations();
    integrations.push(newIntegration);
    localStorage.setItem('boostflow_integrations', JSON.stringify(integrations));
    
    console.log('Created integration:', newIntegration);
    return newIntegration;
  } catch (error) {
    console.error('Error creating integration:', error);
    throw new Error('Failed to create integration');
  }
};


/**
 * Retrieves a specific integration by ID with proper date type conversion
 * @param integrationId - Unique identifier of the integration
 * @returns Promise resolving to integration or null if not found
 */
export const getIntegration = async (integrationId: string): Promise<Integration | null> => {
  try {
    const integrations = getStoredIntegrations();
    const integration = integrations.find(i => i.id === integrationId);
    
    if (integration) {
      // Convert stored date strings to Date objects
      return {
        ...integration,
        createdAt: new Date(integration.createdAt),
        updatedAt: new Date(integration.updatedAt),
        lastSyncAt: integration.lastSyncAt ? new Date(integration.lastSyncAt) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting integration:', error);
    return null;
  }
};

/**
 * Updates an existing integration with new data
 * @param integrationId - Unique identifier of the integration to update
 * @param updates - Partial integration data to merge (excludes id and timestamps)
 * @returns Promise resolving to the updated integration
 * @throws Error if integration not found
 */
export const updateIntegration = async (integrationId: string, updates: Partial<Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Integration> => {
  const integration = await getIntegration(integrationId);
  
  if (!integration) {
    throw new Error(`Integration with ID ${integrationId} not found`);
  }
  
  // Merge updates with existing data and update timestamp
  const updatedIntegration: Integration = {
    ...integration,
    ...updates,
    updatedAt: new Date() // Always update the modification timestamp
  };
  
  try {
    const integrations = getStoredIntegrations();
    const index = integrations.findIndex(i => i.id === integrationId);
    
    if (index !== -1) {
      integrations[index] = updatedIntegration;
      localStorage.setItem('boostflow_integrations', JSON.stringify(integrations));
    }
    
    console.log('Updated integration:', updatedIntegration);
    return updatedIntegration;
  } catch (error) {
    console.error('Error updating integration:', error);
    throw new Error('Failed to update integration');
  }
};

/**
 * Synchronizes data from an external provider based on integration configuration
 * Updates integration status and handles provider-specific sync logic
 * @param integrationId - Unique identifier of the integration to sync
 * @returns Promise resolving to sync result with success status and item count
 * @throws Error if integration not found
 */
export const syncIntegration = async (integrationId: string): Promise<{ success: boolean; message: string; syncedItems?: number }> => {

  const integration = await getIntegration(integrationId);
  
  if (!integration) {
    throw new Error(`Integration with ID ${integrationId} not found`);
  }
  
  try {
    // Reset integration status before sync attempt
    await updateIntegration(integrationId, {
      status: 'active',
      errorMessage: undefined
    });
    
    // Route to provider-specific sync implementation
    let syncResult;
    
    switch (integration.provider) {
      case 'google':
        syncResult = await syncWithGoogleServices(integration);
        break;
        
      case 'github':
        syncResult = await syncWithGitHub(integration);
        break;
        
      default:
        throw new Error(`Unsupported provider: ${integration.provider}`);
    }
    
    // Update integration with successful sync timestamp
    await updateIntegration(integrationId, {
      lastSyncAt: new Date(),
      status: 'active',
      errorMessage: undefined
    });
    
    console.log('Sync result:', syncResult);
    
    return syncResult;
  } catch (error) {
    // Update integration status with error details
    await updateIntegration(integrationId, {
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    
    console.error(`Error syncing integration ${integrationId}:`, error);
    
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};


/**
 * Synchronizes data from Google services (Calendar, Drive) based on configured scopes
 * @param integration - Integration configuration with Google credentials and scopes
 * @returns Promise resolving to sync result with item count
 * @throws Error if access token missing or API calls fail
 */
async function syncWithGoogleServices(integration: Integration): Promise<{ success: boolean; message: string; syncedItems?: number }> {
  console.log(`Syncing with Google services for integration: ${integration.id}`);
  
  if (!integration.credentials.accessToken) {
    throw new Error('Missing Google API access token');
  }
  
  const scopes = integration.config.scopes || [];
  let syncedItems = 0;
  
  try {
    // Sync Google Calendar events if scope permits
    if (scopes.includes('calendar.readonly') || scopes.includes('calendar.events')) {
      console.log('Syncing Google Calendar events');
      
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: {
          'Authorization': `Bearer ${integration.credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!calendarResponse.ok) {
        throw new Error(`Google Calendar API error: ${calendarResponse.status}`);
      }
      
      const calendarData = await calendarResponse.json();
      syncedItems += calendarData.items?.length || 0;
    }
    
    // Sync Google Drive files if scope permits
    if (scopes.includes('drive.readonly') || scopes.includes('drive.file')) {
      console.log('Syncing Google Drive files');
      
      const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=100', {
        headers: {
          'Authorization': `Bearer ${integration.credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!driveResponse.ok) {
        throw new Error(`Google Drive API error: ${driveResponse.status}`);
      }
      
      const driveData = await driveResponse.json();
      syncedItems += driveData.files?.length || 0;
    }
    
    return {
      success: true,
      message: `Successfully synced with Google services`,
      syncedItems
    };
  } catch (error) {
    console.error('Google sync error:', error);
    throw error;
  }
}



/**
 * Synchronizes data from GitHub repositories including repos, issues, PRs, and commits
 * @param integration - Integration configuration with GitHub credentials and repository settings
 * @returns Promise resolving to sync result with total synced items count
 * @throws Error if API token missing or GitHub API calls fail
 */
async function syncWithGitHub(integration: Integration): Promise<{ success: boolean; message: string; syncedItems?: number }> {
  console.log(`Syncing with GitHub for integration: ${integration.id}`);
  
  if (!integration.credentials.token) {
    throw new Error('Missing GitHub API token');
  }
  
  const repositories = integration.config.repositories || [];
  const dataTypes = integration.config.dataTypes || ['repositories', 'issues', 'pull_requests', 'commits'];
  let syncedItems = 0;
  
  try {
    const baseUrl = 'https://api.github.com';
    const headers = {
      'Authorization': `token ${integration.credentials.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BoostFlow-Integration'
    };
    
    // Sync user repositories if requested
    if (dataTypes.includes('repositories')) {
      console.log('Syncing GitHub repositories');
      
      const reposResponse = await fetch(`${baseUrl}/user/repos?per_page=100&sort=updated`, { headers });
      
      if (!reposResponse.ok) {
        throw new Error(`GitHub API error: ${reposResponse.status}`);
      }
      
      const reposData = await reposResponse.json();
      syncedItems += reposData.length;
    }
    
    // Sync repository-specific data (issues, PRs, commits) for configured repositories
    // Limited to 5 repositories to prevent API rate limiting
    if (repositories.length > 0 && (dataTypes.includes('issues') || dataTypes.includes('pull_requests') || dataTypes.includes('commits'))) {
      for (const repo of repositories.slice(0, 5)) {
        // Sync issues for the repository
        if (dataTypes.includes('issues')) {
          console.log(`Syncing issues for ${repo}`);
          
          const issuesResponse = await fetch(`${baseUrl}/repos/${repo}/issues?per_page=50&state=all`, { headers });
          
          if (issuesResponse.ok) {
            const issuesData = await issuesResponse.json();
            syncedItems += issuesData.length;
          }
        }
        
        // Sync pull requests for the repository
        if (dataTypes.includes('pull_requests')) {
          console.log(`Syncing pull requests for ${repo}`);
          
          const prsResponse = await fetch(`${baseUrl}/repos/${repo}/pulls?per_page=50&state=all`, { headers });
          
          if (prsResponse.ok) {
            const prsData = await prsResponse.json();
            syncedItems += prsData.length;
          }
        }
        
        // Sync recent commits for the repository
        if (dataTypes.includes('commits')) {
          console.log(`Syncing commits for ${repo}`);
          
          const commitsResponse = await fetch(`${baseUrl}/repos/${repo}/commits?per_page=50`, { headers });
          
          if (commitsResponse.ok) {
            const commitsData = await commitsResponse.json();
            syncedItems += commitsData.length;
          }
        }
      }
    }
    
    return {
      success: true,
      message: `Successfully synced with GitHub`,
      syncedItems
    };
  } catch (error) {
    console.error('GitHub sync error:', error);
    throw error;
  }
}

/**
 * Returns the list of supported integration providers with their metadata
 * Used for displaying available integration options in the UI
 * @returns Promise resolving to array of provider configurations
 */
export const getAvailableProviders = async (): Promise<Array<{ id: string; name: string; description: string; icon: string; }>> => {
  return [
    {
      id: 'google',
      name: 'Google',
      description: 'Connect with Google services like Calendar, Drive, and Gmail',
      icon: '/icons/google.svg'
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect with GitHub for repository management and code collaboration',
      icon: '/icons/github.svg'
    }
  ];
};
