'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';

interface InvitationData {
  organizationName?: string;
  organizationId?: string;
  role?: string;
  inviterName?: string;
}

export default function InvitationPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [validInvitation, setValidInvitation] = useState(false);
  
  const invitationToken = Array.isArray(token) ? token[0] : token;

  useEffect(() => {
    const validateInvitation = async () => {
      if (!invitationToken) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        setValidInvitation(true);
        setInvitationData({
          organizationName: 'Loading...',
        });
      } catch (error) {
        console.error('Error validating invitation:', error);
        setError('Invalid or expired invitation');
      } finally {
        setIsLoading(false);
      }
    };

    validateInvitation();
  }, [invitationToken]);

  const handleInvitationAction = async (action: 'accept' | 'decline') => {
    if (!user || !invitationToken) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch(`/api/invitations/${invitationToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId: user.uid
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to process invitation');
      }
      
      if (result.success) {
        setTimeout(() => {
          if (result.redirectUrl) {
            router.push(result.redirectUrl);
          } else {
            router.push('/organizations');
          }
        }, 1500);
        
        setInvitationData(prev => ({
          ...prev,
          organizationName: result.organizationName || prev?.organizationName
        }));
      }
    } catch (error: any) {
      console.error('Error processing invitation:', error);
      setError(error.message || 'Failed to process invitation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push(`/login?redirect=${encodeURIComponent(`/invitation/${invitationToken}`)}`);
    return null;
  }

  if (error || !validInvitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
            {error || 'Invalid Invitation'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The invitation you're looking for doesn't exist, has expired, or you don't have permission to view it.
          </p>
          <Link 
            href="/organizations"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Team Invitation
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You've been invited to join a team
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Invitation Details
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization:</span>
              <p className="text-gray-900 dark:text-white font-medium">
                {invitationData?.organizationName || 'Loading...'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Invited User:</span>
              <p className="text-gray-700 dark:text-gray-300">{user.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={() => handleInvitationAction('accept')}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? 'Processing...' : 'Accept Invitation'}
          </button>
          <button
            onClick={() => handleInvitationAction('decline')}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? 'Processing...' : 'Decline'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/organizations"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Organizations
          </Link>
        </div>
      </div>
    </div>
  );
}