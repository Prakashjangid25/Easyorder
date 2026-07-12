import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { handleFirestoreError, OperationType } from "../firebase/errorHandler.js";

const SettingsContext = createContext();

const defaultSettings = {
  restaurantName: "EasyOrder Bistro",
  restaurantLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
  restaurantBanner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
  primaryColor: "#e63946",
  secondaryColor: "#457b9d",
  darkModeLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
  address: "123 Gourmet Street, Food City",
  phone: "+1 555-123-4567",
  whatsapp: "+1 555-123-4567",
  instagram: "easyorder_bistro",
  openingTime: "09:00",
  closingTime: "22:00",
  isOpen: true,
  footerText: "We cook with love and serve with passion.",
  copyright: "© 2026 EasyOrder. All rights reserved."
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, "settings", "restaurant");
    
    const unsubscribe = onSnapshot(
      settingsRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings({ ...defaultSettings, ...data });
          
          // Apply custom primary and secondary colors dynamically to CSS root variables!
          if (data.primaryColor) {
            document.documentElement.style.setProperty("--primary-color", data.primaryColor);
          }
          if (data.secondaryColor) {
            document.documentElement.style.setProperty("--secondary-color", data.secondaryColor);
          }
          setLoading(false);
        } else {
          // If Firestore is blank, seed default settings document
          try {
            await setDoc(settingsRef, defaultSettings);
            setSettings(defaultSettings);
            setLoading(false);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, "settings/restaurant");
          }
        }
      },
      (error) => {
        console.error("Error fetching settings:", error);
        // Fallback to defaults on permission issues
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      const settingsRef = doc(db, "settings", "restaurant");
      await setDoc(settingsRef, newSettings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "settings/restaurant");
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
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
