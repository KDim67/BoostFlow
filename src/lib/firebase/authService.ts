/**
 * Firebase Authentication Service
 * 
 * This file provides authentication-related functionality using Firebase Auth.
 * It includes methods for user registration, login, logout, password reset, and
 * getting the current user state.
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './config';

/**
 * User registration with email and password
 * @param email User's email address
 * @param password User's password
 * @param displayName User's display name
 * @returns Promise resolving to UserCredential
 */
export const registerUser = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * User login with email and password
 * @param email User's email address
 * @param password User's password
 * @returns Promise resolving to UserCredential
 */
export const loginUser = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * User logout
 * @returns Promise that resolves when logout is complete
 */
export const logoutUser = async (): Promise<void> => {
  try {
    return await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param email User's email address
 * @returns Promise that resolves when the reset email is sent
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    return await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};