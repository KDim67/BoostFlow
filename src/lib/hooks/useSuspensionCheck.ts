'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { getUserProfile } from '@/lib/firebase/userProfileService';

export function useSuspensionCheck(shouldCheck: boolean = true) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkSuspension = async () => {
      if (!user?.uid || !shouldCheck) return;

      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile?.suspended) {
          router.push('/suspended');
        }
      } catch (error) {
        console.error('Error checking user suspension:', error);
      }
    };

    if (user?.uid && shouldCheck) {
      checkSuspension();
      
      intervalId = setInterval(checkSuspension, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user?.uid, router, shouldCheck]);
}

export default useSuspensionCheck;