import { admin, adminFirestore } from '@/lib/firebase/adminConfig';
import { User } from 'firebase/auth';
import { PlatformRole } from '@/lib/firebase/usePlatformAuth';

/**
 * Platform Administration Service
 * 
 * This service provides administrative functions for managing users, organizations,
 * system health metrics, and content moderation across the BoostFlow platform.
 * All functions use Firebase Admin SDK for elevated permissions.
 */

/**
 * Represents a platform user with administrative metadata
 * Extends basic user information with platform-specific fields
 */
export interface PlatformUser {
  uid: string; // Firebase user ID
  email: string;
  displayName?: string;
  platformRole: PlatformRole; // Platform-wide role (admin, user, etc.)
  organizationId?: string; // Associated organization if applicable
  status: 'active' | 'inactive' | 'suspended'; // Account status
  lastActive?: Date; // Last login/activity timestamp
  createdAt: Date;
  securityLogs?: SecurityLogEntry[]; // Audit trail for security events
}

/**
 * Organization entity with subscription and resource management data
 */
export interface Organization {
  id: string;
  name: string;
  plan: 'standard' | 'professional' | 'enterprise'; // Subscription tier
  userCount: number; // Current number of users in organization
  status: 'active' | 'trial' | 'suspended'; // Organization status
  createdAt: Date;
  storageUsed: number; // Current storage usage in bytes
  storageLimit: number; // Maximum allowed storage in bytes
  settings: OrganizationSettings; // Custom configuration
}

/**
 * Configurable settings for organization customization and security
 */
export interface OrganizationSettings {
  allowedDomains?: string[]; // Email domains allowed for auto-join
  securityPolicies?: SecurityPolicy[]; // Applied security rules
  customBranding?: {
    logo?: string; // URL to organization logo
    primaryColor?: string; // Hex color for primary branding
    secondaryColor?: string; // Hex color for secondary branding
  };
}

/**
 * Security policy configuration for organizations
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean; // Whether policy is currently active
  settings: Record<string, any>; // Policy-specific configuration parameters
}

/**
 * Security audit log entry for tracking user actions
 */
export interface SecurityLogEntry {
  timestamp: Date;
  action: string; // Type of action performed (login, role_change, etc.)
  ip?: string; // IP address of the request
  userAgent?: string; // Browser/client information
  details?: Record<string, any>; // Additional context-specific data
}

/**
 * System-wide health and performance metrics
 */
export interface SystemHealthMetrics {
  apiResponseTime: number; // Average API response time in milliseconds
  databasePerformance: number; // Database query performance score (0-100)
  storageUtilization: number; // Storage usage percentage (0-100)
  activeUsers: number; // Currently active user count
  errorRate: number; // Error rate percentage (0-100)
  lastUpdated: Date; // When metrics were last calculated
}

/**
 * Retrieves all platform users for administrative overview
 * @returns Promise resolving to array of all platform users
 * @throws Error if database query fails
 */
export const getAllUsers = async (): Promise<PlatformUser[]> => {
  try {
    const usersRef = adminFirestore.collection('users');
    const snapshot = await usersRef.get();
    
    // Map Firestore documents to PlatformUser objects
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as PlatformUser));
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Retrieves users filtered by their platform role
 * @param role - The platform role to filter by
 * @returns Promise resolving to array of users with specified role
 * @throws Error if database query fails
 */
export const getUsersByRole = async (role: PlatformRole): Promise<PlatformUser[]> => {
  try {
    const usersRef = adminFirestore.collection('users');
    const snapshot = await usersRef.where('platformRole', '==', role).get();
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as PlatformUser));
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    throw error;
  }
};

/**
 * Updates a user's platform role with audit trail
 * @param uid - User ID to update
 * @param newRole - New platform role to assign
 * @throws Error if user doesn't exist or update fails
 */
