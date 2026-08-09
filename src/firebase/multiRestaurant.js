import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch
} from "firebase/firestore";
import { db, firebaseConfig } from "./firebase.js";
import { handleFirestoreError, OperationType } from "./errorHandler.js";

export const DEFAULT_SETTINGS = {
  restaurantName: "My Restaurant",
  restaurantLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
  restaurantBanner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
  primaryColor: "#e63946",
  secondaryColor: "#457b9d",
  darkModeLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
  address: "123 Gourmet Street",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  instagram: "my_restaurant",
  openingTime: "09:00",
  closingTime: "22:00",
  isOpen: true,
  footerText: "We cook with love and serve with passion.",
  copyright: "© 2026 EasyOrder. All rights reserved."
};

/**
 * Creates a real Firebase Auth user on a secondary Firebase app instance
 * so that the currently logged-in Super Admin session is NEVER disturbed or signed out.
 */
export async function createRestaurantAuthUser(email, password) {
  if (!email || !email.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const secondaryAppName = `SecondaryAuth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password
    );
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    return uid;
  } catch (error) {
    await deleteApp(secondaryApp).catch(() => {});
    if (error.code === "auth/email-already-in-use") {
      throw new Error("This email is already registered.");
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email format.");
    }
    if (error.code === "auth/weak-password") {
      throw new Error("Password is too weak. Must be at least 6 characters.");
    }
    throw new Error(error.message || "Failed to create Firebase Auth account.");
  }
}

/**
 * Get a specific restaurant by ID
 */
export async function getRestaurant(restaurantId) {
  if (!restaurantId) return null;
  try {
    const resRef = doc(db, "restaurants", restaurantId);
    const snap = await getDoc(resRef);

    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }

    return null;
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }
}

/**
 * Find restaurant associated with authenticated user UID or Email
 */
export async function getRestaurantByUidOrEmail(uid, email) {
  try {
    // 1. Direct check in users collection doc
    if (uid) {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        if (uData.restaurantId) {
          const res = await getRestaurant(uData.restaurantId);
          if (res) {
            if (!res.adminUid) {
              await updateDoc(doc(db, "restaurants", res.id), { adminUid: uid }).catch(() => {});
              res.adminUid = uid;
            }
            return res;
          }
        }
      }
    }

    // 2. Scan all restaurants for adminUid or adminEmail
    const list = await getAllRestaurants();

    if (uid) {
      const foundByUid = list.find((r) => r.adminUid === uid);
      if (foundByUid) return foundByUid;
    }

    if (email) {
      const lowerEmail = email.toLowerCase().trim();
      const foundByEmail = list.find(
        (r) => r.adminEmail && r.adminEmail.toLowerCase().trim() === lowerEmail
      );
      if (foundByEmail) {
        if (uid && !foundByEmail.adminUid) {
          try {
            await updateDoc(doc(db, "restaurants", foundByEmail.id), { adminUid: uid });
            foundByEmail.adminUid = uid;
          } catch (e) {
            console.warn("Could not auto-bind adminUid to restaurant:", e);
          }
        }
        return foundByEmail;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding restaurant for user:", error);
    return null;
  }
}

/**
 * Get all registered restaurants (Super Admin)
 */
export async function getAllRestaurants() {
  try {
    const snap = await getDocs(collection(db, "restaurants"));
    const list = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (error) {
    console.error("Error fetching all restaurants:", error);
    return [];
  }
}

/**
 * Create a new restaurant with real Firebase Auth account, default starter menu & settings
 */
export async function createRestaurant(data) {
  try {
    const adminEmail = data.adminEmail ? data.adminEmail.trim() : "";
    const adminPassword = data.adminPassword ? data.adminPassword.trim() : "";

    if (!data.name || !data.name.trim()) {
      throw new Error("Restaurant name is required.");
    }
    if (!adminEmail) {
      throw new Error("Admin email is required.");
    }
    if (!adminPassword || adminPassword.length < 6) {
      throw new Error("Admin password must be at least 6 characters long.");
    }

    // 1. Check if restaurant with this email already exists in Firestore
    const allRestaurants = await getAllRestaurants();
    const existingByEmail = allRestaurants.find(
      (r) => r.adminEmail && r.adminEmail.toLowerCase() === adminEmail.toLowerCase()
    );
    if (existingByEmail) {
      throw new Error("This email is already registered.");
    }

    // 2. Create REAL Firebase Auth Account using secondary auth app so Super Admin is NOT signed out
    const adminUid = await createRestaurantAuthUser(adminEmail, adminPassword);

    // 3. Generate clean slug & restaurant ID
    const baseSlug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    let restaurantId = baseSlug;
    if (allRestaurants.some((r) => r.id === restaurantId)) {
      restaurantId = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Save Restaurant Document in Firestore with adminUid (NO plain password)
    const resRef = doc(db, "restaurants", restaurantId);
    const resData = {
      id: restaurantId,
      name: data.name.trim(),
      slug: restaurantId,
      adminEmail: adminEmail,
      adminUid: adminUid,
      phone: data.phone || "+91 98765 43210",
      address: data.address || "123 Food Street",
      logo: data.logo || DEFAULT_SETTINGS.restaurantLogo,
      banner: data.banner || DEFAULT_SETTINGS.restaurantBanner,
      status: data.status || "active",
      primaryColor: data.primaryColor || "#e63946",
      secondaryColor: data.secondaryColor || "#457b9d",
      createdAt: new Date().toISOString()
    };

    await setDoc(resRef, resData);

    // 5. Save user record in `users/{adminUid}`
    try {
      await setDoc(doc(db, "users", adminUid), {
        uid: adminUid,
        email: adminEmail,
        role: "admin",
        restaurantId: restaurantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (uErr) {
      console.warn("Could not write users doc:", uErr);
    }

    // 6. Create default settings document
    const settingsRef = doc(db, "restaurants", restaurantId, "settings", "restaurant");
    await setDoc(settingsRef, {
      ...DEFAULT_SETTINGS,
      restaurantName: data.name.trim(),
      restaurantLogo: resData.logo,
      restaurantBanner: resData.banner,
      phone: resData.phone,
      address: resData.address,
      primaryColor: resData.primaryColor,
      secondaryColor: resData.secondaryColor
    });

    // 7. Create starter categories
    const starterCategories = [
      { id: "starters", name: "Starters & Appetizers", sortOrder: 1 },
      { id: "mains", name: "Main Course", sortOrder: 2 },
      { id: "beverages", name: "Beverages & Drinks", sortOrder: 3 },
      { id: "desserts", name: "Desserts", sortOrder: 4 }
    ];

    const batch = writeBatch(db);
    starterCategories.forEach((cat) => {
      const catRef = doc(db, "restaurants", restaurantId, "categories", cat.id);
      batch.set(catRef, { ...cat, createdAt: new Date().toISOString() });
    });

    // Create starter products
    const starterProducts = [
      {
        id: "paneer-tikka",
        categoryId: "starters",
        name: "Paneer Tikka Grill",
        description: "Cottage cheese marinated in rich spiced yogurt, grilled in traditional tandoor.",
        price: 280,
        imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop",
        isVeg: true,
        isAvailable: true,
        isBestSeller: true,
        sortOrder: 1
      },
      {
        id: "butter-chicken",
        categoryId: "mains",
        name: "Classic Butter Chicken",
        description: "Tender chicken cooked in rich creamy tomato and butter gravy with aromatic spices.",
        price: 360,
        imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop",
        isVeg: false,
        isAvailable: true,
        isBestSeller: true,
        sortOrder: 2
      },
      {
        id: "mango-lassi",
        categoryId: "beverages",
        name: "Fresh Mango Lassi",
        description: "Refreshing sweet churned yogurt drink blended with fresh Alphonso mango pulp.",
        price: 120,
        imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop",
        isVeg: true,
        isAvailable: true,
        isBestSeller: false,
        sortOrder: 3
      }
    ];

    starterProducts.forEach((prod) => {
      const prodRef = doc(db, "restaurants", restaurantId, "products", prod.id);
      batch.set(prodRef, { ...prod, createdAt: new Date().toISOString() });
    });

    // Create starter tables
    const starterTables = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5"];
    starterTables.forEach((tableName, idx) => {
      const tableId = `table-${idx + 1}`;
      const tableRef = doc(db, "restaurants", restaurantId, "tables", tableId);
      batch.set(tableRef, {
        id: tableId,
        name: tableName,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    });

    await batch.commit();

    return resData;
  } catch (error) {
    console.error("Error creating restaurant:", error);
    throw error;
  }
}

/**
 * Update restaurant data
 */
export async function updateRestaurant(restaurantId, updates) {
  try {
    const resRef = doc(db, "restaurants", restaurantId);
    await updateDoc(resRef, updates);

    // If updating primary/secondary colors or name, also update settings doc
    if (updates.name || updates.primaryColor || updates.secondaryColor || updates.logo) {
      const settingsRef = doc(db, "restaurants", restaurantId, "settings", "restaurant");
      const setUpdates = {};
      if (updates.name) setUpdates.restaurantName = updates.name;
      if (updates.primaryColor) setUpdates.primaryColor = updates.primaryColor;
      if (updates.secondaryColor) setUpdates.secondaryColor = updates.secondaryColor;
      if (updates.logo) setUpdates.restaurantLogo = updates.logo;
      await setDoc(settingsRef, setUpdates, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}`);
  }
}

/**
 * Delete a restaurant
 */
export async function deleteRestaurant(restaurantId) {
  try {
    const resRef = doc(db, "restaurants", restaurantId);
    await deleteDoc(resRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `restaurants/${restaurantId}`);
  }
}

/**
 * Helper to get proper Firestore collection path for a restaurant
 */
export function getRestaurantCollectionPath(restaurantId, subCollectionName) {
  if (!restaurantId) {
    throw new Error(`restaurantId is required to access ${subCollectionName}`);
  }
  return `restaurants/${restaurantId}/${subCollectionName}`;
}
