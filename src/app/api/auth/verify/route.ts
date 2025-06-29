import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

/**
 * Initializes Firebase Admin SDK if not already initialized
 * Uses service account credentials from environment variables
 * @returns Firebase Admin instance
 */
const initializeFirebaseAdmin = () => {
  // Check if Firebase Admin is already initialized to avoid duplicate initialization
  if (admin.apps.length === 0) {
    // Parse service account key from environment variable with fallback to empty object
    const serviceAccount = JSON.parse(
      process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );
    
    // Initialize Firebase Admin with service account credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
};

/**
 * POST endpoint to verify user authentication and platform admin privileges
 * Validates session cookie and checks if user has platform admin role
 * @param request - NextRequest containing session cookie in request body
 * @returns JSON response with authorization status and user details
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin SDK
    const adminApp = initializeFirebaseAdmin();
    
    // Extract session cookie from request body
    const { sessionCookie } = await request.json();
    
    // Validate that session cookie is provided
    if (!sessionCookie) {
      return NextResponse.json({ isAuthorized: false, error: 'No session cookie provided' }, { status: 401 });
    }
    
    // Verify the session cookie and decode user claims
    // Second parameter 'true' checks if the cookie is revoked
    const decodedClaims = await adminApp.auth().verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;
    
    // Fetch user data from Firestore to check platform role
    const db = adminApp.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    // Extract platform role and determine if user has admin privileges
    const platformRole = userData?.platformRole;
    const isPlatformAdmin = 
      platformRole === 'super_admin' || 
      platformRole === 'platform_moderator';
    
    // Deny access if user doesn't have platform admin privileges
    if (!isPlatformAdmin) {
      return NextResponse.json({ isAuthorized: false, error: 'Insufficient privileges' }, { status: 403 });
    }
    
    // Return successful authorization with user details
    return NextResponse.json({ isAuthorized: true, uid, platformRole }, { status: 200 });
  } catch (error) {
    // Handle any authentication errors (invalid cookie, network issues, etc.)
    console.error('Authentication verification error:', error);
    return NextResponse.json({ isAuthorized: false, error: 'Authentication failed' }, { status: 401 });
  }
}