export const updateUserRole = async (uid: string, newRole: PlatformRole): Promise<void> => {
  try {
    const userRef = adminFirestore.collection('users').doc(uid);
    await userRef.update({
      platformRole: newRole,
      updatedAt: new Date(), // Track when role was changed
    });
  } catch (error) {
    console.error(`Error updating user ${uid} role:`, error);
    throw error;
  }
};

/**
 * Suspends a user account and logs the action for audit purposes
 * @param uid - User ID to suspend
 * @param reason - Reason for suspension (for audit trail)
 * @throws Error if user doesn't exist or suspension fails
 */
export const suspendUser = async (uid: string, reason: string): Promise<void> => {
  try {
    const userRef = adminFirestore.collection('users').doc(uid);
    await userRef.update({
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: new Date(),
    });
    
    // Create security log entry for suspension action
    await addSecurityLog(uid, {
      timestamp: new Date(),
      action: 'user_suspended',
      details: { reason },
    });
  } catch (error) {
    console.error(`Error suspending user ${uid}:`, error);
    throw error;
  }
};

/**
 * Adds a security log entry to a user's audit trail
 * @param uid - User ID to add log entry for
 * @param logEntry - Security log entry to append
 * @throws Error if user doesn't exist or log update fails
 */
export const addSecurityLog = async (uid: string, logEntry: SecurityLogEntry): Promise<void> => {
  try {
    const userRef = adminFirestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const securityLogs = userData?.securityLogs || []; // Initialize empty array if no logs exist
      
      // Append new log entry to existing logs
      await userRef.update({
        securityLogs: [...securityLogs, logEntry],
      });
    }
  } catch (error) {
    console.error(`Error adding security log for user ${uid}:`, error);
    throw error;
  }
};


/**
 * Retrieves all organizations for administrative management
 * @returns Promise resolving to array of all organizations
 * @throws Error if database query fails
 */
export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const orgsRef = adminFirestore.collection('organizations');
    const snapshot = await orgsRef.get();
    
    // Map Firestore documents to Organization objects
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Organization));
  } catch (error) {
    console.error('Error fetching all organizations:', error);
    throw error;
  }
};

/**
 * Retrieves a specific organization by ID
 * @param orgId - Organization ID to fetch
 * @returns Promise resolving to Organization object or null if not found
 * @throws Error if database query fails
 */
export const getOrganizationById = async (orgId: string): Promise<Organization | null> => {
  try {
    const orgRef = adminFirestore.collection('organizations').doc(orgId);
    const orgDoc = await orgRef.get();
    
    if (orgDoc.exists) {
      return {
        id: orgDoc.id,
        ...orgDoc.data(),
      } as Organization;
    }
    
    return null; // Organization not found
  } catch (error) {
    console.error(`Error fetching organization ${orgId}:`, error);
    throw error;
  }
};

/**
 * Updates an organization's status (active, trial, suspended)
 * @param orgId - Organization ID to update
 * @param status - New status to set
 * @throws Error if organization doesn't exist or update fails
 */
export const updateOrganizationStatus = async (orgId: string, status: 'active' | 'trial' | 'suspended'): Promise<void> => {
  try {
    const orgRef = adminFirestore.collection('organizations').doc(orgId);
    await orgRef.update({
      status,
      updatedAt: new Date(), // Track when status was changed
    });
  } catch (error) {
    console.error(`Error updating organization ${orgId} status:`, error);
    throw error;
  }
};

/**
 * Updates an organization's subscription plan
 * @param orgId - Organization ID to update
 * @param plan - New subscription plan (standard, professional, enterprise)
 * @throws Error if organization doesn't exist or update fails
 */
export const updateOrganizationPlan = async (orgId: string, plan: 'standard' | 'professional' | 'enterprise'): Promise<void> => {
  try {
    const orgRef = adminFirestore.collection('organizations').doc(orgId);
    await orgRef.update({
      plan,
      updatedAt: new Date(), // Track when plan was changed
    });
  } catch (error) {
    console.error(`Error updating organization ${orgId} plan:`, error);
    throw error;
  }
};

