import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(
      process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
};

export async function POST(request: NextRequest) {
  try {
    const adminApp = initializeFirebaseAdmin();
    
    const { sessionCookie } = await request.json();
    
    if (!sessionCookie) {
      return NextResponse.json({ isAuthorized: false, error: 'No session cookie provided' }, { status: 401 });
    }
    
    const decodedClaims = await adminApp.auth().verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;
    
    const db = adminApp.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    const platformRole = userData?.platformRole;
    const isPlatformAdmin = 
      platformRole === 'super_admin' || 
      platformRole === 'platform_moderator';
    
    if (!isPlatformAdmin) {
      return NextResponse.json({ isAuthorized: false, error: 'Insufficient privileges' }, { status: 403 });
    }
    
    return NextResponse.json({ isAuthorized: true, uid, platformRole }, { status: 200 });
  } catch (error) {
    console.error('Authentication verification error:', error);
    return NextResponse.json({ isAuthorized: false, error: 'Authentication failed' }, { status: 401 });
  }
}