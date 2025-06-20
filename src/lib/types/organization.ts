import { UserProfile } from '../firebase/userProfileService';

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  plan: SubscriptionPlan;
  memberCount?: number;
  allowPublicProjects?: boolean;
  requireMfa?: boolean;
  sessionTimeout?: number;
  dataRetentionDays?: number;
  suspended?: boolean;
  onTrial?: boolean;
  storageUsed?: number;
  notificationSettings?: {
    email: boolean;
    teams: boolean;
  };
  planFeatures?: {
    maxMembers: number;
    maxStorage: number;
  };
  subscriptionDetails?: {
    teamSize: number;
    billingCycle: string;
    pricePerUser: number;
    totalPrice: number;
    subscribedAt: string;
    discount: number;
  };
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: any;
  invitedBy?: string;
  status: 'active' | 'invited' | 'suspended';
  userProfile?: UserProfile;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  progress: number;
  status: string;
  startDate?: string;
  dueDate: string;
  createdBy: string;
  createdAt: any;
  members?: string[];
  client?: string;
  budget?: string;
  previousMetrics?: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    productivityScore: number;
  };
}


export interface OrganizationWithDetails extends Organization {
  memberCount: number;
  projectCount: number;
  userRole: OrganizationRole;
}
