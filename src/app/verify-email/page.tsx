'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import Link from 'next/link';

function VerifyEmailContent() {
  const { user, sendEmailVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle email verification action code from URL
    const handleEmailVerification = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');
      
      if (mode === 'verifyEmail' && oobCode) {
        setIsVerifying(true);
        try {
          await applyActionCode(auth, oobCode);
          setMessage('Email verified successfully! Redirecting...');
          // Reload user to get updated emailVerified status
          if (user) {
            await user.reload();
          }
          setTimeout(() => {
            router.push('/organizations');
          }, 2000);
        } catch (error: any) {
          console.error('Error verifying email:', error);
          setMessage('Invalid or expired verification link. Please try again.');
        } finally {
          setIsVerifying(false);
        }
        return;
      }
    };

    handleEmailVerification();

    // If user is already verified or signed in with Google, redirect
    if (user?.emailVerified) {
      router.push('/organizations');
    }
  }, [user, router, searchParams]);

  const handleResendEmail = async () => {
    if (!user) return;
    
    setIsResending(true);
    setMessage('');
    
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const checkVerification = async () => {
    if (!user) return;
    
    setIsChecking(true);
    setMessage('');
    
    try {
      // Reload user to get latest emailVerified status
      await user.reload();
      
      if (user.emailVerified) {
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          router.push('/organizations');
        }, 1500);
      } else {
        setMessage('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (error: any) {
      setMessage('Error checking verification status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please sign in to access this page.
            </p>
            <Link 
              href="/login" 
              className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent a verification email to:
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {user.email}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please check your inbox and click the verification link to continue.
          </p>
        </div>

        {isVerifying && (
          <div className="p-3 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300">
            Verifying your email...
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('successfully') || message.includes('sent')
              ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300'
              : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        {!isVerifying && (
          <div className="space-y-4">
            <button
              onClick={checkVerification}
              disabled={isChecking}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? 'Checking...' : "I've Verified My Email"}
            </button>
            
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}