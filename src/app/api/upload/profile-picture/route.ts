import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, BUCKETS, generateFileName, initializeBuckets } from '@/lib/minio/client';
import { updateUserProfile } from '@/lib/firebase/userProfileService';
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    const fileName = generateFileName(file.name, userId);

    // Upload to MinIO
    const fileUrl = await uploadFile(
      BUCKETS.PROFILE_PICTURES,
      fileName,
      buffer,
      file.type
    );

    // Update user profile with new picture URL
    await updateUserProfile(userId, {
      profilePicture: fileUrl,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: 'Profile picture uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}