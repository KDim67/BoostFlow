import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, BUCKETS, generateFileName, initializeBuckets } from '@/lib/minio/client';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { addDocument } from '@/lib/firebase/firestoreService';

const auth = getAuth(adminApp);

export async function POST(request: NextRequest) {
  try {
    // Initialize buckets if they don't exist
    await initializeBuckets();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const organizationId = formData.get('organizationId') as string;
    const folder = formData.get('folder') as string || 'General';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!projectId || !organizationId) {
      return NextResponse.json({ error: 'Project ID and Organization ID are required' }, { status: 400 });
    }

    // Validate file size (50MB limit for documents)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename with project context
    const fileName = `${organizationId}/${projectId}/${generateFileName(file.name, userId)}`;

    // Upload to MinIO
    const fileUrl = await uploadFile(
      BUCKETS.PROJECT_DOCUMENTS,
      fileName,
      buffer,
      file.type
    );

    // Get file extension and type
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const getFileType = (ext: string) => {
      const types: { [key: string]: string } = {
        pdf: 'PDF',
        doc: 'Word',
        docx: 'Word',
        xls: 'Excel',
        xlsx: 'Excel',
        ppt: 'PowerPoint',
        pptx: 'PowerPoint',
        txt: 'Text',
        jpg: 'Image',
        jpeg: 'Image',
        png: 'Image',
        gif: 'Image',
        svg: 'Image',
        zip: 'Archive',
        rar: 'Archive',
        '7z': 'Archive',
      };
      return types[ext] || 'Document';
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Save document metadata to Firestore
    const documentData = {
      name: file.name,
      type: getFileType(extension),
      size: formatFileSize(file.size),
      sizeBytes: file.size,
      url: fileUrl,
      fileName: fileName,
      folder: folder,
      projectId: projectId,
      organizationId: organizationId,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      contentType: file.type,
    };

    const documentId = await addDocument('project-documents', documentData);

    return NextResponse.json({
      success: true,
      documentId,
      url: fileUrl,
      document: { id: documentId, ...documentData },
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading project document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}