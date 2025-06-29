/**
 * Organization Service - Manages organization CRUD operations, memberships, and team invitations
 * Handles subscription plan features, permissions, and member management for the BoostFlow platform
 */

import { User } from 'firebase/auth';
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  deleteDocument,
  getAllDocuments
} from './firestoreService';
import {
  collection,
  doc,
  where,
  limit,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { createLogger } from '../utils/logger';
import { Organization, OrganizationMembership, OrganizationRole, SubscriptionPlan, OrganizationWithDetails } from '../types/organization';

// Firestore collection names
const ORGANIZATIONS_COLLECTION = 'organizations';
const MEMBERSHIPS_COLLECTION = 'organizationMemberships';
const PROJECTS_COLLECTION = 'projects';

const logger = createLogger('OrganizationService');

/**
 * Retrieves all organizations with enhanced metadata including member counts and storage usage
 * Used primarily for admin dashboard and analytics
 * @returns Promise<Organization[]> Array of organizations with additional computed fields
 */
export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const organizations = await getAllDocuments(ORGANIZATIONS_COLLECTION) as Organization[];
    
    // Enhance each organization with computed metadata
    const enhancedOrganizations = await Promise.all(organizations.map(async (org) => {
      // Count active members for this organization
      const memberCount = (await queryDocuments(MEMBERSHIPS_COLLECTION, [
        where('organizationId', '==', org.id),
        where('status', '==', 'active')
      ])).length;
      
      // Ensure plan features are available (fallback to default if missing)
      const planFeatures = org.planFeatures || getSubscriptionPlanFeatures(org.plan);
      
      // Generate mock storage usage (80% of max storage for demo purposes)
      const storageUsed = Math.floor(Math.random() * planFeatures.maxStorage * 0.8);
      
      return {
        ...org,
        memberCount,
        planFeatures,
        storageUsed
      };
    }));
    
    return enhancedOrganizations;
  } catch (error) {
    logger.error('Error getting all organizations', error as Error);
    throw error;
  }
};

/**
 * Creates a new organization and automatically assigns the creator as owner
 * Handles subscription plan setup and default configurations
 * @param user - Firebase authenticated user creating the organization
 * @param organizationData - Partial organization data from user input
 * @returns Promise<string> The newly created organization ID
 */
export const createOrganization = async (
  user: User,
  organizationData: Partial<Organization>
): Promise<string> => {
  try {
    // Default to free plan if not specified
    const plan = organizationData.plan || 'free';
    const defaultPlanFeatures = getSubscriptionPlanFeatures(plan);
    
    // Use custom team size from subscription or default from plan
    const maxMembers = organizationData.subscriptionDetails?.teamSize || defaultPlanFeatures.maxMembers;
    
    // Build organization data with defaults and user input
    const orgData: Partial<Organization> = {
      name: organizationData.name || 'My Organization',
      description: organizationData.description || '',
      logoUrl: organizationData.logoUrl,
      plan: plan,
      planFeatures: organizationData.planFeatures || {
        ...defaultPlanFeatures,
        maxMembers: maxMembers
      },
      subscriptionDetails: organizationData.subscriptionDetails,
      createdBy: user.uid
    };

    // Generate new document reference to get the ID before creation
    const collectionRef = collection(db, ORGANIZATIONS_COLLECTION);
    const newOrgRef = doc(collectionRef);
    const orgId = newOrgRef.id;
    
    // Create the organization document
    await createDocument(ORGANIZATIONS_COLLECTION, orgData, orgId);
    logger.info(`Organization created with ID: ${orgId}`);
    
    // Automatically create owner membership for the creator
    await createOrganizationMembership({
      organizationId: orgId,
      userId: user.uid,
      role: 'owner',
      status: 'active',
      invitedBy: user.uid,
      joinedAt: serverTimestamp()
    });
    
    return orgId;
  } catch (error) {
    logger.error('Error creating organization', error as Error);
    throw error;
  }
};

/**
 * Retrieves a single organization by its ID
 * @param organizationId - ID of the organization to retrieve
 * @returns Promise<Organization | null> The organization data or null if not found
 */
