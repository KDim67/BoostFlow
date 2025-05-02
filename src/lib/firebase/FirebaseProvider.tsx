/**
 * Firebase Provider Component
 * 
 * This component provides Firebase context to the entire application.
 * It initializes Firebase and makes all Firebase services available to child components.
 */

import { ReactNode } from 'react';
import { AuthProvider } from './useAuth';

interface FirebaseProviderProps {
  children: ReactNode;
}

/**
 * Firebase Provider Component
 * Wraps the application with Firebase context providers
 * @param children Child components
 * @returns Firebase Provider component
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}