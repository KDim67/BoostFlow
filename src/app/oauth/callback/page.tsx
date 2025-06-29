'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createIntegration } from '@/lib/services/integration/integrationService';
import {
  exchangeGoogleCodeForToken,
  exchangeGitHubCodeForToken
} from '@/lib/services/integration/oauthHelpers';

/**
 * Main OAuth callback handler component that processes the OAuth flow completion
 * Handles token exchange, integration creation, and user redirection
 */
function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Track the current state of the OAuth callback process
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  // User-facing message describing the current operation
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    /**
     * Handles the complete OAuth callback flow:
     * 1. Validates OAuth state and parameters
     * 2. Exchanges authorization code for access token
     * 3. Creates integration record in the system
     * 4. Cleans up temporary data and redirects user
     */
    const handleOAuthCallback = async () => {
      // Retrieve OAuth session data stored during the initial authorization request
      const provider = localStorage.getItem('oauth_provider'); // 'google' or 'github'
      const storedState = localStorage.getItem('oauth_state'); // CSRF protection token
      const context = localStorage.getItem('oauth_context'); // 'organization' or 'personal'
      const organizationId = localStorage.getItem('oauth_organization_id');
      const userId = localStorage.getItem('oauth_user_id');
      
      try {
        // Extract OAuth callback parameters from URL
        const code = searchParams.get('code'); // Authorization code from OAuth provider
        const state = searchParams.get('state'); // State parameter for CSRF protection
        const error = searchParams.get('error'); // Error parameter if OAuth failed
        
        // Handle OAuth provider errors (user denied access, etc.)
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }
        
        // Ensure we received an authorization code to exchange for tokens
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        // Debug logging for OAuth callback parameters and state validation
        console.log('OAuth callback debug:', {
          receivedState: state,
          storedState: storedState,
          provider: provider,
          context: context,
          organizationId: organizationId,
          userId: userId,
          statesMatch: state === storedState
        });
        
        // Validate that we have the required OAuth session data
        if (!provider || !storedState) {
          throw new Error('Invalid OAuth state - missing provider or state');
        }
        
        // CSRF protection: verify the state parameter matches what we stored
        if (state !== storedState) {
          throw new Error(`Invalid OAuth state - state mismatch. Received: ${state}, Stored: ${storedState}`);
        }
        
        setMessage(`Exchanging authorization code for ${provider} access token...`);
        
        let tokenData;
        // Construct the redirect URI that matches what was used in the initial OAuth request
        const redirectUri = `${window.location.origin}/oauth/callback`;
        
        // Exchange the authorization code for access tokens based on the OAuth provider
        switch (provider) {
          case 'google':
            tokenData = await exchangeGoogleCodeForToken(code, {
              clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
              redirectUri,
              scopes: [] // Scopes are already defined in the initial authorization request
            });
            break;
          case 'github':
            tokenData = await exchangeGitHubCodeForToken(code, {
              clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
              redirectUri,
              scopes: [] // Scopes are already defined in the initial authorization request
            });
            break;
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
        
        setMessage('Creating integration...');
        
        // Configure the integration with default sync settings
        const integrationConfig: Record<string, any> = {
          syncInterval: 60, // Sync every 60 minutes
          autoSync: true // Enable automatic synchronization
        };
        
        // Set the appropriate scope for the integration (organization or personal)
        if (context === 'organization' && organizationId) {
          integrationConfig.organizationId = organizationId;
        } else if (context === 'personal' && userId) {
          integrationConfig.userId = userId;
        }
        
        // Create the integration record in the system with OAuth credentials
        const integration = await createIntegration({
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`,
          description: `Connected ${provider} account`,
          type: 'oauth',
          provider,
          config: integrationConfig,
          credentials: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            // Calculate token expiration time if provided by the OAuth provider
            expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
            tokenType: tokenData.token_type || 'Bearer'
          },
          status: 'active',
          createdBy: userId || 'current-user' 
        });
        
        // Clean up OAuth session data from localStorage
        localStorage.removeItem('oauth_provider');
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_context');
        localStorage.removeItem('oauth_user_id');
        
        setStatus('success');
        setMessage('Integration created successfully! Redirecting...');
        
        // Redirect user to appropriate page after successful integration
        setTimeout(() => {
          if (context === 'organization' && organizationId) {
            router.push(`/organizations/${organizationId}`);
          } else if (context === 'personal') {
            router.push('/settings');
          } else {
            router.push('/organizations'); // Fallback to organizations list
          }
          
          // Clean up remaining OAuth-related data
          localStorage.removeItem('oauth_organization_id');
          localStorage.removeItem('oauth_project_id');
        }, 2000);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        
        // Clean up OAuth session data on error
        localStorage.removeItem('oauth_provider');
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_context');
        localStorage.removeItem('oauth_user_id');
        
        // Auto-redirect user back to the appropriate page after error
        setTimeout(() => {
          if (context === 'organization' && organizationId) {
            router.push(`/organizations/${organizationId}`);
          } else if (context === 'personal') {
            router.push('/settings');
          } else {
            router.push('/organizations');
          }
          
          // Clean up remaining OAuth-related data
          localStorage.removeItem('oauth_organization_id');
          localStorage.removeItem('oauth_project_id');
        }, 5000);
      }
    };
    
    // Execute OAuth callback handling when component mounts
    handleOAuthCallback();
  }, [searchParams, router]); // Re-run if URL parameters or router change

  // Render the OAuth callback status page with appropriate visual feedback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            OAuth Integration
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        
        {/* Visual status indicators for different OAuth callback states */}
        <div className="flex justify-center">
          {/* Loading spinner during OAuth processing */}
          {status === 'processing' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          )}
          
          {/* Success checkmark icon */}
          {status === 'success' && (
            <div className="rounded-full h-12 w-12 bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {/* Error X icon */}
          {status === 'error' && (
            <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Manual return button shown only on error */}
        {status === 'error' && (
          <div className="text-center">
            <button
              onClick={() => {
                // Navigate back to the appropriate page based on OAuth context
                const context = localStorage.getItem('oauth_context');
                const organizationId = localStorage.getItem('oauth_organization_id');
                
                if (context === 'organization' && organizationId) {
                  router.push(`/organizations/${organizationId}`);
                } else if (context === 'personal') {
                  router.push('/settings');
                } else {
                  router.push('/organizations');
                }
                
                // Clean up remaining OAuth data
                localStorage.removeItem('oauth_organization_id');
                localStorage.removeItem('oauth_project_id');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return to Integrations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * OAuth Callback Page Component
 * 
 * This page handles OAuth provider callbacks after user authorization.
 * It's wrapped in Suspense to handle the async nature of useSearchParams
 * which requires client-side hydration in Next.js App Router.
 */
export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      // Loading state shown while the component hydrates and accesses URL parameters
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              OAuth Integration
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Loading...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}