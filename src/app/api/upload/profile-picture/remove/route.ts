import { NextRequest, NextResponse } from 'next/server';
import { deleteFileByUrl, BUCKETS } from '@/lib/minio/client';
import { updateUserProfile, getUserProfile } from '@/lib/firebase/userProfileService';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';

const auth = getAuth(adminApp);

export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get current user profile to check for existing profile picture
    const currentProfile = await getUserProfile(userId);
    const oldProfilePictureUrl = currentProfile?.profilePicture;

    // Update user profile to remove picture URL
    await updateUserProfile(userId, {
      profilePicture: '',
      updatedAt: new Date(),
    });

    // Delete old profile picture file if it exists
    if (oldProfilePictureUrl) {
      await deleteFileByUrl(oldProfilePictureUrl, BUCKETS.PROFILE_PICTURES);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully',
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to remove profile picture' },
      { status: 500 }
    );
  }
}