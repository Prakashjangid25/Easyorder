import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { handleFirestoreError, OperationType } from "../firebase/errorHandler.js";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("easyorder-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [tableNumber, setTableNumberState] = useState(() => {
    return sessionStorage.getItem("easyorder-table") || "";
  });

  const [isTableConfirmed, setIsTableConfirmed] = useState(() => {
    return !!sessionStorage.getItem("easyorder-table");
  });

  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    localStorage.setItem("easyorder-cart", JSON.stringify(cart));
  }, [cart]);

  const setTableNumber = (table) => {
    setTableNumberState(table);
    sessionStorage.setItem("easyorder-table", table);
  };

  const clearTableNumber = () => {
    setTableNumberState("");
    setIsTableConfirmed(false);
    sessionStorage.removeItem("easyorder-table");
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (!existingItem) return prevCart;
      
      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const deleteFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSpecialInstructions("");
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0 || !tableNumber) return null;

    try {
      const batch = writeBatch(db);
      
      // 1. Create a reference for the new Order
      const orderRef = doc(collection(db, "orders"));
      const orderId = orderRef.id;

      const orderDate = new Date();
      const orderData = {
        id: orderId,
        tableNumber: tableNumber,
        status: "pending",
        customerNotes: specialInstructions,
        totalAmount: getCartTotal(),
        createdAt: orderDate.toISOString(),
        orderDate: orderDate.toLocaleDateString(),
        orderTime: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isVeg: item.isVeg || false
        })),
        timestamp: serverTimestamp()
      };

      // Set order document in batch
      batch.set(orderRef, orderData);

      // 2. Add each ordered item to the 'orderItems' collection for full CRUD compliance
      cart.forEach((item) => {
        const itemRef = doc(collection(db, "orderItems"));
        batch.set(itemRef, {
          id: itemRef.id,
          orderId: orderId,
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          createdAt: orderDate.toISOString()
        });
      });

      // Commit the batch write
      await batch.commit();

      // Clear the cart
      clearCart();
      return orderId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "orders");
      return null;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        tableNumber,
        isTableConfirmed,
        setIsTableConfirmed,
        specialInstructions,
        setSpecialInstructions,
        setTableNumber,
        clearTableNumber,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearCart,
        getCartCount,
        getCartTotal,
        placeOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
