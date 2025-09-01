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

if (missingVars.length > 0 && process.env.NODE_ENV !== 'production') {
  console.warn(
    `[Firebase] Missing environment variables from .env.local: ${missingVars.join(
      ', '
    )}. Falling back to hardcoded values for development.`
  );
}

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBn63Dp1eXlDJPQgK-E2ltyaR-HUUj_KDU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "logistics-flow-dp1gz.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "logistics-flow-dp1gz",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "logistics-flow-dp1gz.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "440587721618",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:440587721618:web:c54541af217589361b7f4b"
};

// Final check to ensure the config object is valid before export
if (!firebaseConfig.projectId) {
  throw new Error("Firebase config is not valid. Project ID is missing.");
}
