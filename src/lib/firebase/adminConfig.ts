import admin from 'firebase-admin';

/**
 * Initializes Firebase Admin SDK with service account credentials
 * Ensures singleton pattern - only initializes once per application lifecycle
 */
const initializeFirebaseAdmin = () => {
  // Check if Firebase Admin is already initialized to prevent duplicate initialization
  if (admin.apps.length === 0) {
    try {
      // Retrieve service account key from environment variables
      // Supports both server-side and client-side environment variable patterns
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        throw new Error('Firebase service account key not found in environment variables');
      }
      
      // Parse the JSON string containing service account credentials
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      // Validate that the service account contains required project_id field
      if (!serviceAccount.project_id) {
        throw new Error('Service account object must contain a string "project_id" property');
      }
      
      // Initialize Firebase Admin SDK with service account credentials
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      // Log initialization errors and re-throw to prevent silent failures
      console.error('Error initializing Firebase Admin SDK:', error);
      throw error;
    }
  }
};

// Initialize Firebase Admin immediately when module is imported
initializeFirebaseAdmin();

// Create Firestore instance for database operations
const adminFirestore = admin.firestore();

// Export Firebase Admin instance and Firestore for use in other modules
export { admin, adminFirestore };