'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserCredential } from 'firebase/auth';
import {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  getCurrentUser,
  subscribeToAuthChanges,
  signInWithGoogle,
  sendVerificationEmail
} from './authService';
import { syncUserProfile } from './userProfileService';

/**
 * Authentication context type definition
 * Defines the shape of the authentication context that will be provided to components
 */

interface AuthContextType {
  user: User | null; // Current authenticated user or null if not logged in
  loading: boolean; // Indicates if an auth operation is in progress
  error: string | null; // Current error message or null if no error
  signup: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  sendEmailVerification: (user: User) => Promise<void>;
  clearError: () => void;
}

// Create the authentication context with undefined as default value
// This ensures proper type checking and forces components to use the provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Wraps the application and provides authentication state and methods to child components
 * Manages user state, loading states, and error handling for all auth operations
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Authentication state management
  const [user, setUser] = useState<User | null>(null); // Current user object
  const [loading, setLoading] = useState(true); // Loading state for auth operations
  const [error, setError] = useState<string | null>(null); // Error state for auth operations

  // Subscribe to authentication state changes on component mount
  useEffect(() => {
    // Set up listener for Firebase auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user); // Update user state when auth state changes
      setLoading(false); // Auth state is now determined
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  /**
   * User registration function
   * Creates a new user account and syncs their profile data
   */
  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await registerUser(email, password, displayName);
      
      // Sync user profile data after successful registration
      if (userCredential.user) {
        await syncUserProfile(userCredential.user);
      }
      
      return userCredential;
    } catch (err: any) {
      setError(err.message || 'Failed to create an account');
      throw err; // Re-throw to allow component-level error handling
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  /**
   * User login function
   * Authenticates user with email/password and syncs profile data
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await loginUser(email, password);
      
      // Sync user profile data after successful login
      if (userCredential.user) {
        await syncUserProfile(userCredential.user);
      }
      
      return userCredential;
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
      throw err; // Re-throw to allow component-level error handling
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  /**
   * User logout function
   * Signs out the current user and clears authentication state
   */
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logoutUser();
    } catch (err: any) {
      setError(err.message || 'Failed to log out');
      throw err; // Re-throw to allow component-level error handling
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  /**
   * Google OAuth login function
   * Authenticates user with Google OAuth and syncs profile data
   */
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await signInWithGoogle();
      
      // Sync user profile data after successful Google login
      if (userCredential.user) {
        await syncUserProfile(userCredential.user);
      }
      
      return userCredential;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err; // Re-throw to allow component-level error handling
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  /**
   * Password reset function
   * Sends a password reset email to the specified email address
   */
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
      throw err; // Re-throw to allow component-level error handling
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  /**
   * Email verification wrapper function
   * Sends an email verification to the specified user
   * Note: Does not set loading state as this is typically a background operation
   */
  const sendEmailVerificationWrapper = async (user: User) => {
    try {
      setError(null);
      await sendVerificationEmail(user);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      throw err; // Re-throw to allow component-level error handling
    }
  };

  /**
   * Error clearing function
   * Resets the error state to null, typically called when dismissing error messages
   */
  const clearError = () => {
    setError(null);
  };

  // Context value object containing all auth state and methods
  const value = {
    user,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
    forgotPassword,
    sendEmailVerification: sendEmailVerificationWrapper,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication context
 * Must be used within an AuthProvider component
 * Throws an error if used outside of the provider to prevent undefined context access
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}