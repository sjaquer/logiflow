
import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK and returns the Firestore database instance.
// It's designed to be a singleton, meaning it will only initialize the app once.
export function getAdminDb() {
  // If the app is already initialized, return the existing Firestore instance.
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  // Check if the required environment variables are set.
  // This is the standard and most robust way for Vercel and other modern hosting platforms.
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Firebase Admin environment variables are not set. Please check FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.');
  }

  // Vercel and other platforms might escape newlines in environment variables.
  // We need to replace them back to the original format for the private key to be valid.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  // Initialize the Firebase Admin app with individual credential components.
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.message);
    throw new Error('Could not initialize Firebase Admin SDK. Please check your environment variables.');
  }


  // Return the Firestore database instance.
  return admin.firestore();
}
