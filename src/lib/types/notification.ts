import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  organizationId?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  hiddenFromDropdown?: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: any;
  actionUrl?: string;
  metadata?: {
    organizationId?: string;
    membershipId?: string;
    [key: string]: any;
  };
}

export type NotificationType = 
  | 'organization_invite'
  | 'team_invite'
  | 'team_invite_accepted'
  | 'team_invite_declined'
  | 'plan_upgrade'
  | 'plan_downgrade'
  | 'payment_success'
  | 'payment_failed'
  | 'member_joined'
  | 'member_left'
  | 'project_created'
  | 'project_updated'
  | 'system_announcement'
  | 'general';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    [key in NotificationType]: boolean;
  };
}