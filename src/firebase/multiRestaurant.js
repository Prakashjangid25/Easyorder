import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase.js";
import { handleFirestoreError, OperationType } from "./errorHandler.js";

export const DEFAULT_RESTAURANT_ID = "default";

export const DEFAULT_SETTINGS = {
  restaurantName: "EasyOrder Bistro",
  restaurantLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
  restaurantBanner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
  primaryColor: "#e63946",
  secondaryColor: "#457b9d",
  darkModeLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
  address: "123 Gourmet Street, Food City",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  instagram: "easyorder_bistro",
  openingTime: "09:00",
  closingTime: "22:00",
  isOpen: true,
  footerText: "We cook with love and serve with passion.",
  copyright: "© 2026 EasyOrder. All rights reserved."
};

/**
 * Get a specific restaurant by ID
 */
export async function getRestaurant(restaurantId = DEFAULT_RESTAURANT_ID) {
  try {
    const resRef = doc(db, "restaurants", restaurantId);
    const snap = await getDoc(resRef);

    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }

    // Fallback if looking for default restaurant
    if (restaurantId === DEFAULT_RESTAURANT_ID) {
      // Seed default restaurant
      const defaultData = {
        id: DEFAULT_RESTAURANT_ID,
        name: "EasyOrder Bistro",
        slug: "default",
        adminEmail: "admin@easyorder.com",
        phone: "+91 98765 43210",
        address: "123 Gourmet Street, Food City",
        status: "active",
        logo: DEFAULT_SETTINGS.restaurantLogo,
        banner: DEFAULT_SETTINGS.restaurantBanner,
        primaryColor: DEFAULT_SETTINGS.primaryColor,
        secondaryColor: DEFAULT_SETTINGS.secondaryColor,
        createdAt: new Date().toISOString()
      };
      await setDoc(resRef, defaultData);
      return defaultData;
    }

    return null;
  } catch (error) {
    console.error("Error fetching restaurant:", error);
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

    // Ensure default restaurant exists
    if (!list.some(r => r.id === DEFAULT_RESTAURANT_ID)) {
      const def = await getRestaurant(DEFAULT_RESTAURANT_ID);
      if (def) list.unshift(def);
    }

    return list;
  } catch (error) {
    console.error("Error fetching all restaurants:", error);
    return [];
  }
}

/**
 * Create a new restaurant with default starter menu & settings
 */
export async function createRestaurant(data) {
  try {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const restaurantId = slug;

    const resRef = doc(db, "restaurants", restaurantId);
    const resData = {
      id: restaurantId,
      name: data.name,
      slug: slug,
      adminEmail: data.adminEmail,
      adminPassword: data.adminPassword || "admin123",
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

    // Create default settings document
    const settingsRef = doc(db, "restaurants", restaurantId, "settings", "restaurant");
    await setDoc(settingsRef, {
      ...DEFAULT_SETTINGS,
      restaurantName: data.name,
      restaurantLogo: resData.logo,
      restaurantBanner: resData.banner,
      phone: resData.phone,
      address: resData.address,
      primaryColor: resData.primaryColor,
      secondaryColor: resData.secondaryColor
    });

    // Create starter categories
    const starterCategories = [
      { id: "starters", name: "Starters & Appetizers", sortOrder: 1 },
      { id: "mains", name: "Main Course", sortOrder: 2 },
      { id: "beverages", name: "Beverages & Drinks", sortOrder: 3 },
      { id: "desserts", name: "Desserts", sortOrder: 4 }
    ];

    const batch = writeBatch(db);
    starterCategories.forEach(cat => {
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

    starterProducts.forEach(prod => {
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
    handleFirestoreError(error, OperationType.WRITE, "restaurants");
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
  if (!restaurantId || restaurantId === DEFAULT_RESTAURANT_ID) {
    // Top-level or default
    return subCollectionName;
  }
  return `restaurants/${restaurantId}/${subCollectionName}`;
}
