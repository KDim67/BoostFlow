import { NextRequest, NextResponse } from 'next/server';
import { inviteTeamMember } from '@/lib/firebase/organizationService';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { OrganizationRole } from '@/lib/types/organization';

const auth = getAuth(adminApp);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const body = await request.json();
    const { email, role = 'member' } = body;

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const inviterUserId = decodedToken.uid;

    // Validate input
    if (!email || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Email and organization ID are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Invite the team member
    const membershipId = await inviteTeamMember(
      organizationId,
      inviterUserId,
      email,
      role as OrganizationRole
    );

    return NextResponse.json({
      success: true,
      membershipId,
      message: 'Invitation sent successfully'
    });

  } catch (error) {
    console.error('Error inviting team member:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}