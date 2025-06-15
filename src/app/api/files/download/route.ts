import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { getDocument } from '@/lib/firebase/firestoreService';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import minioClient, { BUCKETS } from '@/lib/minio/client';

const auth = getAuth(adminApp);

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify the Firebase token
      const decodedToken = await auth.verifyIdToken(token);
      
      // Get the document from Firestore
      const document = await getDocument('project-documents', documentId);
      
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      
      // Check if user has permission to access this document's organization
       const hasPermission = await hasOrganizationPermission(
         decodedToken.uid,
         document.organizationId,
         'viewer'
       );
      
      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Stream file directly from MinIO
      const fileStream = await minioClient.getObject(BUCKETS.PROJECT_DOCUMENTS, document.fileName);
      
      // Convert stream to buffer for Next.js response
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);
      
      // Create response with proper headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': document.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${document.originalName}"`,
          'Cache-Control': 'private, no-cache',
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
      return response;
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}