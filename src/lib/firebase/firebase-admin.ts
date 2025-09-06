import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK and returns the Firestore database instance.
// It's designed to be a singleton, meaning it will only initialize the app once.
export function getAdminDb() {
  // If the app is already initialized, return the existing Firestore instance.
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  // Check if the required environment variables are set.
  // GOOGLE_APPLICATION_CREDENTIALS should contain the raw JSON content of the service account file.
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. It should contain the JSON of your service account.');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('The NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set.');
  }

  // Parse the credentials from the environment variable.
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  // Initialize the Firebase Admin app.
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  // Return the Firestore database instance.
  return admin.firestore();
}
