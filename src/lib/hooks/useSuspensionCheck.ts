'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { getUserProfile } from '@/lib/firebase/userProfileService';

/**
 * Custom hook that monitors user suspension status and redirects to suspension page if needed.
 * Performs periodic checks every 30 seconds to ensure real-time suspension enforcement.
 * 
 * @param shouldCheck - Optional flag to enable/disable suspension checking (default: true)
 */
export function useSuspensionCheck(shouldCheck: boolean = true) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    /**
     * Checks if the current user is suspended and redirects if necessary.
     * Silently handles errors to prevent disrupting user experience.
     */
    const checkSuspension = async () => {
      // Early return if no user or checking is disabled
      if (!user?.uid || !shouldCheck) return;

      try {
        const userProfile = await getUserProfile(user.uid);
        // Redirect to suspension page if user is marked as suspended
        if (userProfile?.suspended) {
          router.push('/suspended');
        }
      } catch (error) {
        // Log errors but don't throw to avoid breaking the app
        console.error('Error checking user suspension:', error);
      }
    };

    // Only start checking if user is authenticated and checking is enabled
    if (user?.uid && shouldCheck) {
      // Perform immediate check on mount
      checkSuspension();
      
      // Set up periodic checking every 30 seconds (30000ms)
      intervalId = setInterval(checkSuspension, 30000);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user?.uid, router, shouldCheck]); // Re-run effect when dependencies change
}

export default useSuspensionCheck;