export const getOrganization = async (organizationId: string): Promise<Organization | null> => {
  try {
    const organization = await getDocument(ORGANIZATIONS_COLLECTION, organizationId);
    return organization as Organization | null;
  } catch (error) {
    logger.error('Error getting organization', error as Error, { organizationId });
    throw error;
  }
};

/**
 * Updates an existing organization with new data
 * @param organizationId - ID of the organization to update
 * @param data - Partial organization data to update
 */
export const updateOrganization = async (
  organizationId: string,
  data: Partial<Organization>
): Promise<void> => {
  try {
    await updateDocument(ORGANIZATIONS_COLLECTION, organizationId, data);
    logger.info(`Organization updated: ${organizationId}`);
  } catch (error) {
    logger.error('Error updating organization', error as Error, { organizationId });
    throw error;
  }
};

/**
 * Permanently deletes an organization and all associated data
 * Performs cascade deletion of memberships and cleans up related resources
 * @param organizationId - ID of the organization to delete
 */
export const deleteOrganization = async (organizationId: string): Promise<void> => {
  try {
    // Get organization data to check for logo before deletion
    const organization = await getOrganization(organizationId);
    
    // Delete organization document
    await deleteDocument(ORGANIZATIONS_COLLECTION, organizationId);
    
    // Delete all memberships
    const memberships = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('organizationId', '==', organizationId)
    ]);
    
    // Delete each membership individually
    for (const membership of memberships) {
      await deleteDocument(MEMBERSHIPS_COLLECTION, membership.id);
    }
    
    logger.info(`Organization deleted: ${organizationId}`);
  } catch (error) {
    logger.error('Error deleting organization', error as Error, { organizationId });
    throw error;
  }
};

/**
 * Creates a new organization membership record
 * Used for both direct memberships and invitations
 * @param membershipData - Partial membership data to create
 * @returns Promise<string> The newly created membership ID
 */
export const createOrganizationMembership = async (
  membershipData: Partial<OrganizationMembership>
): Promise<string> => {
  try {
    // Generate new document reference to get the ID before creation
    const collectionRef = collection(db, MEMBERSHIPS_COLLECTION);
    const newMembershipRef = doc(collectionRef);
    const membershipId = newMembershipRef.id;
    
    await createDocument(MEMBERSHIPS_COLLECTION, membershipData, membershipId);
    logger.info(`Organization membership created with ID: ${membershipId}`);
    
    return membershipId;
  } catch (error) {
    logger.error('Error creating organization membership', error as Error);
    throw error;
  }
};

/**
 * Retrieves all organizations where the user has active membership
 * Enriches organization data with member counts, project counts, and user's role
 * @param userId - ID of the user to get organizations for
 * @returns Promise<OrganizationWithDetails[]> Organizations with enhanced metadata
 */
export const getUserOrganizations = async (userId: string): Promise<OrganizationWithDetails[]> => {
  try {
    // Get all active memberships for the user
    const memberships = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('userId', '==', userId),
      where('status', '==', 'active')
    ]) as OrganizationMembership[];
    
    const organizationsWithDetails: OrganizationWithDetails[] = [];
    
    // For each membership, fetch organization details and compute metadata
    for (const membership of memberships) {
      const organization = await getOrganization(membership.organizationId);
      
      if (organization) {
        // Count active members in this organization
        const memberCount = (await queryDocuments(MEMBERSHIPS_COLLECTION, [
          where('organizationId', '==', organization.id),
          where('status', '==', 'active')
        ])).length;
        
        // Count projects belonging to this organization
        const projectCount = (await queryDocuments(PROJECTS_COLLECTION, [
          where('organizationId', '==', organization.id)
        ])).length;
        
        // Combine organization data with computed fields and user's role
        organizationsWithDetails.push({
          ...organization,
          memberCount,
          projectCount,
          userRole: membership.role
        });
      }
    }
    
    return organizationsWithDetails;
  } catch (error) {
    logger.error('Error getting user organizations', error as Error, { userId });
    throw error;
  }
};

