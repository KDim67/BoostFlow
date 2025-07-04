import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { getDocument } from '@/lib/firebase/firestoreService';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import minioClient, { BUCKETS } from '@/lib/minio/client';

const auth = getAuth(adminApp);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse the file path
    const [organizationId, projectId, documentId] = resolvedParams.path;

    if (!organizationId || !projectId || !documentId) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Get document from Firestore to get the actual fileName
    const document = await getDocument('project-documents', documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has permission to access this organization (all organization staff can access files)
    const hasPermission = await hasOrganizationPermission(userId, document.organizationId, 'viewer');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
  } catch (error) {
    console.error('Error accessing file:', error);
    return NextResponse.json(
      { error: 'Failed to access file' },
      { status: 500 }
    );
  }
}

// Alternative approach: Return the presigned URL as JSON
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get document from Firestore
    const document = await getDocument('project-documents', documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has permission to access this organization (all organization staff can access files)
    const hasPermission = await hasOrganizationPermission(userId, document.organizationId, 'viewer');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}