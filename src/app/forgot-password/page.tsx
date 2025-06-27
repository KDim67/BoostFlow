'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/firebase/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await resetPassword(email);
      setEmailSent(true);
      setMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Please check your inbox and follow the instructions to reset your password.' 
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      if (error.code === 'auth/user-not-found') {
        setMessage({ type: 'error', text: 'No account found with this email address' });
      } else if (error.code === 'auth/invalid-email') {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
      } else if (error.code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: 'Too many requests. Please try again later.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to send password reset email. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Forgot <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Password</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {emailSent 
                ? 'Check your email for password reset instructions.'
                : 'Enter your email address and we\'ll send you a link to reset your password.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Forgot Password Form */}
      <section className="py-12 bg-white dark:bg-gray-900 flex-grow flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <Link href="/" className="inline-block">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BoostFlow</span>
                </Link>
              </div>
              
              {/* Message */}
              {message && (
                <div className={`mb-6 p-4 rounded-md ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                }`}>
                  {message.text}
                </div>
              )}
              
              {!emailSent ? (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all flex justify-center items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Email Sent!</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setEmailSent(false);
                      setMessage(null);
                      setEmail('');
                    }}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Send to Different Email
                  </button>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{' '}
                  <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                    Back to login
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