/**
 * Checks if a user has sufficient permissions for an organization action
 * Uses role hierarchy: owner > admin > member > viewer
 * @param userId - ID of the user to check permissions for
 * @param organizationId - ID of the organization
 * @param requiredRole - Minimum role required for the action
 * @returns Promise<boolean> True if user has sufficient permissions
 */
export const hasOrganizationPermission = async (
  userId: string,
  organizationId: string,
  requiredRole: OrganizationRole
): Promise<boolean> => {
  try {
    // Find user's active membership in the organization
    const memberships = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('userId', '==', userId),
      where('organizationId', '==', organizationId),
      where('status', '==', 'active'),
      limit(1) // Only need one result
    ]) as OrganizationMembership[];
    
    // User is not a member of this organization
    if (memberships.length === 0) {
      return false;
    }
    
    const userRole = memberships[0].role;
    
    // Define role hierarchy with numeric values for comparison
    const roleHierarchy: Record<OrganizationRole, number> = {
      'owner': 4,
      'admin': 3,
      'member': 2,
      'viewer': 1
    };
    
    // Check if user's role level meets or exceeds required role level
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  } catch (error) {
    logger.error('Error checking organization permission', error as Error, { userId, organizationId });
    throw error;
  }
};

/**
 * Retrieves all members of an organization with their user profiles
 * Includes both active members and pending invitations, sorted by status and role
 * @param organizationId - ID of the organization to get members for
 * @returns Promise<OrganizationMembership[]> Memberships with attached user profiles
 */
export const getOrganizationMembers = async (organizationId: string): Promise<OrganizationMembership[]> => {
  try {
    // Get all memberships for the organization, ordered by status then role
    const memberships = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('organizationId', '==', organizationId),
      orderBy('status', 'asc'), // 'active' comes before 'invited'
      orderBy('role', 'asc')
    ]) as OrganizationMembership[];
    
    // Filter to only include active members and pending invitations
    const filteredMemberships = memberships.filter(m => m.status === 'active' || m.status === 'invited');
    
    // Dynamically import to avoid circular dependencies
    const { getUserProfile } = await import('./userProfileService');
    
    // Enrich each membership with user profile data
    const membershipsWithProfiles = await Promise.all(
      filteredMemberships.map(async (membership) => {
        try {
          const userProfile = await getUserProfile(membership.userId);
          return {
            ...membership,
            userProfile: userProfile || undefined
          };
        } catch (error) {
          // Log warning but don't fail the entire operation if one profile fails
          logger.warn(`Failed to fetch user profile for user ${membership.userId}`, error as Error);
          return {
            ...membership,
            userProfile: undefined
          };
        }
      })
    );
    
    return membershipsWithProfiles;
  } catch (error) {
    logger.error('Error getting organization members', error as Error, { organizationId });
    throw error;
  }
};

/**
 * Updates an existing organization membership
 * Commonly used to change roles or activate invitations
 * @param membershipId - ID of the membership to update
 * @param data - Partial membership data to update
 */
export const updateOrganizationMembership = async (
  membershipId: string,
  data: Partial<OrganizationMembership>
): Promise<void> => {
  try {
    await updateDocument(MEMBERSHIPS_COLLECTION, membershipId, data);
    logger.info(`Organization membership updated: ${membershipId}`);
  } catch (error) {
    logger.error('Error updating organization membership', error as Error, { membershipId });
    throw error;
  }
};

/**
 * Removes a member from an organization by deleting their membership
 * Used for both removing active members and declining invitations
 * @param membershipId - ID of the membership to remove
 */
export const removeOrganizationMember = async (membershipId: string): Promise<void> => {
  try {
    await deleteDocument(MEMBERSHIPS_COLLECTION, membershipId);
    logger.info(`Organization member removed: ${membershipId}`);
  } catch (error) {
    logger.error('Error removing organization member', error as Error, { membershipId });
    throw error;
  }
};

/**
 * Invites a user to join an organization with specified role
 * Validates membership limits, creates invitation, and sends notifications
 * @param organizationId - ID of the organization to invite to
 * @param inviterUserId - ID of the user sending the invitation
 * @param inviteeEmail - Email address of the user to invite
 * @param role - Role to assign to the invited user (defaults to 'member')
 * @returns Promise with success status, membershipId if successful, or error message
 */
