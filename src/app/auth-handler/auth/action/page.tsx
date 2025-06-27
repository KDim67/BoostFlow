'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset, checkActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface ActionResult {
  success: boolean;
  message: string;
  email?: string;
}

function EmailActionHandlerContent() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [actionCode, setActionCode] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrl = searchParams.get('continueUrl');
  const lang = searchParams.get('lang') || 'en';

  useEffect(() => {
    if (!mode || !oobCode) {
      setResult({
        success: false,
        message: 'Invalid or missing parameters.'
      });
      setLoading(false);
      return;
    }

    handleAction(mode, oobCode);
  }, [mode, oobCode]);

  const handleAction = async (actionMode: string, code: string) => {
    try {
      switch (actionMode) {
        case 'verifyEmail':
          await applyActionCode(auth, code);
          
          // Check if user is logged in and update their profile in database
          const currentUser = auth.currentUser;
          if (currentUser) {
            try {
              const { updateUserProfile } = await import('@/lib/firebase/userProfileService');
              await updateUserProfile(currentUser.uid, {
                emailVerified: true,
                email: currentUser.email || undefined
              });
            } catch (dbError) {
              console.error('Error updating user profile in database:', dbError);
              // Don't fail the verification process if database update fails
            }
          }
          
          setResult({
            success: true,
            message: 'Your email has been verified successfully!'
          });
          
          // Always redirect to login page with verified parameter
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
          break;
          
        case 'verifyAndChangeEmail':
          await applyActionCode(auth, code);
          
          // Check if user is logged in and update their profile in database
          const currentUserForEmailChange = auth.currentUser;
          if (currentUserForEmailChange) {
            try {
              const { updateUserProfile } = await import('@/lib/firebase/userProfileService');
              await updateUserProfile(currentUserForEmailChange.uid, {
                emailVerified: true,
                email: currentUserForEmailChange.email || undefined
              });
            } catch (dbError) {
              console.error('Error updating user profile in database:', dbError);
              // Don't fail the verification process if database update fails
            }
          }
          
          setResult({
            success: true,
            message: 'Your email has been changed and verified successfully!'
          });
          
          // Always redirect to login page with verified parameter
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
          break;
          
        case 'resetPassword':
          // Verify the code first
          const email = await verifyPasswordResetCode(auth, code);
          setResult({
            success: true,
            message: `Please enter your new password for ${email}`,
            email
          });
          setActionCode(code);
          setShowPasswordForm(true);
          break;
          
        case 'recoverEmail':
          // Handle email recovery
          const info = await checkActionCode(auth, code);
          await applyActionCode(auth, code);
          setResult({
            success: true,
            message: 'Your email change has been reverted successfully.'
          });
          break;
          
        default:
          setResult({
            success: false,
            message: 'Invalid action mode.'
          });
      }
    } catch (error: any) {
      console.error('Error handling action:', error);
      setResult({
        success: false,
        message: error.message || 'An error occurred while processing your request.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setResult({
        success: false,
        message: 'Passwords do not match.'
      });
      return;
    }
    
    if (newPassword.length < 6) {
      setResult({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }
    
    if (!actionCode) {
      setResult({
        success: false,
        message: 'Invalid action code.'
      });
      return;
    }
    
    try {
      setLoading(true);
      await confirmPasswordReset(auth, actionCode, newPassword);
      setResult({
        success: true,
        message: 'Your password has been reset successfully!'
      });
      setShowPasswordForm(false);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://boostflow.me';
        const redirectUrl = `${baseUrl}/login?passwordReset=true`;
        window.location.href = redirectUrl;
      }, 3000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setResult({
        success: false,
        message: error.message || 'An error occurred while resetting your password.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Processing your request...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            BoostFlow
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Account Management
          </p>
        </div>
        
        {result && (
          <div className={`rounded-md p-4 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {showPasswordForm && (
          <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your new password"
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your new password"
                minLength={6}
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
        
        {result?.success && mode === 'verifyEmail' && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Redirecting you to the app in a few seconds...
            </p>
          </div>
        )}
        
        {result?.success && mode === 'resetPassword' && !showPasswordForm && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Redirecting you to login in a few seconds...
            </p>
          </div>
        )}
        
        {!result?.success && (
          <div className="text-center">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://boostflow.me'}/login`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Return to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailActionHandler() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <EmailActionHandlerContent />
    </Suspense>
  );
}