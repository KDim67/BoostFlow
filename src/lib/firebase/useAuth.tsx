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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  sendEmailVerification: (user: User) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await registerUser(email, password, displayName);
      
      if (userCredential.user) {
        await syncUserProfile(userCredential.user);
      }
      
      return userCredential;
    } catch (err: any) {
      setError(err.message || 'Failed to create an account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await loginUser(email, password);
      
      if (userCredential.user) {
        await syncUserProfile(userCredential.user);
      }
      
      return userCredential;
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logoutUser();
    } catch (err: any) {
      setError(err.message || 'Failed to log out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await signInWithGoogle();
      
      if (userCredential.user) {
        await syncUserProfile(userCredential.user);
      }
      
      return userCredential;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerificationWrapper = async (user: User) => {
    try {
      setError(null);
      await sendVerificationEmail(user);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}