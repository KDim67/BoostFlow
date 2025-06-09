import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { OrganizationMembership } from '@/lib/types/organization';
import { NotificationService } from '@/lib/firebase/notificationService';
import { serverTimestamp } from 'firebase/firestore';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(
      process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
};

interface InvitationResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
  organizationId?: string;
  organizationName?: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const membership = await getDocument('organizationMemberships', token) as OrganizationMembership;
    
    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    if (membership.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    if (membership.status !== 'invited') {
      return NextResponse.json(
        { success: false, message: 'This invitation has already been processed' },
        { status: 400 }
      );
    }

    const organization = await getDocument('organizations', membership.organizationId);
    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    let response: InvitationResponse;

    if (action === 'accept') {
      await updateDocument('organizationMemberships', token, {
        status: 'active',
        joinedAt: serverTimestamp()
      });

      await NotificationService.removeInvitationNotification(membership.userId, token);

      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Accepted',
          `Your invitation to join ${organization.name} has been accepted.`,
          'team_invite_accepted',
          membership.organizationId,
          `/organizations/${membership.organizationId}`,
          {
            organizationId: membership.organizationId,
            membershipId: token,
            acceptedBy: membership.userId
          }
        );
      }

      response = {
        success: true,
        message: `Successfully joined ${organization.name}`,
        redirectUrl: `/organizations/${membership.organizationId}`,
        organizationId: membership.organizationId,
        organizationName: organization.name
      };
    } else {
      await NotificationService.removeInvitationNotification(membership.userId, token);

      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Declined',
          `Your invitation to join ${organization.name} has been declined.`,
          'team_invite_declined',
          membership.organizationId,
          `/organizations/${membership.organizationId}`,
          {
            organizationId: membership.organizationId,
            membershipId: token,
            declinedBy: membership.userId
          }
        );
      }

      await updateDocument('organizationMemberships', token, {
        status: 'declined'
      });

      response = {
        success: true,
        message: `Invitation to join ${organization.name} has been declined`,
        redirectUrl: '/organizations'
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { action, userId } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const membership = await getDocument('organizationMemberships', token) as OrganizationMembership;
    
    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    if (membership.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    if (membership.status !== 'invited') {
      return NextResponse.json(
        { success: false, message: 'This invitation has already been processed' },
        { status: 400 }
      );
    }

    const organization = await getDocument('organizations', membership.organizationId);
    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    let response: InvitationResponse;

    if (action === 'accept') {
      await updateDocument('organizationMemberships', token, {
        status: 'active',
        joinedAt: serverTimestamp()
      });

      await NotificationService.removeInvitationNotification(membership.userId, token);

      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Accepted',
          `Your invitation to join ${organization.name} has been accepted.`,
          'team_invite_accepted',
          membership.organizationId,
          `/organizations/${membership.organizationId}`,
          {
            organizationId: membership.organizationId,
            membershipId: token,
            acceptedBy: membership.userId
          }
        );
      }

      response = {
        success: true,
        message: `Successfully joined ${organization.name}`,
        redirectUrl: `/organizations/${membership.organizationId}`,
        organizationId: membership.organizationId,
        organizationName: organization.name
      };
    } else {
      await NotificationService.removeInvitationNotification(membership.userId, token);

      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Declined',
          `Your invitation to join ${organization.name} has been declined.`,
          'team_invite_declined',
          membership.organizationId,
          `/organizations/${membership.organizationId}`,
          {
            organizationId: membership.organizationId,
            membershipId: token,
            declinedBy: membership.userId
          }
        );
      }

      await updateDocument('organizationMemberships', token, {
        status: 'declined'
      });

      response = {
        success: true,
        message: `Invitation to join ${organization.name} has been declined`,
        redirectUrl: '/organizations'
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}