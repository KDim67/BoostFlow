import { User } from 'firebase/auth';
import { createDocument, getDocument, updateDocument } from './firestoreService';
import { createLogger } from '../utils/logger';
import { PlatformRole } from './usePlatformAuth';

const USER_COLLECTION = 'users';

const logger = createLogger('UserProfileService');

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phoneNumber?: string;
  platformRole?: PlatformRole;
  settings?: UserSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  language?: string;
}

export const createUserProfile = async (
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<void> => {
  try {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      platformRole: 'user',
      ...additionalData
    };

    const cleanProfile = Object.fromEntries(
      Object.entries(userProfile).filter(([_, value]) => value !== undefined)
    ) as UserProfile;

    await createDocument(USER_COLLECTION, cleanProfile, user.uid);
    logger.info(`User profile created for user: ${user.uid}`);
  } catch (error) {
    logger.error('Error creating user profile', error as Error, { uid: user.uid });
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userProfile = await getDocument(USER_COLLECTION, uid);
    logger.debug(`User profile retrieved for user: ${uid}`);
    return userProfile as UserProfile | null;
  } catch (error) {
    logger.error('Error getting user profile', error as Error, { uid });
    throw error;
  }
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    await updateDocument(USER_COLLECTION, uid, data);
    logger.info(`User profile updated for user: ${uid}`);
  } catch (error) {
    logger.error('Error updating user profile', error as Error, { uid });
    throw error;
  }
};

export const syncUserProfile = async (
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<void> => {
  try {
    const existingProfile = await getUserProfile(user.uid);
    
    if (existingProfile) {
      const updates: Partial<UserProfile> = {
        email: user.email || existingProfile.email,
        displayName: user.displayName || existingProfile.displayName,
        photoURL: user.photoURL || existingProfile.photoURL || '',
        platformRole: existingProfile.platformRole || 'user',
        ...additionalData
      };
      
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ) as Partial<UserProfile>;
      
      await updateUserProfile(user.uid, cleanUpdates);
    } else {
      await createUserProfile(user, additionalData);
    }
  } catch (error) {
    logger.error('Error syncing user profile', error as Error, { uid: user.uid });
    throw error;
  }
};