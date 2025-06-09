export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export const getGoogleOAuthUrl = (config: OAuthConfig): string => {
  const state = localStorage.getItem('oauth_state') || generateRandomState();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};



export const getGitHubOAuthUrl = (config: OAuthConfig): string => {
  const state = localStorage.getItem('oauth_state') || generateRandomState();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: state
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

export const exchangeGoogleCodeForToken = async (
  code: string,
  config: OAuthConfig
): Promise<OAuthTokenResponse> => {
  const response = await fetch('/api/oauth/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      provider: 'google',
      redirectUri: config.redirectUri
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google OAuth token exchange failed: ${errorData.error || response.status}`);
  }
  
  return response.json();
};



export const exchangeGitHubCodeForToken = async (
  code: string,
  config: OAuthConfig
): Promise<OAuthTokenResponse> => {
  const response = await fetch('/api/oauth/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      provider: 'github',
      redirectUri: config.redirectUri
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub OAuth token exchange failed: ${errorData.error || response.status}`);
  }
  
  return response.json();
};

export const refreshGoogleToken = async (
  refreshToken: string,
  config: OAuthConfig
): Promise<OAuthTokenResponse> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.status}`);
  }
  
  return response.json();
};



export const validateToken = async (accessToken: string, provider: string): Promise<boolean> => {
  try {
    let response;
    
    switch (provider) {
      case 'google':
        response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        break;
        
      case 'github':
        response = await fetch('https://api.github.com/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        break;
        
      default:
        return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const getProviderScopes = (provider: 'google' | 'github'): string[] => {
  switch (provider) {
    case 'google':
      return [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];
    case 'github':
      return [
        'repo',
        'user:email',
        'read:user'
      ];
    default:
      return [];
  }
};