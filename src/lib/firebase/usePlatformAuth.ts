import { useState, useEffect } from 'react';
import { User, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, MultiFactorSession, ApplicationVerifier, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db as firestore } from './config';

// Platform-specific user roles for access control
export type PlatformRole = 'super_admin' | 'platform_moderator' | 'user';

// Extended Firebase User interface with platform-specific properties
interface PlatformAuthUser extends User {
  platformRole?: PlatformRole;
  isMultiFactorEnabled?: boolean;
}

// Return type for the usePlatformAuth hook
export interface UsePlatformAuthReturn {
  user: PlatformAuthUser | null;
  isPlatformAdmin: boolean;
  isSuperAdmin: boolean;
  isPlatformModerator: boolean;
  isLoading: boolean;
  error: Error | null;
  setupMFA: (phoneNumber: string) => Promise<void>;
  verifyMFA: (verificationCode: string) => Promise<void>;
}

/**
 * Custom hook for platform authentication with role-based access control and MFA support
 * Manages user authentication state, platform roles, and multi-factor authentication
 */
export function usePlatformAuth(): UsePlatformAuthReturn {
  const [user, setUser] = useState<PlatformAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  // Stores verification ID during MFA setup process
  const [mfaVerificationId, setMfaVerificationId] = useState<string | null>(null);

  // Computed role-based access flags
  const isPlatformAdmin = !!user && 
    (user.platformRole === 'super_admin' || user.platformRole === 'platform_moderator');
  
  const isSuperAdmin = !!user && user.platformRole === 'super_admin';
  const isPlatformModerator = !!user && user.platformRole === 'platform_moderator';

  useEffect(() => {
    setIsLoading(true);
    
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      try {
        if (authUser) {
          // Fetch user's platform role from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', authUser.uid));
          const userData = userDoc.data();
          
          // Enhance Firebase user with platform-specific properties
          const platformUser: PlatformAuthUser = authUser;
          platformUser.platformRole = userData?.platformRole as PlatformRole || 'user';
          // Check if user has any enrolled MFA factors
          platformUser.isMultiFactorEnabled = multiFactor(authUser).enrolledFactors.length > 0;
          
          setUser(platformUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown authentication error'));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Initiates MFA setup process by sending verification code to phone number
   * Requires reCAPTCHA verification and stores verification ID for later use
   */
  const setupMFA = async (phoneNumber: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to setup MFA');
    
    try {
      // Get current multi-factor session for enrollment
      const multiFactorSession = await multiFactor(user).getSession();
      
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: multiFactorSession
      };
      // Send SMS verification code with reCAPTCHA protection
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        new RecaptchaVerifier(auth, 'recaptcha-container', {})
      );
      
      // Store verification ID for the verification step
      setMfaVerificationId(verificationId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to setup MFA'));
      throw err;
    }
  };

  /**
   * Completes MFA enrollment by verifying the SMS code
   * Updates user state to reflect MFA enablement
   */
  const verifyMFA = async (verificationCode: string): Promise<void> => {
    if (!mfaVerificationId) throw new Error('MFA verification not initiated');
    
    try {
      // Create phone credential from verification code
      const credential = PhoneAuthProvider.credential(mfaVerificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      
      // Enroll the phone number as a second factor
      await multiFactor(user!).enroll(multiFactorAssertion, 'Phone Number');
      
      // Update local user state to reflect MFA enablement
      if (user) {
        user.isMultiFactorEnabled = true;
        setUser({...user});
      }
      
      // Clear verification ID after successful enrollment
      setMfaVerificationId(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to verify MFA'));
      throw err;
    }
  };

  return {
    user,
    isPlatformAdmin,
    isSuperAdmin,
    isPlatformModerator,
    isLoading,
    error,
    setupMFA,
    verifyMFA
  };
}