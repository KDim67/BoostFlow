import { NextRequest, NextResponse } from 'next/server';
import { deleteFileByUrl, BUCKETS } from '@/lib/minio/client';
import { deleteOrganization, getOrganization } from '@/lib/firebase/organizationService';
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

    // Get organization ID from request body
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }
    
    // Get organization data to check for logo before deletion
    const organization = await getOrganization(organizationId);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete organization from database
    await deleteOrganization(organizationId);

    // Delete organization logo from MinIO if it exists
    if (organization.logoUrl) {
      try {
        await deleteFileByUrl(organization.logoUrl, BUCKETS.ORGANIZATION_LOGOS);
      } catch (minioError) {
        console.error('Error deleting organization logo from MinIO:', minioError);
        // Don't throw here as the organization is already deleted from database
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}