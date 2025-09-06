
import * as admin from 'firebase-admin';

function parseServiceAccount(): admin.ServiceAccount {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error('The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. It should contain the JSON of your service account or a path to the file.');
    }
    try {
        // Try parsing the variable as a JSON object first.
        return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    } catch (e) {
        // If parsing fails, assume it's a file path.
        // This is not applicable in Vercel's environment, but good for local testing.
        // In Vercel, the string should be the JSON content itself.
        console.warn("Could not parse GOOGLE_APPLICATION_CREDENTIALS as JSON. This is expected if it's a file path, but in Vercel, it should be the JSON content.");
        // If you were running locally with a path, you'd use:
        // return require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        // But for Vercel, the JSON content is required. The error likely means the env var is not set correctly.
        throw new Error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS. Ensure it is the full JSON object in your Vercel environment variables.');
    }
}


// This function initializes the Firebase Admin SDK and returns the Firestore database instance.
// It's designed to be a singleton, meaning it will only initialize the app once.
export function getAdminDb() {
  // If the app is already initialized, return the existing Firestore instance.
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  // Check if the required environment variables are set.
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('The NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is not set.');
  }

  const serviceAccount = parseServiceAccount();

  // Initialize the Firebase Admin app.
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  // Return the Firestore database instance.
  return admin.firestore();
}
