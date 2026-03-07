import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId:      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

// Only initialise when all required config values are present.
// In demo mode (no env vars) the auth object will be undefined and the
// auth context falls back to a guest-only experience.
const isConfigured = Object.values(firebaseConfig).every(Boolean);

if (isConfigured) {
  app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // Provide a typed placeholder so the rest of the code compiles cleanly.
  app  = {} as FirebaseApp;
  auth = {} as Auth;
}

export { app, auth, isConfigured };
