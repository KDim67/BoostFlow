import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getDocument } from '@/lib/firebase/firestoreService';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getPresignedUrl, BUCKETS } from '@/lib/minio/client';

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      throw new Error('Firebase service account key not found in environment variables');
    }
    
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    if (!serviceAccount.project_id) {
      throw new Error('Service account object must contain a string "project_id" property');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

const auth = admin.auth();

export async function POST(request: NextRequest) {
  try {
    console.log('Download request received');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log('User authenticated:', userId);

    const { documentId } = await request.json();
    console.log('Document ID:', documentId);

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get document from Firestore
    const document = await getDocument('project-documents', documentId);
    console.log('Document found:', document ? 'Yes' : 'No');
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    console.log('Checking permissions for organization:', document.organizationId);
    // Check if user has permission to access this organization
    const hasPermission = await hasOrganizationPermission(userId, document.organizationId, 'viewer');
    console.log('Has permission:', hasPermission);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('Generating presigned URL for file:', document.fileName);
    // Generate presigned URL for secure access
    const presignedUrl = await getPresignedUrl(
      BUCKETS.PROJECT_DOCUMENTS,
      document.fileName,
      3600 // 1 hour expiry
    );
    console.log('Presigned URL generated successfully');

    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}