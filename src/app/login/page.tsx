"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';

import LoginForm from './LoginForm';

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const { loginWithGoogle, clearError } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setGoogleError('');
      clearError();
      const userCredential = await loginWithGoogle();
      
      // Google users are automatically verified, so proceed directly
      router.push('/organizations');
    } catch (error: any) {
      setGoogleError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Welcome <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Back</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Log in to your account to access your dashboard and productivity tools.
            </p>
          </div>
        </div>
      </section>

      {/* Login Form */}
      <section className="py-12 bg-white dark:bg-gray-900 flex-grow flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <Link href="/" className="inline-block">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BoostFlow</span>
                </Link>
              </div>
              
              <Suspense fallback={<div className="text-center">Loading...</div>}>
                <LoginForm />
              </Suspense>
              
              {googleError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {googleError}
                </div>
              )}
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button 
                    type="button" 
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGoogleLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                        </svg>
                        Google
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link href="/signup" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}