'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createIntegration } from '@/lib/services/integration/integrationService';
import {
  exchangeGoogleCodeForToken,
  exchangeGitHubCodeForToken
} from '@/lib/services/integration/oauthHelpers';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const provider = localStorage.getItem('oauth_provider');
      const storedState = localStorage.getItem('oauth_state');
      const context = localStorage.getItem('oauth_context');
      const organizationId = localStorage.getItem('oauth_organization_id');
      const userId = localStorage.getItem('oauth_user_id');
      
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }
        
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        console.log('OAuth callback debug:', {
          receivedState: state,
          storedState: storedState,
          provider: provider,
          context: context,
          organizationId: organizationId,
          userId: userId,
          statesMatch: state === storedState
        });
        
        if (!provider || !storedState) {
          throw new Error('Invalid OAuth state - missing provider or state');
        }
        
        if (state !== storedState) {
          throw new Error(`Invalid OAuth state - state mismatch. Received: ${state}, Stored: ${storedState}`);
        }
        
        setMessage(`Exchanging authorization code for ${provider} access token...`);
        
        let tokenData;
        const redirectUri = `${window.location.origin}/oauth/callback`;
        
        switch (provider) {
          case 'google':
            tokenData = await exchangeGoogleCodeForToken(code, {
              clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
              redirectUri,
              scopes: []
            });
            break;
          case 'github':
            tokenData = await exchangeGitHubCodeForToken(code, {
              clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
              redirectUri,
              scopes: []
            });
            break;
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
        
        setMessage('Creating integration...');
        
        const integrationConfig: Record<string, any> = {
          syncInterval: 60,
          autoSync: true
        };
        
        if (context === 'organization' && organizationId) {
          integrationConfig.organizationId = organizationId;
        } else if (context === 'personal' && userId) {
          integrationConfig.userId = userId;
        }
        
        const integration = await createIntegration({
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`,
          description: `Connected ${provider} account`,
          type: 'oauth',
          provider,
          config: integrationConfig,
          credentials: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
            tokenType: tokenData.token_type || 'Bearer'
          },
          status: 'active',
          createdBy: userId || 'current-user' 
        });
        
        localStorage.removeItem('oauth_provider');
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_context');
        localStorage.removeItem('oauth_user_id');
        
        setStatus('success');
        setMessage('Integration created successfully! Redirecting...');
        
        setTimeout(() => {
          if (context === 'organization' && organizationId) {
            router.push(`/organizations/${organizationId}`);
          } else if (context === 'personal') {
            router.push('/settings');
          } else {
            router.push('/organizations');
          }
          
          localStorage.removeItem('oauth_organization_id');
          localStorage.removeItem('oauth_project_id');
        }, 2000);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        
        localStorage.removeItem('oauth_provider');
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_context');
        localStorage.removeItem('oauth_user_id');
        
        setTimeout(() => {
          if (context === 'organization' && organizationId) {
            router.push(`/organizations/${organizationId}`);
          } else if (context === 'personal') {
            router.push('/settings');
          } else {
            router.push('/organizations');
          }
          
          localStorage.removeItem('oauth_organization_id');
          localStorage.removeItem('oauth_project_id');
        }, 5000);
      }
    };
    
    handleOAuthCallback();
  }, [searchParams, router]);

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
        
        <div className="flex justify-center">
          {status === 'processing' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          )}
          
          {status === 'success' && (
            <div className="rounded-full h-12 w-12 bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        {status === 'error' && (
          <div className="text-center">
            <button
              onClick={() => {
          const context = localStorage.getItem('oauth_context');
          const organizationId = localStorage.getItem('oauth_organization_id');
          
          if (context === 'organization' && organizationId) {
            router.push(`/organizations/${organizationId}`);
          } else if (context === 'personal') {
            router.push('/settings');
          } else {
            router.push('/organizations');
          }
          
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

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
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