/**
 * Retrieves current system health metrics for monitoring dashboard
 * @returns Promise resolving to SystemHealthMetrics object
 * @throws Error if database query fails
 */
export const getSystemHealthMetrics = async (): Promise<SystemHealthMetrics> => {
  try {
    const metricsRef = adminFirestore.collection('system').doc('health_metrics');
    const metricsDoc = await metricsRef.get();
    
    if (metricsDoc.exists) {
      return metricsDoc.data() as SystemHealthMetrics;
    }
    
    // Return default metrics if document doesn't exist
    return {
      apiResponseTime: 0,
      databasePerformance: 0,
      storageUtilization: 0,
      activeUsers: 0,
      errorRate: 0,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error fetching system health metrics:', error);
    throw error;
  }
};

/**
 * Updates system health metrics with new values
 * Creates document if it doesn't exist, otherwise updates existing metrics
 * @param metrics - Partial metrics object with values to update
 * @throws Error if database operation fails
 */
export const updateSystemHealthMetrics = async (metrics: Partial<SystemHealthMetrics>): Promise<void> => {
  try {
    const metricsRef = adminFirestore.collection('system').doc('health_metrics');
    const metricsDoc = await metricsRef.get();
    
    if (metricsDoc.exists) {
      // Update existing metrics document
      await metricsRef.update({
        ...metrics,
        lastUpdated: new Date(),
      });
    } else {
      // Create new metrics document with default values
      await metricsRef.set({
        apiResponseTime: metrics.apiResponseTime || 0,
        databasePerformance: metrics.databasePerformance || 0,
        storageUtilization: metrics.storageUtilization || 0,
        activeUsers: metrics.activeUsers || 0,
        errorRate: metrics.errorRate || 0,
        lastUpdated: new Date(),
      });
    }
  } catch (error) {
    console.error('Error updating system health metrics:', error);
    throw error;
  }
};

/**
 * Retrieves content items pending moderation review
 * @returns Promise resolving to array of content items awaiting review
 * @throws Error if database query fails
 */
export const getContentModerationQueue = async () => {
  try {
    const moderationRef = adminFirestore.collection('content_moderation');
    const snapshot = await moderationRef.where('status', '==', 'pending_review').get();
    
    // Map Firestore documents to content moderation objects
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching content moderation queue:', error);
    throw error;
  }
};

/**
 * Approves content item and records moderation action
 * @param contentId - ID of content item to approve
 * @param moderatorId - ID of moderator performing the action
 * @throws Error if content doesn't exist or update fails
 */
export const approveContent = async (contentId: string, moderatorId: string): Promise<void> => {
  try {
    const contentRef = adminFirestore.collection('content_moderation').doc(contentId);
    await contentRef.update({
      status: 'approved',
      moderatedBy: moderatorId, // Track who approved the content
      moderatedAt: new Date(), // Track when approval occurred
    });
  } catch (error) {
    console.error(`Error approving content ${contentId}:`, error);
    throw error;
  }
};

/**
 * Rejects content item with reason and records moderation action
 * @param contentId - ID of content item to reject
 * @param moderatorId - ID of moderator performing the action
 * @param reason - Reason for rejection (for audit and user feedback)
 * @throws Error if content doesn't exist or update fails
 */
export const rejectContent = async (contentId: string, moderatorId: string, reason: string): Promise<void> => {
  try {
    const contentRef = adminFirestore.collection('content_moderation').doc(contentId);
    await contentRef.update({
      status: 'rejected',
      moderatedBy: moderatorId, // Track who rejected the content
      moderatedAt: new Date(), // Track when rejection occurred
      rejectionReason: reason, // Store reason for audit and user notification
    });
  } catch (error) {
    console.error(`Error rejecting content ${contentId}:`, error);
    throw error;
  }
};