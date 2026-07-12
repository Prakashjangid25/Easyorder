import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { Check, ArrowLeft, Clock, ShoppingBag, PhoneCall } from "lucide-react";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const { clearTableNumber, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;

    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const orderData = docSnap.data();
          setOrder(orderData);
          if (orderData.status === "completed" || orderData.status === "cancelled") {
            clearTableNumber();
          }
        } else {
          console.error("No such order found!");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to order:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "100px 0" }}>
        <div className="skeleton" style={{ width: "80px", height: "80px", borderRadius: "50%", margin: "0 auto 24px" }}></div>
        <div className="skeleton" style={{ width: "200px", height: "24px", margin: "0 auto 16px", borderRadius: "4px" }}></div>
        <div className="skeleton" style={{ width: "300px", height: "16px", margin: "0 auto", borderRadius: "4px" }}></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "100px 0" }}>
        <h2>Order Not Found</h2>
        <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
          We couldn't retrieve the details for Order ID: {orderId}.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Return to Menu
        </button>
      </div>
    );
  }

  // Determine active step index for timeline
  // Statuses: pending, preparing, ready, completed, cancelled
  const statuses = ["pending", "preparing", "ready", "completed"];
  const currentStatusIndex = statuses.indexOf(order.status);

  const getStepClass = (stepIndex) => {
    if (order.status === "cancelled") return "timeline-step";
    if (currentStatusIndex > stepIndex) return "timeline-step completed";
    if (currentStatusIndex === stepIndex) return "timeline-step active";
    return "timeline-step";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Order Received";
      case "preparing":
        return "Cooking Food";
      case "ready":
        return "Ready to Serve";
      case "completed":
        return "Served & Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div className="container" id="order-success-page-container" style={{ paddingTop: "32px", paddingBottom: "80px" }}>
      {/* Action buttons */}
      <div className="flex justify-between align-center flex-wrap gap-2" style={{ marginBottom: "24px" }} id="success-buttons-group">
        <button
          className="btn btn-outline"
          onClick={() => navigate("/")}
          style={{ gap: "8px" }}
          id="success-back-btn"
        >
          <ArrowLeft size={16} />
          Order More Food
        </button>

        <button
          className="btn btn-primary"
          onClick={() => {
            if (window.confirm("Are you sure you want to finish dining? This will clear your current table session.")) {
              clearTableNumber();
              clearCart();
              navigate("/");
            }
          }}
          style={{ gap: "8px", backgroundColor: "var(--primary-color)", border: "none", color: "#ffffff" }}
          id="success-finish-dining-btn"
        >
          Finish Dining
        </button>
      </div>

      {/* Main Success Checkmark Block */}
      <div className="success-container" id="order-success-header-panel">
        <div className="success-icon-box">
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-message">
          Your order has been sent directly to the kitchen. Below is your live status tracker.
          Do not close this page during your visit!
        </p>

        {/* Real-time Order Stats */}
        <div
          className="flex justify-between flex-wrap gap-3"
          style={{
            width: "100%",
            maxWidth: "600px",
            borderTop: "1px solid var(--border-color)",
            paddingTop: "24px",
            textAlign: "left"
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Order ID</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: "600" }}>#{order.id.slice(-8).toUpperCase()}</div>
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Table</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--primary-color)" }}>Table {order.tableNumber}</div>
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Live Status</span>
            <div>
              <span className={`status-badge status-${order.status}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Tracker Timeline */}
      <div className="card order-status-card" id="success-tracking-timeline-panel" style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Cooking Progress</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          The chef is preparing your meal. Watch the progress bar update in real-time below.
        </p>

        {order.status === "cancelled" ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--status-cancelled)" }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "700" }}>This Order was Cancelled</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
              Please call our staff if you believe this is an error or to arrange a refund/re-order.
            </p>
          </div>
        ) : (
          <div className="timeline" id="live-timeline-graphic">
            <div className={getStepClass(0)}>
              <div className="timeline-node">1</div>
              <div className="timeline-label">Order Received</div>
            </div>
            <div className={getStepClass(1)}>
              <div className="timeline-node">2</div>
              <div className="timeline-label">Cooking</div>
            </div>
            <div className={getStepClass(2)}>
              <div className="timeline-node">3</div>
              <div className="timeline-label">Ready</div>
            </div>
            <div className={getStepClass(3)}>
              <div className="timeline-node">4</div>
              <div className="timeline-label">Served</div>
            </div>
          </div>
        )}

        {/* Estimated wait banner */}
        {order.status !== "cancelled" && order.status !== "completed" && (
          <div
            className="flex align-center gap-2"
            style={{
              marginTop: "40px",
              padding: "16px",
              backgroundColor: "var(--surface-hover)",
              borderRadius: "8px",
              fontSize: "0.9rem",
              color: "var(--text-secondary)"
            }}
          >
            <Clock size={16} color="var(--primary-color)" />
            <span>
              {order.status === "pending"
                ? "Waiting for kitchen confirmation (approx. 2-3 mins)"
                : "Cooking: Your delicious food is sizzling! Estimated wait is 10-15 mins."}
            </span>
          </div>
        )}
      </div>

      {/* Order Item Details and Receipt summary */}
      <div className="card" id="success-order-items-summary-panel">
        <h2 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>Ordered Items Summary</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {order.items?.map((item, index) => (
            <div
              key={index}
              className="flex justify-between align-center"
              style={{
                paddingBottom: "12px",
                borderBottom: index === order.items.length - 1 ? "none" : "1px solid var(--border-color)"
              }}
            >
              <div className="flex align-center gap-2">
                <span
                  style={{
                    display: "inline-block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: item.isVeg ? "var(--status-veg)" : "var(--status-nonveg)"
                  }}
                ></span>
                <span style={{ fontWeight: "600" }}>{item.name}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>x{item.quantity}</span>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: "600" }}>
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {order.customerNotes && (
          <div style={{ marginTop: "20px", borderTop: "1px dashed var(--border-color)", paddingTop: "16px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>YOUR NOTES TO KITCHEN</span>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px", fontStyle: "italic" }}>
              "{order.customerNotes}"
            </p>
          </div>
        )}

        <div
          className="flex justify-between"
          style={{
            marginTop: "24px",
            borderTop: "2px solid var(--border-color)",
            paddingTop: "16px",
            fontSize: "1.2rem",
            fontWeight: "700",
            fontFamily: "var(--font-display)"
          }}
        >
          <span>Total Paid</span>
          <span style={{ color: "var(--primary-color)" }}>${Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>

      {/* Call Server / Assistance info */}
      <div
        className="flex align-center justify-between flex-wrap gap-2"
        style={{
          marginTop: "24px",
          padding: "16px 24px",
          backgroundColor: "rgba(69, 123, 157, 0.05)",
          border: "1px solid rgba(69, 123, 157, 0.15)",
          borderRadius: "12px"
        }}
      >
        <div className="flex align-center gap-2">
          <PhoneCall size={18} color="var(--secondary-color)" />
          <div style={{ fontSize: "0.9rem" }}>
            <span style={{ fontWeight: "600" }}>Need assistance or want to order offline?</span>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Call our server or call us at {settings.phone}</div>
          </div>
        </div>
        <a href={`tel:${settings.phone}`} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "20px" }}>
          Call Restaurant
        </a>
      </div>
    </div>
  );
}
