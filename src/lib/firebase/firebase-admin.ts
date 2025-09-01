// src/lib/firebase/firebase-admin.ts
import * as admin from 'firebase-admin';

// Ensure you have this in your .env.local for local development,
// and set as an environment variable in Vercel.
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The `serviceAccount` is a JSON string, so we need to parse it.
      credential: admin.credential.cert(JSON.parse(serviceAccount!)),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error: any) {
    // We only want to log the error if it's not a 'duplicate-app' error,
    // which can happen in development with hot-reloading.
    if (error.code !== 'app/duplicate-app') {
      console.error('Firebase Admin initialization error:', error.stack);
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
