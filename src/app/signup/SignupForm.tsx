"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/useAuth';
import { syncUserProfile } from '@/lib/firebase/userProfileService';

export default function SignupForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { signup, loginWithGoogle, error, clearError } = useAuth();
  const router = useRouter();

  // Display auth errors from useAuth hook
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Validate password
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    clearError();
    
    // Validate password before submission
    if (!validatePassword(password)) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Create the user account
      const displayName = `${firstName} ${lastName}`.trim();
      await signup(email, password, displayName);
      
      // Get the current user after signup
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User creation succeeded but user is not logged in');
      }
      
      // Add additional profile information
      await syncUserProfile(currentUser, {
        firstName,
        lastName,
        company,
        createdAt: new Date()
      } as any); // Type assertion as a last resort
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First name</label>
          <input 
            type="text" 
            id="first-name" 
            name="first-name" 
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last name</label>
          <input 
            type="text" 
            id="last-name" 
            name="last-name" 
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company name</label>
        <input 
          type="text" 
          id="company" 
          name="company" 
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work email</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            validatePassword(e.target.value);
          }}
        />
        {passwordError && (
          <p className="mt-1 text-sm text-red-600">{passwordError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Password must be at least 8 characters long
        </p>
      </div>
      

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms" className="text-gray-700 dark:text-gray-300">
            I agree to the <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>
          </label>
        </div>
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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </div>
    </form>
  );
}