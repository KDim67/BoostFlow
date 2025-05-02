"use client";

import { useState, useEffect } from 'react';

interface LeadCapturePopupProps {
  title?: string;
  description?: string;
  ctaText?: string;
  offerText?: string;
  delay?: number;
  exitIntent?: boolean;
}

const LeadCapturePopup = ({
  title = 'Get 20% Off Your First Month',
  description = 'Subscribe to our newsletter and get exclusive offers, tips, and resources.',
  ctaText = 'Subscribe',
  offerText = 'Limited time offer. No credit card required.',
  delay = 5000,
  exitIntent = true,
}: LeadCapturePopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('hasSeenPopup');
    
    if (hasSeenPopup) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    const handleExitIntent = (e: MouseEvent) => {
      if (exitIntent && e.clientY <= 0) {
        setIsVisible(true);
      }
    };

    if (exitIntent) {
      document.addEventListener('mouseleave', handleExitIntent);
    }

    return () => {
      clearTimeout(timer);
      if (exitIntent) {
        document.removeEventListener('mouseleave', handleExitIntent);
      }
    };
  }, [delay, exitIntent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Here we would typically send the email to your API/backend
    // For now, we'll just simulate a successful submission
    setHasSubmitted(true);
    localStorage.setItem('hasSeenPopup', 'true');
    
    // Reset form
    setEmail('');
    setError('');
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenPopup', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          {!hasSubmitted ? (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{description}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    required
                  />
                  {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all"
                >
                  {ctaText}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">{offerText}</p>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Thank You!</h3>
              <p className="text-gray-600 dark:text-gray-300">You've been successfully subscribed to our newsletter.</p>
              <button
                onClick={handleClose}
                className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCapturePopup;