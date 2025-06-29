'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';

// Interface defining the structure of invitation data received from the API
interface InvitationData {
  organizationName?: string;
  organizationId?: string;
  role?: string;
  inviterName?: string;
}

/**
 * Page component for handling organization invitations via token-based URLs
 * Validates invitation tokens, displays invitation details, and processes accept/decline actions
 */
export default function InvitationPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true); // Loading state for invitation validation
  const [isProcessing, setIsProcessing] = useState(false); // Processing state for accept/decline actions
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [validInvitation, setValidInvitation] = useState(false);
  
  // Handle case where token might be an array from dynamic routing
  const invitationToken = Array.isArray(token) ? token[0] : token;

  // Validate invitation token on component mount and when token changes
  useEffect(() => {
    const validateInvitation = async () => {
      if (!invitationToken) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch invitation details from API to validate token and get organization info
        const response = await fetch(`/api/invitations/${invitationToken}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Invalid invitation');
        }
        
        setValidInvitation(true);
        setInvitationData({
          organizationName: result.organizationName,
          organizationId: result.organizationId,
          role: result.role,
          inviterName: result.inviterName
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

  /**
   * Handles user's decision to accept or decline the invitation
   * @param action - Either 'accept' or 'decline'
   */
  const handleInvitationAction = async (action: 'accept' | 'decline') => {
    if (!user || !invitationToken) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Send POST request to process the invitation with user's decision
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
        // Delay redirect to allow user to see success state
        setTimeout(() => {
          if (result.redirectUrl) {
            router.push(result.redirectUrl);
          } else {
            router.push('/organizations');
          }
        }, 1500);
        
        // Update invitation data with any new information from the response
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

  // Show loading spinner while authentication or invitation validation is in progress
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect unauthenticated users to login with return URL to this invitation page
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Organization Invitation
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You've been invited to join an organization
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
            {invitationData?.role && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Role:</span>
                <p className="text-gray-700 dark:text-gray-300 capitalize">{invitationData.role}</p>
              </div>
            )}
            {invitationData?.inviterName && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Invited by:</span>
                <p className="text-gray-700 dark:text-gray-300">{invitationData.inviterName}</p>
              </div>
            )}
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