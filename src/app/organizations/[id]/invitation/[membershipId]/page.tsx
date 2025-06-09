'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TeamInvitation() {
  const { membershipId } = useParams();
  const router = useRouter();
  const memId = Array.isArray(membershipId) ? membershipId[0] : membershipId;

  useEffect(() => {
    if (memId) {
      router.replace(`/invitation/${memId}`);
    } else {
      router.replace('/organizations');
    }
  }, [memId, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}