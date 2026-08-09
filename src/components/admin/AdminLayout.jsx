import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { playNewOrderChime, initAudioOnUserGesture } from "../../utils/audio.js";
import AdminSidebar from "../../pages/admin/AdminSidebar.jsx";
import { Bell, ShoppingBag, X, ArrowRight, Volume2 } from "lucide-react";

export default function AdminLayout({ children }) {
  const { activeRestaurantId, settings } = useSettings();
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const knownOrdersRef = useRef(new Set());
  const isInitialSnapshotRef = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize Web Audio API on first user interaction anywhere in the layout
  useEffect(() => {
    const handleGesture = () => {
      initAudioOnUserGesture();
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };

    window.addEventListener("click", handleGesture);
    window.addEventListener("keydown", handleGesture);
    window.addEventListener("touchstart", handleGesture);

    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, []);

  // Global Real-time Order Listener across all admin pages
  useEffect(() => {
    if (!activeRestaurantId) return;

    isInitialSnapshotRef.current = true;
    knownOrdersRef.current.clear();

    const ordersColPath = `restaurants/${activeRestaurantId}/orders`;
    const q = query(
      collection(db, ordersColPath),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (isInitialSnapshotRef.current) {
          snapshot.forEach((doc) => {
            knownOrdersRef.current.add(doc.id);
          });
          isInitialSnapshotRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const orderId = change.doc.id;
            if (!knownOrdersRef.current.has(orderId)) {
              knownOrdersRef.current.add(orderId);
              const orderData = change.doc.data();

              // Play audible alert chime
              playNewOrderChime();

              // Trigger global UI notification popup
              setNewOrderNotification({
                id: orderId,
                tableNumber: orderData.tableNumber || "N/A",
                totalAmount: orderData.totalAmount || 0,
                itemCount: orderData.items ? orderData.items.length : 0,
                time: orderData.orderTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            }
          }
        });
      },
      (error) => {
        console.warn("Global order listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [activeRestaurantId]);

  const handleViewOrder = () => {
    setNewOrderNotification(null);
    navigate("/admin/orders");
  };

  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        {children}
      </div>

      {/* GLOBAL NEW ORDER ALERT POPUP */}
      {newOrderNotification && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            maxWidth: "380px",
            width: "calc(100vw - 48px)",
            backgroundColor: "var(--card-bg, #ffffff)",
            color: "var(--text-primary, #111827)",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
            border: "2px solid #10b981",
            padding: "20px",
            animation: "slideInRight 0.3s ease-out, pulse 2s infinite"
          }}
          id="global-order-notification-popup"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Bell className="bell-ring" size={20} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  New Order Received
                </span>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, lineHeight: "1.2" }}>
                  Table {newOrderNotification.tableNumber}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setNewOrderNotification(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px"
              }}
              title="Dismiss"
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              backgroundColor: "var(--background-color, #f9fafb)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              fontSize: "0.88rem"
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)" }}>Total: </span>
              <strong style={{ fontSize: "1rem", color: "var(--text-primary)" }}>₹{newOrderNotification.totalAmount}</strong>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              {newOrderNotification.itemCount} items • {newOrderNotification.time}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleViewOrder}
              className="btn btn-primary"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: "700",
                fontSize: "0.88rem",
                backgroundColor: "#10b981",
                borderColor: "#10b981",
                color: "#ffffff"
              }}
            >
              <ShoppingBag size={16} />
              <span>View Orders</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
