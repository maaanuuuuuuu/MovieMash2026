import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

type FirebaseClientServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

const requiredEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

let services: FirebaseClientServices | undefined;

function isFirebaseDisabledForUnitTests() {
  return import.meta.env.MODE === 'test' && import.meta.env.VITE_FIREBASE_TEST_ENABLED !== 'true';
}

export function hasFirebaseConfig() {
  return !isFirebaseDisabledForUnitTests() && Object.values(requiredEnv).every((value) => Boolean(value));
}

function getFirebaseOptions(): FirebaseOptions {
  return {
    apiKey: requiredEnv.VITE_FIREBASE_API_KEY,
    authDomain: requiredEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: requiredEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: requiredEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: requiredEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: requiredEnv.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
  };
}

export function getFirebaseClientServices() {
  if (!hasFirebaseConfig()) {
    return undefined;
  }

  if (!services) {
    const app = initializeApp(getFirebaseOptions());

    services = {
      app,
      auth: getAuth(app),
      firestore: initializeFirestore(app, { ignoreUndefinedProperties: true }),
    };
  }

  return services;
}
