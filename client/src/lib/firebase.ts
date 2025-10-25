import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Firebase integration - configuration setup
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Check if all required environment variables are present
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

// Only initialize Firebase if all environment variables are present
if (missingVars.length === 0) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    googleProvider.setCustomParameters({
      prompt: "select_account",
    });

    console.log("Firebase initialized successfully - Google Sign-In available");
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
  }
} else {
  // Firebase not configured - Google Sign-In will not be available
  console.log(
    "Firebase not configured - using email/password authentication only"
  );
}

export { auth, googleProvider };
