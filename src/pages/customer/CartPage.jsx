import React from "react";
import { useCart } from "../../context/CartContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, UtensilsCrossed, AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";
import { formatCurrency } from "../../utils/format.js";

export default function CartPage() {
  const {
    cart,
    tableNumber,
    specialInstructions,
    setSpecialInstructions,
    addToCart,
    removeFromCart,
    deleteFromCart,
    getCartTotal,
    placeOrder
  } = useCart();

  const { settings, activeRestaurantId } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleReturnToMenu = () => {
    if (activeRestaurantId && activeRestaurantId !== "default") {
      navigate(`/menu/${activeRestaurantId}`);
    } else {
      navigate("/customer");
    }
  };

  const subtotal = getCartTotal();
  const gstRate = 0.05; // Standard 5% GST for restaurants
  const gstAmount = subtotal * gstRate;
  const totalAmount = subtotal + gstAmount;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (!tableNumber) {
      showToast("Table number is missing. Redirecting...", "error");
      handleReturnToMenu();
      return;
    }

    showToast("Submitting your order to the kitchen...", "info");
    const orderId = await placeOrder();
    
    if (orderId) {
      navigate(`/order-success/${orderId}`);
    } else {
      showToast("Failed to place your order. Please try again.", "error");
    }
  };

  return (
    <div className="container cart-page-wrapper" id="cart-page-container">
      {/* Back button */}
      <button
        className="btn btn-outline"
        onClick={handleReturnToMenu}
        style={{ marginBottom: "24px", gap: "8px" }}
        id="cart-back-btn"
      >
        <ArrowLeft size={16} />
        Back to Menu
      </button>

      <h1 className="cart-title">
        <UtensilsCrossed size={24} color="var(--primary-color)" />
        Your Order Review
      </h1>

      {cart.length > 0 ? (
        <div className="cart-grid" id="cart-content-grid">
          {/* Cart items list card */}
          <div className="card cart-items-card" id="cart-items-card-panel">
            <h2 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>Ordered Dishes</h2>
            
            <div className="cart-items-list" style={{ width: "100%", minWidth: 0 }}>
              {cart.map((item) => (
                <div className="cart-item-row" key={item.id} id={`cart-item-row-${item.id}`}>
                  <div className="cart-item-details" style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div className="cart-item-name" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                      {item.isVeg ? (
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--status-veg)", flexShrink: 0 }}></span>
                      ) : (
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--status-nonveg)", flexShrink: 0 }}></span>
                      )}
                      <span>{item.name}</span>
                    </div>
                    <div className="cart-item-subprice">
                      {formatCurrency(item.price)} x {item.quantity}
                    </div>
                  </div>

                  <div className="flex align-center gap-2" style={{ flexShrink: 0 }}>
                    {/* Quantity controls */}
                    <div className="quantity-selector">
                      <button className="qty-btn" onClick={() => removeFromCart(item.id)}>-</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                    </div>

                    {/* Delete Item */}
                    <button
                      className="btn-icon"
                      onClick={() => deleteFromCart(item.id)}
                      style={{ borderColor: "rgba(239,68,68,0.2)", color: "var(--status-cancelled)", width: "32px", height: "32px" }}
                      title="Remove Item"
                      id={`delete-cart-item-${item.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Special cooking instructions text area */}
            <div style={{ marginTop: "32px" }}>
              <label
                className="input-label"
                htmlFor="cooking-notes-textarea"
                style={{ marginBottom: "8px", display: "block" }}
              >
                Special Cooking Instructions (Optional)
              </label>
              <textarea
                id="cooking-notes-textarea"
                className="input-field"
                placeholder="e.g. Make it extra spicy, serve without onions, extra napkins, etc."
                rows="3"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                style={{ resize: "none", fontFamily: "inherit" }}
              ></textarea>
            </div>
          </div>

          {/* Cart Pricing summary and Place Order Card */}
          <div className="card cart-summary-card" id="cart-summary-card-panel">
            <h2 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>Order Summary</h2>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Table Number</span>
                <span style={{ fontWeight: "700", color: "var(--primary-color)" }}>Table {tableNumber}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>GST / Tax (5%)</span>
                <span>{formatCurrency(gstAmount)}</span>
              </div>
              
              <div className="summary-total">
                <span>Total Payable</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", marginTop: "24px", fontSize: "1.05rem" }}
              onClick={handlePlaceOrder}
              id="place-order-submit-btn"
            >
              Send to Kitchen (Place Order)
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state card" id="cart-empty-panel">
          <AlertCircle size={48} style={{ color: "var(--text-muted)" }} />
          <h2 className="empty-state-title">Your cart is empty</h2>
          <p className="empty-state-desc">
            You haven't selected any items yet. Head back to our delicious menu and start adding food!
          </p>
          <button
            className="btn btn-primary"
            onClick={handleReturnToMenu}
            style={{ marginTop: "16px" }}
            id="cart-empty-go-back-btn"
          >
            Browse Food Menu
          </button>
        </div>
      )}
    </div>
  );
}
