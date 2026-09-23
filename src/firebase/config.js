import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace with your Firebase Project Configuration or set environment variables in .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoConfigKeyForTesting123456",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ca-curriculum-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ca-curriculum-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ca-curriculum-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo123456789"
};

// Check if credentials are production vs demo placeholder
export const isConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'ca-curriculum-demo'
);

let app = null;
let db = null;
let storage = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase initialization notice:', error.message);
}

export { app, db, storage };
