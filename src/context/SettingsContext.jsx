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
  const [activeRestaurantId, setActiveRestaurantId] = useState("default");
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reference settings based on active restaurant or root fallback
    const docPath = activeRestaurantId && activeRestaurantId !== "default"
      ? `restaurants/${activeRestaurantId}/settings/restaurant`
      : "settings/restaurant";

    const settingsRef = doc(db, docPath);

    const unsubscribe = onSnapshot(
      settingsRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings({ ...defaultSettings, ...data });

          // Apply dynamic CSS variable colors
          if (data.primaryColor) {
            document.documentElement.style.setProperty("--primary-color", data.primaryColor);
          }
          if (data.secondaryColor) {
            document.documentElement.style.setProperty("--secondary-color", data.secondaryColor);
          }
          setLoading(false);
        } else {
          // If settings document doesn't exist yet, attempt to set default
          try {
            await setDoc(settingsRef, defaultSettings, { merge: true });
            setSettings(defaultSettings);
          } catch (e) {
            console.warn("Could not seed settings doc:", e);
          }
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching settings:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeRestaurantId]);

  const updateSettings = async (newSettings, targetRestaurantId = activeRestaurantId) => {
    try {
      const docPath = targetRestaurantId && targetRestaurantId !== "default"
        ? `restaurants/${targetRestaurantId}/settings/restaurant`
        : "settings/restaurant";

      const settingsRef = doc(db, docPath);
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
