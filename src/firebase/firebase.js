import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGphhJTmZ37RpHFTEQZrRXa-xXuEXBor0",
  authDomain: "easy-order-e6a5f.firebaseapp.com",
  projectId: "easy-order-e6a5f",
  storageBucket: "easy-order-e6a5f.firebasestorage.app",
  messagingSenderId: "53944867113",
  appId: "1:53944867113:web:d8fcc8b8c5097b3c617f38",
  measurementId: "G-3C9Q33VPT8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Storage (optional, fallback to base64 images is also supported)
export const storage = getStorage(app);

// Validate Connection to Firestore (as requested in Firebase Integration guidelines)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is offline. Please check your network or configuration.");
    } else {
      console.log("Firebase connection checked.");
    }
  }
}

testConnection();

export default app;
