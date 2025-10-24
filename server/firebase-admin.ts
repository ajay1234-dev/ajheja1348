import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";

let firestore: admin.firestore.Firestore | null = null;
let storage: admin.storage.Storage | null = null;
let firestoreAvailable = false;
let storageAvailable = false;

async function testFirestoreConnection(): Promise<boolean> {
  if (!firestore) return false;

  try {
    // Try a simple operation to test if Firestore is actually accessible
    const testCollection = firestore.collection("_connection_test");
    await testCollection.limit(1).get();
    return true;
  } catch (error: any) {
    console.warn("Firestore connection test failed:", error.message);
    return false;
  }
}

async function testStorageConnection(): Promise<boolean> {
  if (!storage) return false;

  try {
    // Try to get the bucket to test if Storage is accessible
    const bucket = storage.bucket();
    await bucket.exists();
    return true;
  } catch (error: any) {
    console.warn("Firebase Storage connection test failed:", error.message);
    return false;
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

      admin.initializeApp({
        credential: credential,
        projectId: projectId,
        storageBucket: `${projectId}.appspot.com`,
      });
    }

    firestore = admin.firestore();
    storage = admin.storage();
    console.log("Firebase Admin initialized - testing connections...");

    // Test Firestore connection asynchronously
    testFirestoreConnection().then((available) => {
      firestoreAvailable = available;
      if (available) {
        console.log("✅ Firestore is accessible and ready");
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

    // Test Storage connection asynchronously
    testStorageConnection().then((available) => {
      storageAvailable = available;
      if (available) {
        console.log("✅ Firebase Storage is accessible and ready");
      } else {
        console.warn("⚠️  Firebase Storage is not accessible");
        console.warn(
          "   Please enable Firebase Storage in your Firebase Console:"
        );
        console.warn("   1. Go to https://console.firebase.google.com");
        console.warn("   2. Select your project: medanalysis-471e2");
        console.warn("   3. Go to Storage and click 'Get Started'");
        console.warn("   4. Set up security rules for Storage");
      }
    });
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

export { firestore, storage, firestoreAvailable, storageAvailable };
