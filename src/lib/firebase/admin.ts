// Import the initialized Firebase Admin SDK instance from configuration
import { admin } from './adminConfig';

// Export the Firebase Admin app instance for use in API routes and server-side operations
// This provides access to Firebase Admin services like Auth, Firestore, Storage, etc.
export const adminApp = admin.app();

// Re-export the admin SDK for direct access to Firebase Admin methods
// Used when you need access to the full admin SDK rather than just the app instance
export { admin };
