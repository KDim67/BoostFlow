'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * TeamInvitation component handles the redirection logic for team invitation links.
 * It extracts the membership ID from the URL and redirects the user accordingly.
 */
export default function TeamInvitation() {
  // Extract parameters from the URL, specifically the membershipId.
  const { membershipId } = useParams();
  // Initialize the Next.js router for navigation.
  const router = useRouter();
  // Ensure memId is a single string, handling cases where it might be an array.
  const memId = Array.isArray(membershipId) ? membershipId[0] : membershipId;

  // useEffect hook to handle redirection based on the presence of a membership ID.
  useEffect(() => {
    // If a membership ID exists, redirect to the invitation acceptance page.
    if (memId) {
      router.replace(`/invitation/${memId}`);
    } else {
      // If no membership ID is found, redirect to the organizations page.
      router.replace('/organizations');
    }
  }, [memId, router]); // memId and router ensure the effect runs when these values change.

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}