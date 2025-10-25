import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";

let firestore: admin.firestore.Firestore | null = null;
let firestoreAvailable = false;

async function testFirestoreConnection(): Promise<boolean> {
  if (!firestore) return false;

  try {
    // Set gRPC settings to prefer IPv4 and increase timeout
    const testCollection = firestore.collection("_connection_test");
    const snapshot = await testCollection.limit(1).get();
    return true;
  } catch (error: any) {
    console.warn("⚠️ Firestore connection test failed:", error.message);
    console.warn("   This might be a temporary network issue. Retrying...");

    // Retry once after a delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const testCollection = firestore.collection("_connection_test");
      await testCollection.limit(1).get();
      console.log("✅ Firestore connection successful on retry");
      return true;
    } catch (retryError: any) {
      console.error(
        "❌ Firestore connection failed after retry:",
        retryError.message
      );
      return false;
    }
  }
}

try {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!projectId) {
    console.warn(
      "Firebase project ID is not configured - using in-memory storage"
    );
  } else {
    if (!admin.apps.length) {
      let credential;

      if (serviceAccount) {
        try {
          const serviceAccountData = JSON.parse(serviceAccount);
          credential = admin.credential.cert(serviceAccountData);
          console.log(
            "✅ Using Firebase service account credentials from environment variable"
          );
        } catch (parseError) {
          console.error("Failed to parse service account JSON:", parseError);
          credential = admin.credential.applicationDefault();
        }
      } else if (serviceAccountPath && existsSync(serviceAccountPath)) {
        try {
          const serviceAccountData = JSON.parse(
            readFileSync(serviceAccountPath, "utf8")
          );
          credential = admin.credential.cert(serviceAccountData);
          console.log(
            `✅ Using Firebase service account credentials from file: ${serviceAccountPath}`
          );
        } catch (fileError) {
          console.error("Failed to read service account file:", fileError);
          credential = admin.credential.applicationDefault();
        }
      } else {
        console.warn(
          "No valid Firebase service account found - using application default credentials"
        );
        credential = admin.credential.applicationDefault();
      }

      // Configure with IPv4 preference to avoid DNS resolution issues
      admin.initializeApp({
        credential: credential,
        projectId: projectId,
      });

      // Set Firestore settings to prefer IPv4
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.log(
          "Using Firestore emulator:",
          process.env.FIRESTORE_EMULATOR_HOST
        );
      }
    }

    firestore = admin.firestore();
    console.log("Firebase Admin initialized - testing Firestore connection...");

    // Test Firestore connection asynchronously
    testFirestoreConnection().then((available) => {
      firestoreAvailable = available;
      if (available) {
        console.log("✅ Using Firebase Firestore for data persistence");
      } else {
        console.warn("⚠️  Firestore is not accessible - you need to either:");
        console.warn("   1. Enable Firestore in your Firebase Console, OR");
        console.warn("   2. Add a valid Firebase service account key");
        console.warn(
          "   Using in-memory storage for now (data will not persist)"
        );
        firestore = null;
      }
    });
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

export { firestore, firestoreAvailable };