export const inviteTeamMember = async (
  organizationId: string,
  inviterUserId: string,
  inviteeEmail: string,
  role: OrganizationRole = 'member'
): Promise<{ success: boolean; membershipId?: string; error?: string }> => {
  try {
    // Dynamic imports to avoid circular dependencies
    const { getUserByEmail } = await import('./userProfileService');
    const { NotificationService } = await import('./notificationService');
    
    // Verify the invitee exists in the system
    const inviteeUser = await getUserByEmail(inviteeEmail);
    if (!inviteeUser) {
      return { success: false, error: 'User with this email does not exist' };
    }
    
    // Check if user is already a member or has pending invitation
    const existingMembership = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('userId', '==', inviteeUser.uid),
      where('organizationId', '==', organizationId)
    ]) as OrganizationMembership[];
    
    if (existingMembership.length > 0) {
      return { success: false, error: 'User is already a member or has a pending invitation' };
    }
    
    // Verify organization exists
    const organization = await getOrganization(organizationId);
    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }
    
    // Check membership limits based on subscription plan
    const currentMembers = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('organizationId', '==', organizationId),
      where('status', 'in', ['active', 'invited']) // Count both active and pending
    ]);
    
    const planFeatures = organization.planFeatures || getSubscriptionPlanFeatures(organization.plan);
    const maxMembers = organization.subscriptionDetails?.teamSize || planFeatures.maxMembers;
    
    if (currentMembers.length >= maxMembers) {
      return { success: false, error: `Cannot invite more members. Your ${organization.plan} plan allows up to ${maxMembers} members.` };
    }
    
    // Create the invitation membership record
    const membershipData: Partial<OrganizationMembership> = {
      organizationId,
      userId: inviteeUser.uid,
      role,
      invitedBy: inviterUserId,
      status: 'invited',
      joinedAt: serverTimestamp()
    };
    
    const membershipId = await createOrganizationMembership(membershipData);
    
    // Create in-app notification for the invitee
    await NotificationService.createNotification(
      inviteeUser.uid,
      'Team Invitation',
      `You've been invited to join ${organization.name} as a ${role}`,
      'organization_invite',
      organizationId,
      `/invitation/${membershipId}`,
      {
        organizationId,
        membershipId,
        organizationName: organization.name,
        inviterUserId,
        role
      }
    );
    
    // Send email notification
    try {
      const { emailService } = await import('../services/emailService');
      const { getUserProfile } = await import('./userProfileService');
      
      // Get inviter's name for personalized email
      const inviterProfile = await getUserProfile(inviterUserId);
      const inviterName = inviterProfile?.displayName || inviterProfile?.email || 'Someone';
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitation/${membershipId}`;
      
      logger.info(`Preparing to send invitation email to ${inviteeEmail}`, {
        inviterName,
        organizationName: organization.name,
        inviteUrl,
        emailProvider: process.env.EMAIL_PROVIDER
      });
      
      const emailResult = await emailService.sendInvitationEmail({
        to: inviteeEmail,
        inviterName,
        organizationName: organization.name,
        inviteUrl,
      });
      
      if (emailResult.success) {
        logger.info(`Email invitation sent successfully to ${inviteeEmail}`, { messageId: emailResult.messageId });
      } else {
        logger.error(`Failed to send invitation email to ${inviteeEmail}: ${emailResult.error}`);
      }
    } catch (emailError) {
      logger.error('Failed to send invitation email', emailError as Error, {
        inviteeEmail,
        organizationId,
        membershipId
      });
      // Don't throw here - the invitation was created successfully
    }
    
    logger.info(`Team invitation sent to ${inviteeEmail} for organization ${organizationId}`);
    return { success: true, membershipId };
  } catch (error) {
    logger.error('Error inviting team member', error as Error, { organizationId, inviteeEmail });
    return { success: false, error: (error as Error).message || 'Failed to send invitation' };
  }
};

/**
 * Accepts a team invitation and activates the membership
 * Validates membership limits before activation and notifies the inviter
 * @param membershipId - ID of the membership invitation to accept
 * @returns Promise with success status or error message
 */
export const acceptTeamInvitation = async (membershipId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Retrieve the invitation membership record
    const membership = await getDocument(MEMBERSHIPS_COLLECTION, membershipId) as OrganizationMembership;
    if (!membership) {
      return { success: false, error: 'Membership not found' };
    }

    // Verify the organization still exists
    const organization = await getOrganization(membership.organizationId);
    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }
    
    // Check if organization has reached its active member limit
    const currentActiveMembers = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('organizationId', '==', membership.organizationId),
      where('status', '==', 'active')
    ]);
    
    const planFeatures = organization.planFeatures || getSubscriptionPlanFeatures(organization.plan);
    const maxMembers = organization.subscriptionDetails?.teamSize || planFeatures.maxMembers;
    
    if (currentActiveMembers.length >= maxMembers) {
      return { success: false, error: `Cannot accept invitation. The organization has reached its member limit of ${maxMembers} for the ${organization.plan} plan.` };
    }

    // Activate the membership
    await updateOrganizationMembership(membershipId, {
      status: 'active',
      joinedAt: serverTimestamp()
    });
    
    // Notify the inviter that their invitation was accepted
    if (membership.invitedBy) {
      const { NotificationService } = await import('./notificationService');
      await NotificationService.createNotification(
        membership.invitedBy,
        'Invitation Accepted',
        `Your invitation to join ${organization.name} has been accepted.`,
        'organization_invite_accepted',
        membership.organizationId,
        `/organizations/${membership.organizationId}`,
        {
          organizationId: membership.organizationId,
          membershipId: membershipId,
          acceptedBy: membership.userId
        }
      );
    }
    
    logger.info(`Team invitation accepted: ${membershipId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error accepting team invitation', error as Error, { membershipId });
    return { success: false, error: (error as Error).message || 'Failed to accept invitation' };
  }
};

