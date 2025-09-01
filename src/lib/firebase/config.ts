// This file constructs the Firebase configuration object for the client-side app.
// It relies on NEXT_PUBLIC_ environment variables, which are exposed to the browser.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// A simple check to give a warning during development if the project ID is missing.
if (process.env.NODE_ENV !== 'production' && !firebaseConfig.projectId) {
  console.warn(
    `[Firebase] NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. Please set it in your .env.local file for local development.`
  );
}
