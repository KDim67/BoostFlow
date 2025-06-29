import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { OrganizationMembership } from '@/lib/types/organization';
import { NotificationService } from '@/lib/firebase/notificationService';
import { getOrganizationMembers } from '@/lib/firebase/organizationService';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Initializes Firebase Admin SDK if not already initialized
 * Uses service account credentials from environment variables
 * @returns Firebase Admin instance
 */
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

/**
 * Response structure for invitation processing operations
 */
interface InvitationResponse {
  success: boolean;
  message: string;
  redirectUrl?: string; // Where to redirect user after processing
  organizationId?: string;
  organizationName?: string;
}

/**
 * GET handler for invitation tokens
 * - Without action: Returns invitation details for display
 * - With action (accept/decline): Processes the invitation response
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'accept', 'decline', or null for details
    const userId = searchParams.get('userId');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    // Retrieve membership record using token as document ID
    const membership = await getDocument('organizationMemberships', token) as OrganizationMembership;
    
    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    // Ensure invitation hasn't been processed already
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

    // Get inviter details for display purposes
    const inviterUser = membership.invitedBy ? await getDocument('users', membership.invitedBy) : null;

    // If no action specified, return invitation details for UI display
    if (!action) {
      return NextResponse.json({
        success: true,
        organizationName: organization.name,
        organizationId: membership.organizationId,
        role: membership.role,
        inviterName: inviterUser?.displayName || inviterUser?.email || 'Unknown'
      });
    }

    if (!['accept', 'decline'].includes(action)) {
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

    // Verify invitation belongs to the requesting user
    if (membership.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    let response: InvitationResponse;

    // Process invitation acceptance
    if (action === 'accept') {
      // Update membership status to active and record join timestamp
      await updateDocument('organizationMemberships', token, {
        status: 'active',
        joinedAt: serverTimestamp()
      });

      // Clean up invitation notification
      await NotificationService.removeInvitationNotification(membership.userId, token);

      // Notify the inviter about acceptance
      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Accepted',
          `Your invitation to join ${organization.name} has been accepted.`,
          'organization_invite_accepted',
          membership.organizationId,
          `/organizations/${membership.organizationId}`,
          {
            organizationId: membership.organizationId,
            membershipId: token,
            acceptedBy: membership.userId
          }
        );
      }

      // Notify all existing organization members about the new joiner
      try {
        const allMembers = await getOrganizationMembers(membership.organizationId);
        const existingMembers = allMembers.filter(member => member.userId !== membership.userId);
        
        const memberJoinedPromises = existingMembers.map(member => 
          NotificationService.createNotification(
            member.userId,
            'New Member Joined',
            `${membership.userProfile?.displayName || membership.userProfile?.email || 'A new member'} has joined ${organization.name}.`,
            'member_joined',
            membership.organizationId,
            `/organizations/${membership.organizationId}/members`,
            {
              joinedMemberId: membership.userId,
              joinedMemberName: membership.userProfile?.displayName || membership.userProfile?.email,
              organizationId: membership.organizationId
            }
          )
        );
        
        await Promise.all(memberJoinedPromises);
      } catch (notificationError) {
        // Non-critical: Don't fail the invitation if notifications fail
        console.warn('Failed to send member_joined notifications:', notificationError);
      }

      response = {
        success: true,
        message: `Successfully joined ${organization.name}`,
        redirectUrl: `/organizations/${membership.organizationId}`,
        organizationId: membership.organizationId,
        organizationName: organization.name
      };
    } else {
      // Process invitation decline
      await NotificationService.removeInvitationNotification(membership.userId, token);

      // Notify the inviter about decline
      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Declined',
          `Your invitation to join ${organization.name} has been declined.`,
          'organization_invite_declined',
          membership.organizationId,
          `/organizations/${membership.organizationId}`,
          {
            organizationId: membership.organizationId,
            membershipId: token,
            declinedBy: membership.userId
          }
        );
      }

      // Update membership status to declined
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

/**
 * POST handler for invitation responses
 * Alternative method for processing invitations via request body instead of query params
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { action, userId } = body; // Extract action and userId from request body

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

    // Retrieve and validate membership record
    const membership = await getDocument('organizationMemberships', token) as OrganizationMembership;
    
    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    // Verify invitation ownership
    if (membership.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    // Ensure invitation is still pending
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

    // Handle invitation acceptance (same logic as GET method)
    if (action === 'accept') {
      // Activate membership
      await updateDocument('organizationMemberships', token, {
        status: 'active',
        joinedAt: serverTimestamp()
      });

      // Clean up invitation notification
      await NotificationService.removeInvitationNotification(membership.userId, token);

      // Notify inviter of acceptance
      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Accepted',
          `Your invitation to join ${organization.name} has been accepted.`,
          'organization_invite_accepted',
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
      // Handle invitation decline (same logic as GET method)
      await NotificationService.removeInvitationNotification(membership.userId, token);

      // Notify inviter of decline
      if (membership.invitedBy) {
        await NotificationService.createNotification(
          membership.invitedBy,
          'Invitation Declined',
          `Your invitation to join ${organization.name} has been declined.`,
          'organization_invite_declined',
          membership.organizationId,
          `/organizations/${membership.organizationId}`,
          {
            organizationId: membership.organizationId,
            membershipId: token,
            declinedBy: membership.userId
          }
        );
      }

      // Mark invitation as declined
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