import { User } from 'firebase/auth';
import { createDocument, getDocument, updateDocument, getAllDocuments, deleteDocument } from './firestoreService';
import { createLogger } from '../utils/logger';
import { PlatformRole } from './usePlatformAuth';

const USER_COLLECTION = 'users';

const logger = createLogger('UserProfileService');

/**
 * Complete user profile data structure stored in Firestore
 * Extends Firebase Auth user data with additional application-specific fields
 */
export interface UserProfile {
  uid: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  phoneNumber?: string;
  platformRole?: PlatformRole;
  settings?: UserSettings;
  createdAt?: Date;
  updatedAt?: Date;
  suspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: Date;
}

/**
 * User preferences and application settings
 */
export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean; // Email notification preference
    website?: boolean; // In-app notification preference
  };
  language?: string; // Preferred language code (e.g., 'en', 'es')
}

/**
 * Creates a new user profile in Firestore from Firebase Auth user data
 * @param user - Firebase Auth user object
 * @param additionalData - Optional additional profile data to merge
 * @throws Error if profile creation fails
 */
export const createUserProfile = async (
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<void> => {
  try {
    // Build user profile from Firebase Auth data with defaults
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      platformRole: 'user', // Default role for new users
      ...additionalData
    };

    // Remove undefined values to avoid storing them in Firestore
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

/**
 * Retrieves a user profile by UID from Firestore
 * @param uid - Firebase Auth user ID
 * @returns UserProfile object or null if not found
 * @throws Error if retrieval fails
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
 * Updates specific fields in a user profile
 * @param uid - Firebase Auth user ID
 * @param data - Partial user profile data to update
 * @throws Error if update fails
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
 * Synchronizes Firebase Auth user data with stored profile
 * Creates profile if it doesn't exist, updates if it does
 * Preserves existing profile data while updating Auth-provided fields
 * @param user - Firebase Auth user object
 * @param additionalData - Optional additional data to merge
 * @throws Error if sync operation fails
 */
export const syncUserProfile = async (
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<void> => {
  try {
    const existingProfile = await getUserProfile(user.uid);
    
    if (existingProfile) {
      // Update existing profile with fresh Auth data, preserving existing values
      const updates: Partial<UserProfile> = {
        email: user.email || existingProfile.email,
        displayName: user.displayName || existingProfile.displayName,
        photoURL: user.photoURL || existingProfile.photoURL || '',
        platformRole: existingProfile.platformRole || 'user', // Preserve existing role
        ...additionalData
      };
      
      // Remove undefined values before updating
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ) as Partial<UserProfile>;
      
      await updateUserProfile(user.uid, cleanUpdates);
    } else {
      // Create new profile if none exists
      await createUserProfile(user, additionalData);
    }
  } catch (error) {
    logger.error('Error syncing user profile', error as Error, { uid: user.uid });
    throw error;
  }
};

/**
 * Retrieves all user profiles from Firestore
 * @returns Array of all user profiles
 * @throws Error if retrieval fails
 */
export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const userProfiles = await getAllDocuments(USER_COLLECTION);
    logger.debug(`Retrieved ${userProfiles.length} user profiles`);
    return userProfiles as UserProfile[];
  } catch (error) {
    logger.error('Error getting all user profiles', error as Error);
    throw error;
  }
};

/**
 * Finds a user profile by email address
 * @param email - Email address to search for (case-insensitive)
 * @returns UserProfile object or null if not found
 * @throws Error if search fails
 */
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const userProfiles = await getAllUserProfiles();
    // Case-insensitive email comparison
    const user = userProfiles.find(profile => profile.email.toLowerCase() === email.toLowerCase());
    return user || null;
  } catch (error) {
    logger.error('Error getting user by email', error as Error, { email });
    throw error;
  }
};

/**
 * Permanently deletes a user profile from Firestore
 * @param uid - Firebase Auth user ID
 * @throws Error if deletion fails
 */
export const deleteUserProfile = async (uid: string): Promise<void> => {
  try {
    await deleteDocument(USER_COLLECTION, uid);
    logger.info(`User profile deleted for user: ${uid}`);
  } catch (error) {
    logger.error('Error deleting user profile', error as Error, { uid });
    throw error;
  }
};