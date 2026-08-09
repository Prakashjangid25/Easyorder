import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { handleFirestoreError, OperationType } from "../firebase/errorHandler.js";

const SettingsContext = createContext();

export const defaultSettings = {
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

export function SettingsProvider({ children }) {
  const [activeRestaurantId, setActiveRestaurantIdState] = useState(() => {
    return localStorage.getItem("activeAdminRestaurantId") || sessionStorage.getItem("easyorder-restaurant-id") || null;
  });
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const setActiveRestaurantId = (id) => {
    setActiveRestaurantIdState(id);
    if (id) {
      localStorage.setItem("activeAdminRestaurantId", id);
      sessionStorage.setItem("easyorder-restaurant-id", id);
    } else {
      localStorage.removeItem("activeAdminRestaurantId");
      sessionStorage.removeItem("easyorder-restaurant-id");
    }
  };

  useEffect(() => {
    if (!activeRestaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const settingsRef = doc(db, "restaurants", activeRestaurantId, "settings", "restaurant");

    const unsubscribe = onSnapshot(
      settingsRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings({ ...defaultSettings, ...data });

          if (data.primaryColor) {
            document.documentElement.style.setProperty("--primary-color", data.primaryColor);
          }
          if (data.secondaryColor) {
            document.documentElement.style.setProperty("--secondary-color", data.secondaryColor);
          }
          setLoading(false);
        } else {
          // Fallback to reading the restaurant doc directly if settings doc isn't created yet
          const resRef = doc(db, "restaurants", activeRestaurantId);
          onSnapshot(resRef, (resSnap) => {
            if (resSnap.exists()) {
              const resData = resSnap.data();
              const merged = {
                ...defaultSettings,
                restaurantName: resData.name || defaultSettings.restaurantName,
                restaurantLogo: resData.logo || defaultSettings.restaurantLogo,
                restaurantBanner: resData.banner || defaultSettings.restaurantBanner,
                primaryColor: resData.primaryColor || defaultSettings.primaryColor,
                secondaryColor: resData.secondaryColor || defaultSettings.secondaryColor,
                phone: resData.phone || defaultSettings.phone,
                address: resData.address || defaultSettings.address
              };
              setSettings(merged);
              if (resData.primaryColor) {
                document.documentElement.style.setProperty("--primary-color", resData.primaryColor);
              }
              if (resData.secondaryColor) {
                document.documentElement.style.setProperty("--secondary-color", resData.secondaryColor);
              }
            }
            setLoading(false);
          }, () => setLoading(false));
        }
      },
      (error) => {
        console.error("Error fetching settings for restaurant", activeRestaurantId, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeRestaurantId]);

  const updateSettings = async (newSettings, targetRestaurantId = activeRestaurantId) => {
    if (!targetRestaurantId) return;
    try {
      const settingsRef = doc(db, "restaurants", targetRestaurantId, "settings", "restaurant");
      await setDoc(settingsRef, newSettings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "settings");
    }
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        loading, 
        activeRestaurantId, 
        setActiveRestaurantId, 
        updateSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
