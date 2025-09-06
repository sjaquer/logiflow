
import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK and returns the Firestore database instance.
// It's designed to be a singleton, meaning it will only initialize the app once.
export function getAdminDb() {
  // If the app is already initialized, return the existing Firestore instance.
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  // Check if the required environment variables are set.
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Firebase Admin environment variables are not set. Please check FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.');
  }

  // Vercel escapes newlines in environment variables, so we need to replace them back.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  // Initialize the Firebase Admin app with individual credential components.
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  // Return the Firestore database instance.
  return admin.firestore();
}
