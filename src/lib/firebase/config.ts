// This file constructs the Firebase configuration object.

// Check if all required environment variables are defined
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// In a Vercel deployment, these variables must be set in the project settings.
// In local development, they must be in .env.local
if (missingVars.length > 0) {
  const errorMessage = `[Firebase] Missing required environment variables: ${missingVars.join(
    ', '
  )}. Please set them in your Vercel project settings or in your local .env.local file.`;
  
  // Throw an error during the build process if variables are missing
  if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
  } else {
      console.warn(errorMessage);
  }
}

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Final check to ensure the config object is valid before export
if (!firebaseConfig.projectId) {
  throw new Error("Firebase config is not valid. Project ID is missing. Check your environment variables.");
}
