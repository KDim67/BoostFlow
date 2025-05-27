import { useState, useEffect } from 'react';
import { User, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, MultiFactorSession, ApplicationVerifier, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db as firestore } from './config';

export type PlatformRole = 'super_admin' | 'platform_moderator' | 'organization_admin' | 'user';

interface PlatformAuthUser extends User {
  platformRole?: PlatformRole;
  isMultiFactorEnabled?: boolean;
}

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

export function usePlatformAuth(): UsePlatformAuthReturn {
  const [user, setUser] = useState<PlatformAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [mfaVerificationId, setMfaVerificationId] = useState<string | null>(null);

  const isPlatformAdmin = !!user && 
    (user.platformRole === 'super_admin' || user.platformRole === 'platform_moderator');
  
  const isSuperAdmin = !!user && user.platformRole === 'super_admin';
  const isPlatformModerator = !!user && user.platformRole === 'platform_moderator';

  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      try {
        if (authUser) {
          const userDoc = await getDoc(doc(firestore, 'users', authUser.uid));
          const userData = userDoc.data();
          
          const platformUser: PlatformAuthUser = authUser;
          platformUser.platformRole = userData?.platformRole as PlatformRole || 'user';
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

  const setupMFA = async (phoneNumber: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to setup MFA');
    
    try {
      const multiFactorSession = await multiFactor(user).getSession();
      
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: multiFactorSession
      };
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        new RecaptchaVerifier(auth, 'recaptcha-container', {})
      );
      
      setMfaVerificationId(verificationId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to setup MFA'));
      throw err;
    }
  };

  const verifyMFA = async (verificationCode: string): Promise<void> => {
    if (!mfaVerificationId) throw new Error('MFA verification not initiated');
    
    try {
      const credential = PhoneAuthProvider.credential(mfaVerificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      
      await multiFactor(user!).enroll(multiFactorAssertion, 'Phone Number');
      
      if (user) {
        user.isMultiFactorEnabled = true;
        setUser({...user});
      }
      
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