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

export interface DataMapping {
  id: string;
  integrationId: string;
  sourceField: string;
  targetField: string;
  transformationRule?: string;
  isRequired: boolean;
}

function getStoredIntegrations(): Integration[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('boostflow_integrations');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading integrations from localStorage:', error);
    return [];
  }
}

export const getAllIntegrations = async (): Promise<Integration[]> => {
  try {
    const integrations = getStoredIntegrations();
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

export const deleteIntegration = async (integrationId: string): Promise<boolean> => {
  try {
    const integrations = getStoredIntegrations();
    const filteredIntegrations = integrations.filter(i => i.id !== integrationId);
    
    localStorage.setItem('boostflow_integrations', JSON.stringify(filteredIntegrations));
    
    console.log('Deleted integration:', integrationId);
    return true;
  } catch (error) {
    console.error('Error deleting integration:', error);
    return false;
  }
};

export const createIntegration = async (integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Integration> => {
  const newIntegration: Integration = {
    ...integration,
    id: `integration-${Date.now()}`,
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


export const getIntegration = async (integrationId: string): Promise<Integration | null> => {
  try {
    const integrations = getStoredIntegrations();
    const integration = integrations.find(i => i.id === integrationId);
    
    if (integration) {
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

export const updateIntegration = async (integrationId: string, updates: Partial<Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Integration> => {
  const integration = await getIntegration(integrationId);
  
  if (!integration) {
    throw new Error(`Integration with ID ${integrationId} not found`);
  }
  
  const updatedIntegration: Integration = {
    ...integration,
    ...updates,
    updatedAt: new Date()
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

export const syncIntegration = async (integrationId: string): Promise<{ success: boolean; message: string; syncedItems?: number }> => {

  const integration = await getIntegration(integrationId);
  
  if (!integration) {
    throw new Error(`Integration with ID ${integrationId} not found`);
  }
  
  try {
 
    await updateIntegration(integrationId, {
      status: 'active',
      errorMessage: undefined
    });
    

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
    
    await updateIntegration(integrationId, {
      lastSyncAt: new Date(),
      status: 'active',
      errorMessage: undefined
    });
    
    console.log('Sync result:', syncResult);
    
    return syncResult;
  } catch (error) {
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


async function syncWithGoogleServices(integration: Integration): Promise<{ success: boolean; message: string; syncedItems?: number }> {
  console.log(`Syncing with Google services for integration: ${integration.id}`);
  
  if (!integration.credentials.accessToken) {
    throw new Error('Missing Google API access token');
  }
  
  const scopes = integration.config.scopes || [];
  let syncedItems = 0;
  
  try {
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
    
    if (dataTypes.includes('repositories')) {
      console.log('Syncing GitHub repositories');
      
      const reposResponse = await fetch(`${baseUrl}/user/repos?per_page=100&sort=updated`, { headers });
      
      if (!reposResponse.ok) {
        throw new Error(`GitHub API error: ${reposResponse.status}`);
      }
      
      const reposData = await reposResponse.json();
      syncedItems += reposData.length;
    }
    
    if (repositories.length > 0 && (dataTypes.includes('issues') || dataTypes.includes('pull_requests') || dataTypes.includes('commits'))) {
      for (const repo of repositories.slice(0, 5)) {
        if (dataTypes.includes('issues')) {
          console.log(`Syncing issues for ${repo}`);
          
          const issuesResponse = await fetch(`${baseUrl}/repos/${repo}/issues?per_page=50&state=all`, { headers });
          
          if (issuesResponse.ok) {
            const issuesData = await issuesResponse.json();
            syncedItems += issuesData.length;
          }
        }
        
        if (dataTypes.includes('pull_requests')) {
          console.log(`Syncing pull requests for ${repo}`);
          
          const prsResponse = await fetch(`${baseUrl}/repos/${repo}/pulls?per_page=50&state=all`, { headers });
          
          if (prsResponse.ok) {
            const prsData = await prsResponse.json();
            syncedItems += prsData.length;
          }
        }
        
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
