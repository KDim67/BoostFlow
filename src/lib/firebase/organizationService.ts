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

const ORGANIZATIONS_COLLECTION = 'organizations';
const MEMBERSHIPS_COLLECTION = 'organizationMemberships';
const PROJECTS_COLLECTION = 'projects';

const logger = createLogger('OrganizationService');

export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const organizations = await getAllDocuments(ORGANIZATIONS_COLLECTION) as Organization[];
    
    const enhancedOrganizations = await Promise.all(organizations.map(async (org) => {
      const memberCount = (await queryDocuments(MEMBERSHIPS_COLLECTION, [
        where('organizationId', '==', org.id),
        where('status', '==', 'active')
      ])).length;
      
      const planFeatures = org.planFeatures || getSubscriptionPlanFeatures(org.plan);
      
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

export const createOrganization = async (
  user: User,
  organizationData: Partial<Organization>
): Promise<string> => {
  try {
    const plan = organizationData.plan || 'free';
    const defaultPlanFeatures = getSubscriptionPlanFeatures(plan);
    
    const maxMembers = organizationData.subscriptionDetails?.teamSize || defaultPlanFeatures.maxMembers;
    
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

    const collectionRef = collection(db, ORGANIZATIONS_COLLECTION);
    const newOrgRef = doc(collectionRef);
    const orgId = newOrgRef.id;
    
    await createDocument(ORGANIZATIONS_COLLECTION, orgData, orgId);
    logger.info(`Organization created with ID: ${orgId}`);
    
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

export const getOrganization = async (organizationId: string): Promise<Organization | null> => {
  try {
    const organization = await getDocument(ORGANIZATIONS_COLLECTION, organizationId);
    return organization as Organization | null;
  } catch (error) {
    logger.error('Error getting organization', error as Error, { organizationId });
    throw error;
  }
};

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
    
    for (const membership of memberships) {
      await deleteDocument(MEMBERSHIPS_COLLECTION, membership.id);
    }
    
    logger.info(`Organization deleted: ${organizationId}`);
  } catch (error) {
    logger.error('Error deleting organization', error as Error, { organizationId });
    throw error;
  }
};

export const createOrganizationMembership = async (
  membershipData: Partial<OrganizationMembership>
): Promise<string> => {
  try {
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

export const getUserOrganizations = async (userId: string): Promise<OrganizationWithDetails[]> => {
  try {
    const memberships = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('userId', '==', userId),
      where('status', '==', 'active')
    ]) as OrganizationMembership[];
    
    const organizationsWithDetails: OrganizationWithDetails[] = [];
    
    for (const membership of memberships) {
      const organization = await getOrganization(membership.organizationId);
      
      if (organization) {
        const memberCount = (await queryDocuments(MEMBERSHIPS_COLLECTION, [
          where('organizationId', '==', organization.id),
          where('status', '==', 'active')
        ])).length;
        
        const projectCount = (await queryDocuments(PROJECTS_COLLECTION, [
          where('organizationId', '==', organization.id)
        ])).length;
        
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

export const hasOrganizationPermission = async (
  userId: string,
  organizationId: string,
  requiredRole: OrganizationRole
): Promise<boolean> => {
  try {
    const memberships = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('userId', '==', userId),
      where('organizationId', '==', organizationId),
      where('status', '==', 'active'),
      limit(1)
    ]) as OrganizationMembership[];
    
    if (memberships.length === 0) {
      return false;
    }
    
    const userRole = memberships[0].role;
    
    const roleHierarchy: Record<OrganizationRole, number> = {
      'owner': 4,
      'admin': 3,
      'member': 2,
      'viewer': 1
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  } catch (error) {
    logger.error('Error checking organization permission', error as Error, { userId, organizationId });
    throw error;
  }
};

export const getOrganizationMembers = async (organizationId: string): Promise<OrganizationMembership[]> => {
  try {
    const memberships = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('organizationId', '==', organizationId),
      orderBy('status', 'asc'),
      orderBy('role', 'asc')
    ]) as OrganizationMembership[];
    
    const filteredMemberships = memberships.filter(m => m.status === 'active' || m.status === 'invited');
    
    const { getUserProfile } = await import('./userProfileService');
    
    const membershipsWithProfiles = await Promise.all(
      filteredMemberships.map(async (membership) => {
        try {
          const userProfile = await getUserProfile(membership.userId);
          return {
            ...membership,
            userProfile: userProfile || undefined
          };
        } catch (error) {
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

export const removeOrganizationMember = async (membershipId: string): Promise<void> => {
  try {
    await deleteDocument(MEMBERSHIPS_COLLECTION, membershipId);
    logger.info(`Organization member removed: ${membershipId}`);
  } catch (error) {
    logger.error('Error removing organization member', error as Error, { membershipId });
    throw error;
  }
};

export const inviteTeamMember = async (
  organizationId: string,
  inviterUserId: string,
  inviteeEmail: string,
  role: OrganizationRole = 'member'
): Promise<{ success: boolean; membershipId?: string; error?: string }> => {
  try {
    const { getUserByEmail } = await import('./userProfileService');
    const { NotificationService } = await import('./notificationService');
    
    const inviteeUser = await getUserByEmail(inviteeEmail);
    if (!inviteeUser) {
      return { success: false, error: 'User with this email does not exist' };
    }
    
    const existingMembership = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('userId', '==', inviteeUser.uid),
      where('organizationId', '==', organizationId)
    ]) as OrganizationMembership[];
    
    if (existingMembership.length > 0) {
      return { success: false, error: 'User is already a member or has a pending invitation' };
    }
    
    const organization = await getOrganization(organizationId);
    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }
    
    const currentMembers = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('organizationId', '==', organizationId),
      where('status', 'in', ['active', 'invited'])
    ]);
    
    const planFeatures = organization.planFeatures || getSubscriptionPlanFeatures(organization.plan);
    const maxMembers = organization.subscriptionDetails?.teamSize || planFeatures.maxMembers;
    
    if (currentMembers.length >= maxMembers) {
      return { success: false, error: `Cannot invite more members. Your ${organization.plan} plan allows up to ${maxMembers} members.` };
    }
    
    const membershipData: Partial<OrganizationMembership> = {
      organizationId,
      userId: inviteeUser.uid,
      role,
      invitedBy: inviterUserId,
      status: 'invited',
      joinedAt: serverTimestamp()
    };
    
    const membershipId = await createOrganizationMembership(membershipData);
    
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

export const acceptTeamInvitation = async (membershipId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const membership = await getDocument(MEMBERSHIPS_COLLECTION, membershipId) as OrganizationMembership;
    if (!membership) {
      return { success: false, error: 'Membership not found' };
    }

    const organization = await getOrganization(membership.organizationId);
    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }
    
    const currentActiveMembers = await queryDocuments(MEMBERSHIPS_COLLECTION, [
      where('organizationId', '==', membership.organizationId),
      where('status', '==', 'active')
    ]);
    
    const planFeatures = organization.planFeatures || getSubscriptionPlanFeatures(organization.plan);
    const maxMembers = organization.subscriptionDetails?.teamSize || planFeatures.maxMembers;
    
    if (currentActiveMembers.length >= maxMembers) {
      return { success: false, error: `Cannot accept invitation. The organization has reached its member limit of ${maxMembers} for the ${organization.plan} plan.` };
    }

    await updateOrganizationMembership(membershipId, {
      status: 'active',
      joinedAt: serverTimestamp()
    });
    
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

export const declineTeamInvitation = async (membershipId: string): Promise<void> => {
  try {
    const membership = await getDocument(MEMBERSHIPS_COLLECTION, membershipId) as OrganizationMembership;
    if (!membership) {
      throw new Error('Membership not found');
    }

    const organization = await getOrganization(membership.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

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

    await removeOrganizationMember(membershipId);
    logger.info(`Team invitation declined: ${membershipId}`);
  } catch (error) {
    logger.error('Error declining team invitation', error as Error, { membershipId });
    throw error;
  }
};

export const getSubscriptionPlanFeatures = (plan: SubscriptionPlan) => {
  const planFeatures = {
    free: {
      maxMembers: 15,
      maxStorage: 5 // GB
    },
    starter: {
      maxMembers: Infinity,
      maxStorage: 250 // GB
    },
    professional: {
      maxMembers: Infinity,
      maxStorage: Infinity
    },
    enterprise: {
      maxMembers: Infinity,
      maxStorage: Infinity
    }
  };
  
  return planFeatures[plan];
};