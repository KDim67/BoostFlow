import admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        throw new Error('Firebase service account key not found in environment variables');
      }
      
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      if (!serviceAccount.project_id) {
        throw new Error('Service account object must contain a string "project_id" property');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      throw error;
    }
  }
};

initializeFirebaseAdmin();

const adminFirestore = admin.firestore();

export { admin, adminFirestore };