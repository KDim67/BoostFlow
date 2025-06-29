import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth token exchange endpoint
 * Exchanges authorization codes for access tokens from supported OAuth providers
 * Supports Google and GitHub OAuth flows
 */
export async function POST(request: NextRequest) {
  try {
    // Extract OAuth parameters from request body
    const { code, provider, redirectUri } = await request.json();
    
    // Validate required OAuth parameters
    if (!code || !provider || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize provider-specific OAuth configuration
    let clientId: string;
    let clientSecret: string;
    let tokenUrl: string;
    let tokenParams: Record<string, string>;

    // Configure OAuth parameters based on provider
    switch (provider) {
      case 'google':
        // Google OAuth 2.0 configuration
        clientId = process.env.GOOGLE_CLIENT_ID!;
        clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        tokenUrl = 'https://oauth2.googleapis.com/token';
        tokenParams = {
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code', // Required by Google OAuth spec
          redirect_uri: redirectUri
        };
        break;
        
      case 'github':
        // GitHub OAuth configuration
        clientId = process.env.GITHUB_CLIENT_ID!;
        clientSecret = process.env.GITHUB_CLIENT_SECRET!;
        tokenUrl = 'https://github.com/login/oauth/access_token';
        tokenParams = {
          client_id: clientId,
          client_secret: clientSecret,
          code
          // Note: GitHub doesn't require redirect_uri in token exchange
        };
        break;
        
      default:
        // Reject unsupported OAuth providers
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    // Exchange authorization code for access token
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Required format for OAuth token requests
        'Accept': 'application/json' // Request JSON response format
      },
      body: new URLSearchParams(tokenParams) // URL-encode the parameters
    });

    // Handle token exchange failure
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OAuth token exchange failed for ${provider}:`, errorText);
      return NextResponse.json(
        { error: `Token exchange failed: ${response.status}` },
        { status: response.status }
      );
    }

    // Return the token data (access_token, refresh_token, etc.) to client
    const tokenData = await response.json();
    return NextResponse.json(tokenData);
    
  } catch (error) {
    // Handle unexpected errors during token exchange process
    console.error('OAuth token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}