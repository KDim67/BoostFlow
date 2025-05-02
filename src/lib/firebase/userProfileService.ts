/**
 * User Profile Service
 * 
 * This file provides functionality for managing user profiles in Firestore.
 * It includes methods for creating, updating, and retrieving user profile data.
 */

import { User } from 'firebase/auth';
import { createDocument, getDocument, updateDocument } from './firestoreService';
import { createLogger } from '../utils/logger';

// Collection path for user profiles
const USER_COLLECTION = 'users';

const logger = createLogger('UserProfileService');

// User profile interface
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
  settings?: UserSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

// User settings interface
export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  language?: string;
}

/**
 * Create a new user profile in Firestore
 * @param user Firebase Auth user object
 * @param additionalData Additional profile data
 * @returns Promise that resolves when the profile is created
 */
export const createUserProfile = async (
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<void> => {
  try {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      ...additionalData
    };

    await createDocument(USER_COLLECTION, userProfile, user.uid);
    logger.info(`User profile created for user: ${user.uid}`);
  } catch (error) {
    logger.error('Error creating user profile', error as Error, { uid: user.uid });
    throw error;
  }
};

/**
 * Get a user profile by user ID
 * @param uid User ID
 * @returns Promise resolving to user profile or null if not found
 */
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

/**
 * Update a user profile
 * @param uid User ID
 * @param data Updated profile data
 * @returns Promise that resolves when the profile is updated
 */
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

/**
 * Create or update a user profile based on the Firebase Auth user
 * This is useful after a user signs in or registers
 * @param user Firebase Auth user object
 * @param additionalData Additional profile data
 * @returns Promise that resolves when the profile is created or updated
 */
export const syncUserProfile = async (
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<void> => {
  try {
    // Check if profile exists
    const existingProfile = await getUserProfile(user.uid);
    
    if (existingProfile) {
      // Update existing profile
      const updates: Partial<UserProfile> = {
        email: user.email || existingProfile.email,
        displayName: user.displayName || existingProfile.displayName,
        photoURL: user.photoURL || existingProfile.photoURL,
        ...additionalData
      };
      
      await updateUserProfile(user.uid, updates);
    } else {
      // Create new profile
      await createUserProfile(user, additionalData);
    }
  } catch (error) {
    logger.error('Error syncing user profile', error as Error, { uid: user.uid });
    throw error;
  }
};