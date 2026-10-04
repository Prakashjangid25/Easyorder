import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, firebaseConfig } from "./firebase.js";

const SUPER_ADMIN_EMAIL = "superadmin@easyorder.com";
const SUPER_ADMIN_PASSWORD = "SuperAdmin@2026";

/**
 * Auto-creates the super admin account on app startup if it doesn't exist.
 * Uses a secondary Firebase app instance to avoid signing out any existing session.
 */
export async function initializeSuperAdmin() {
  try {
    // Check if super admin already exists in Firestore
    const userDoc = await getDoc(doc(db, "users", "superadmin"));
    if (userDoc.exists()) {
      console.log("Super admin account already exists.");
      return;
    }

    // Create super admin auth user on a secondary app instance
    const secondaryAppName = `InitSuperAdmin_${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_PASSWORD
      );
      const uid = userCredential.user.uid;

      // Save super admin role in Firestore
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        email: SUPER_ADMIN_EMAIL,
        role: "superadmin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log("Super admin account created successfully!");
      console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
      console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
    } catch (authError) {
      if (authError.code === "auth/email-already-in-use") {
        console.log("Super admin auth account already exists.");
      } else {
        console.error("Error creating super admin auth:", authError);
      }
    } finally {
      // Clean up secondary app
      await signOut(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  } catch (error) {
    console.error("Error initializing super admin:", error);
  }
}
