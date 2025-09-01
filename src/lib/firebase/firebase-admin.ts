// src/lib/firebase/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let credentialsJson: object | undefined;

    // Vercel and other environments might pass the credentials as a raw JSON string
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim().startsWith('{')) {
      credentialsJson = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }

    if (credentialsJson) {
      admin.initializeApp({
        credential: admin.credential.cert(credentialsJson),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
        // Fallback for local development or when the path is provided
        // Ensure you have the file path set in your .env.local for local dev
        admin.initializeApp({
             credential: admin.credential.applicationDefault(),
             projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    }
  } catch (error: any) {
    if (error.code !== 'app/duplicate-app') {
      console.error('Firebase Admin initialization error:', error);
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
