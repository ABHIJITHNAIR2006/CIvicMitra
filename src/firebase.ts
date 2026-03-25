import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, getDocFromServer, getDoc, doc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfigJson from "../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

console.log("SIMPLE FIREBASE CONFIG:", {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
export const storage = getStorage(app);

// Connection test
async function testConnection() {
  try {
    console.log("Starting Firestore connection test...");
    const testDoc = doc(db, 'connection_test', 'ping');
    await getDoc(testDoc);
    console.log("Firestore connection test successful.");
  } catch (error: any) {
    console.error("Firestore connection error:", error.message);
    if (error.message.includes('permission')) {
      console.error("Permission denied for connection_test. Current Auth:", auth.currentUser?.uid || "Not logged in");
    }
  }
}

testConnection();
