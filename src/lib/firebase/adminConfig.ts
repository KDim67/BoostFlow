import admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
    }
  }
};

initializeFirebaseAdmin();

const adminFirestore = admin.firestore();

export { admin, adminFirestore };