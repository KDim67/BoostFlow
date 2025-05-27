import { admin, adminFirestore } from '@/lib/firebase/adminConfig';
import { User } from 'firebase/auth';
import { PlatformRole } from '@/lib/firebase/usePlatformAuth';

export interface PlatformUser {
  uid: string;
  email: string;
  displayName?: string;
  platformRole: PlatformRole;
  organizationId?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive?: Date;
  createdAt: Date;
  securityLogs?: SecurityLogEntry[];
}

export interface Organization {
  id: string;
  name: string;
  plan: 'standard' | 'professional' | 'enterprise';
  userCount: number;
  status: 'active' | 'trial' | 'suspended';
  createdAt: Date;
  storageUsed: number;
  storageLimit: number;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  allowedDomains?: string[];
  securityPolicies?: SecurityPolicy[];
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface SecurityLogEntry {
  timestamp: Date;
  action: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface SystemHealthMetrics {
  apiResponseTime: number;
  databasePerformance: number;
  storageUtilization: number;
  activeUsers: number;
  errorRate: number;
  lastUpdated: Date;
}

export const getAllUsers = async (): Promise<PlatformUser[]> => {
  try {
    const usersRef = adminFirestore.collection('users');
    const snapshot = await usersRef.get();
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as PlatformUser));
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

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

export const updateUserRole = async (uid: string, newRole: PlatformRole): Promise<void> => {
  try {
    const userRef = adminFirestore.collection('users').doc(uid);
    await userRef.update({
      platformRole: newRole,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(`Error updating user ${uid} role:`, error);
    throw error;
  }
};

export const suspendUser = async (uid: string, reason: string): Promise<void> => {
  try {
    const userRef = adminFirestore.collection('users').doc(uid);
    await userRef.update({
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: new Date(),
    });
    

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

export const addSecurityLog = async (uid: string, logEntry: SecurityLogEntry): Promise<void> => {
  try {
    const userRef = adminFirestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const securityLogs = userData?.securityLogs || [];
      
      await userRef.update({
        securityLogs: [...securityLogs, logEntry],
      });
    }
  } catch (error) {
    console.error(`Error adding security log for user ${uid}:`, error);
    throw error;
  }
};


export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const orgsRef = adminFirestore.collection('organizations');
    const snapshot = await orgsRef.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Organization));
  } catch (error) {
    console.error('Error fetching all organizations:', error);
    throw error;
  }
};

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
    
    return null;
  } catch (error) {
    console.error(`Error fetching organization ${orgId}:`, error);
    throw error;
  }
};

export const updateOrganizationStatus = async (orgId: string, status: 'active' | 'trial' | 'suspended'): Promise<void> => {
  try {
    const orgRef = adminFirestore.collection('organizations').doc(orgId);
    await orgRef.update({
      status,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(`Error updating organization ${orgId} status:`, error);
    throw error;
  }
};

export const updateOrganizationPlan = async (orgId: string, plan: 'standard' | 'professional' | 'enterprise'): Promise<void> => {
  try {
    const orgRef = adminFirestore.collection('organizations').doc(orgId);
    await orgRef.update({
      plan,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(`Error updating organization ${orgId} plan:`, error);
    throw error;
  }
};

export const getSystemHealthMetrics = async (): Promise<SystemHealthMetrics> => {
  try {
    const metricsRef = adminFirestore.collection('system').doc('health_metrics');
    const metricsDoc = await metricsRef.get();
    
    if (metricsDoc.exists) {
      return metricsDoc.data() as SystemHealthMetrics;
    }
    
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

export const updateSystemHealthMetrics = async (metrics: Partial<SystemHealthMetrics>): Promise<void> => {
  try {
    const metricsRef = adminFirestore.collection('system').doc('health_metrics');
    const metricsDoc = await metricsRef.get();
    
    if (metricsDoc.exists) {
      await metricsRef.update({
        ...metrics,
        lastUpdated: new Date(),
      });
    } else {
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

export const getContentModerationQueue = async () => {
  try {
    const moderationRef = adminFirestore.collection('content_moderation');
    const snapshot = await moderationRef.where('status', '==', 'pending_review').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching content moderation queue:', error);
    throw error;
  }
};

export const approveContent = async (contentId: string, moderatorId: string): Promise<void> => {
  try {
    const contentRef = adminFirestore.collection('content_moderation').doc(contentId);
    await contentRef.update({
      status: 'approved',
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
    });
  } catch (error) {
    console.error(`Error approving content ${contentId}:`, error);
    throw error;
  }
};

export const rejectContent = async (contentId: string, moderatorId: string, reason: string): Promise<void> => {
  try {
    const contentRef = adminFirestore.collection('content_moderation').doc(contentId);
    await contentRef.update({
      status: 'rejected',
      moderatedBy: moderatorId,
      moderatedAt: new Date(),
      rejectionReason: reason,
    });
  } catch (error) {
    console.error(`Error rejecting content ${contentId}:`, error);
    throw error;
  }
};