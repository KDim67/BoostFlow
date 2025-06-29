/**
 * Configuration object for OAuth providers (Google, GitHub, etc.)
 * Contains the necessary credentials and settings for OAuth flow
 */
export interface OAuthConfig {
  clientId: string;           // OAuth application client ID from provider
  clientSecret?: string;      // OAuth application secret (optional for client-side flows)
  redirectUri: string;        // URI where provider redirects after authorization
  scopes: string[];          // Array of permission scopes to request
}

/**
 * Standard OAuth token response structure
 * Returned by providers after successful authorization code exchange
 */
export interface OAuthTokenResponse {
  access_token: string;       // Token for API access
  refresh_token?: string;     // Token for refreshing access (optional)
  expires_in?: number;        // Token lifetime in seconds (optional)
  token_type: string;
  scope?: string;            // Granted scopes
}

/**
 * Generates Google OAuth authorization URL for user redirection
 */
export const getGoogleOAuthUrl = (config: OAuthConfig): string => {
  // Retrieve existing state or generate new one for CSRF protection
  const state = localStorage.getItem('oauth_state') || generateRandomState();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),     // Convert array to space-separated string
    response_type: 'code',              // Request authorization code (not token)
    access_type: 'offline',             // Request refresh token
    prompt: 'consent',                  // Force consent screen for refresh token
    state: state
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};



/**
 * Generates GitHub OAuth authorization URL for user redirection
 */
export const getGitHubOAuthUrl = (config: OAuthConfig): string => {
  // Use same state mechanism as Google for consistency
  const state = localStorage.getItem('oauth_state') || generateRandomState();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),     // GitHub uses space-separated scopes
    state: state
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * Exchanges Google authorization code for access/refresh tokens
 * Uses internal API endpoint to securely handle client secret
 * @param code - Authorization code from Google OAuth callback
 * @param config - OAuth configuration (redirectUri must match authorization request)
 */
export const exchangeGoogleCodeForToken = async (
  code: string,
  config: OAuthConfig
): Promise<OAuthTokenResponse> => {
  // Use internal API to avoid exposing client secret in frontend
  const response = await fetch('/api/oauth/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      provider: 'google',
      redirectUri: config.redirectUri    // Must match the one used in authorization
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google OAuth token exchange failed: ${errorData.error || response.status}`);
  }
  
  return response.json();
};



/**
 * Exchanges GitHub authorization code for access token
 * @param code - Authorization code from GitHub OAuth callback
 * @param config - OAuth configuration (redirectUri must match authorization request)
 */
export const exchangeGitHubCodeForToken = async (
  code: string,
  config: OAuthConfig
): Promise<OAuthTokenResponse> => {
  // Use same internal API pattern as Google for consistency
  const response = await fetch('/api/oauth/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      provider: 'github',
      redirectUri: config.redirectUri    // Must match authorization request
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub OAuth token exchange failed: ${errorData.error || response.status}`);
  }
  
  return response.json();
};

/**
 * Refreshes expired Google access token using refresh token
 * @param refreshToken - Valid refresh token from previous authorization
 * @param config - OAuth config with client secret (required for refresh)
 */
export const refreshGoogleToken = async (
  refreshToken: string,
  config: OAuthConfig
): Promise<OAuthTokenResponse> => {
  // Direct call to Google - requires client secret (security concern)
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'  // Google requires form encoding
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret!,  // Non-null assertion - required for refresh
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.status}`);
  }
  
  return response.json();
};



/**
 * Validates access token by making a test API call to the provider
 * Returns true if token is valid and not expired
 * @param accessToken - Token to validate
 * @param provider - OAuth provider ('google' or 'github')
 */
export const validateToken = async (accessToken: string, provider: string): Promise<boolean> => {
  try {
    let response;
    
    switch (provider) {
      case 'google':
        // Use Google's tokeninfo endpoint for validation
        response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        break;
        
      case 'github':
        // Use GitHub's user endpoint as validation
        response = await fetch('https://api.github.com/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        break;
        
      default:
        return false;  // Unsupported provider
    }
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;  // Network errors or other exceptions = invalid
  }
};

/**
 * Generates random state for CSRF protection
 * Combines two random base36 strings for ~22 character result
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Returns default scopes for each OAuth provider
 * These scopes provide read-only access to common user data and services
 * @param provider - OAuth provider type
 */
export const getProviderScopes = (provider: 'google' | 'github'): string[] => {
  switch (provider) {
    case 'google':
      return [
        'https://www.googleapis.com/auth/calendar.readonly',    // Read calendar events
        'https://www.googleapis.com/auth/drive.readonly',       // Read Google Drive files
        'https://www.googleapis.com/auth/gmail.readonly',       // Read Gmail messages
        'https://www.googleapis.com/auth/userinfo.email',       // Access user email
        'https://www.googleapis.com/auth/userinfo.profile'      // Access user profile info
      ];
    case 'github':
      return [
        'repo',         // Access to repositories (read/write)
        'user:email',   // Access to user email addresses
        'read:user'     // Read user profile information
      ];
    default:
      return [];  // Empty array for unsupported providers
  }
};