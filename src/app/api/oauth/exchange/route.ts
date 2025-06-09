import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, provider, redirectUri } = await request.json();
    
    if (!code || !provider || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let clientId: string;
    let clientSecret: string;
    let tokenUrl: string;
    let tokenParams: Record<string, string>;

    switch (provider) {
      case 'google':
        clientId = process.env.GOOGLE_CLIENT_ID!;
        clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        tokenUrl = 'https://oauth2.googleapis.com/token';
        tokenParams = {
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        };
        break;
        

        
      case 'github':
        clientId = process.env.GITHUB_CLIENT_ID!;
        clientSecret = process.env.GITHUB_CLIENT_SECRET!;
        tokenUrl = 'https://github.com/login/oauth/access_token';
        tokenParams = {
          client_id: clientId,
          client_secret: clientSecret,
          code
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenParams)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OAuth token exchange failed for ${provider}:`, errorText);
      return NextResponse.json(
        { error: `Token exchange failed: ${response.status}` },
        { status: response.status }
      );
    }

    const tokenData = await response.json();
    return NextResponse.json(tokenData);
    
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}