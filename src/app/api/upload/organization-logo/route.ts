import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, BUCKETS, generateFileName, initializeBuckets } from '@/lib/minio/client';
import { updateOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';

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
    const organizationId = formData.get('organizationId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has permission to update the organization
    const hasPermission = await hasOrganizationPermission(userId, organizationId, 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileName = generateFileName(file.name, `org-${organizationId}`);

    // Upload to MinIO
    const fileUrl = await uploadFile(
      BUCKETS.PROFILE_PICTURES, // Using the same bucket as profile pictures
      fileName,
      buffer,
      file.type
    );

    // Update organization with new logo URL
    await updateOrganization(organizationId, {
      logoUrl: fileUrl,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: 'Organization logo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading organization logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload organization logo' },
      { status: 500 }
    );
  }
}