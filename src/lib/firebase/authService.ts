/**
 * Firebase Authentication Service
 * 
 * This module provides a centralized interface for all authentication operations
 * in the BoostFlow application. It wraps Firebase Auth methods with error handling
 * and consistent configuration.
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './config';

// Configure Google OAuth provider
const googleProvider = new GoogleAuthProvider();
// Force account selection dialog to appear even if user has only one Google account
// This ensures users can switch between multiple Google accounts
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Registers a new user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password (must meet Firebase requirements)
 * @param displayName - Optional display name to set on the user profile
 * @returns Promise resolving to UserCredential containing user info and auth tokens
 * 
 * @throws FirebaseError if registration fails (weak password, email in use, etc.)
 */
export const registerUser = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set display name if provided and user creation was successful
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error; // Re-throw to allow caller to handle specific error cases
  }
};

/**
 * Authenticates a user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to UserCredential with user info and auth tokens
 * 
 * @throws FirebaseError if login fails (invalid credentials, user not found, etc.)
 */
export const loginUser = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error; // Re-throw to allow caller to handle specific error cases
  }
};

/**
 * Signs out the current user
 * 
 * Clears the user's authentication state and tokens from the client.
 * This will trigger auth state change listeners.
 * 
 * @returns Promise that resolves when sign out is complete
 * @throws FirebaseError if sign out fails (rare, usually network issues)
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
 * Sends a password reset email to the user
 * 
 * The email will contain a link that redirects to our auth handler page
 * where the user can set a new password.
 * 
 * @param email - Email address to send reset link to
 * @returns Promise that resolves when email is sent
 * 
 * @throws FirebaseError if email sending fails (invalid email, user not found, etc.)
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    // Configure where the password reset link should redirect
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://boostflow.me'}/auth-handler/auth/action`,
      handleCodeInApp: true, // Handle the reset within our app rather than external browser
    };
    
    return await sendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Gets the currently authenticated user
 * 
 * This is a synchronous operation that returns the cached user state.
 * For real-time auth state changes, use subscribeToAuthChanges instead.
 * 
 * @returns Current user object or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Authenticates user with Google OAuth using popup flow
 * 
 * Opens a popup window for Google sign-in.
 * 
 * @returns Promise resolving to UserCredential with user info and auth tokens
 * 
 * @throws FirebaseError if OAuth flow fails (popup blocked, user cancels, etc.)
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error; // Common errors: popup blocked, user cancelled, network issues
  }
};

/**
 * Sends an email verification link to the user
 * 
 * The verification email will contain a link that redirects to our auth handler
 * page where the email verification will be processed.
 * 
 * @param user - Firebase User object to send verification email to
 * @returns Promise that resolves when verification email is sent
 * 
 * @throws FirebaseError if email sending fails or user is already verified
 */
export const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    // Configure where the verification link should redirect
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://boostflow.me'}/auth-handler/auth/action`,
      handleCodeInApp: true, // Handle verification within our app
    };
    
    await sendEmailVerification(user, actionCodeSettings);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Subscribes to authentication state changes
 * 
 * The callback will be invoked whenever the user's authentication state changes
 * (login, logout, token refresh, etc.). This is the recommended way to track
 * auth state in React components.
 * 
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function to stop listening to auth changes
 * 
 */
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};