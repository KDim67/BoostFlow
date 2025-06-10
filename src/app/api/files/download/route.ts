import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { getDocument } from '@/lib/firebase/firestoreService';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getPresignedUrl, BUCKETS } from '@/lib/minio/client';

const auth = getAuth(adminApp);

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