/**
 * Declines a team invitation and removes the membership record
 * Notifies the inviter that their invitation was declined
 * @param membershipId - ID of the membership invitation to decline
 */
export const declineTeamInvitation = async (membershipId: string): Promise<void> => {
  try {
    // Retrieve the invitation membership record
    const membership = await getDocument(MEMBERSHIPS_COLLECTION, membershipId) as OrganizationMembership;
    if (!membership) {
      throw new Error('Membership not found');
    }

    // Verify the organization exists for notification purposes
    const organization = await getOrganization(membership.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Notify the inviter that their invitation was declined
    if (membership.invitedBy) {
      const { NotificationService } = await import('./notificationService');
      await NotificationService.createNotification(
        membership.invitedBy,
        'Invitation Declined',
        `Your invitation to join ${organization.name} has been declined.`,
        'organization_invite_declined',
        membership.organizationId,
        `/organizations/${membership.organizationId}`,
        {
          organizationId: membership.organizationId,
          membershipId: membershipId,
          declinedBy: membership.userId
        }
      );
    }

    // Remove the invitation membership record
    await removeOrganizationMember(membershipId);
    logger.info(`Team invitation declined: ${membershipId}`);
  } catch (error) {
    logger.error('Error declining team invitation', error as Error, { membershipId });
    throw error;
  }
};

/**
 * Returns the feature limits for each subscription plan
 * Used to enforce member and storage limits across the application
 * @param plan - The subscription plan to get features for
 * @returns Object containing maxMembers and maxStorage limits
 */
export const getSubscriptionPlanFeatures = (plan: SubscriptionPlan) => {
  const planFeatures = {
    free: {
      maxMembers: 15,
      maxStorage: 5 // GB
    },
    starter: {
      maxMembers: Infinity, // No member limit for paid plans
      maxStorage: 250 // GB
    },
    professional: {
      maxMembers: Infinity,
      maxStorage: Infinity // Unlimited storage
    },
    enterprise: {
      maxMembers: Infinity,
      maxStorage: Infinity // Unlimited everything
    }
  };
  
  return planFeatures[plan];
};