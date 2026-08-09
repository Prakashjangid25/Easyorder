import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Clock, Printer, CheckCircle, Ban, CookingPot, ChefHat, Search, Volume2, Calendar, FileText } from "lucide-react";
import { handleFirestoreError, OperationType } from "../../firebase/errorHandler.js";
import { formatCurrency } from "../../utils/format.js";
import { playNewOrderChime } from "../../utils/audio.js";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [highlightedOrderIds, setHighlightedOrderIds] = useState(new Set());

  const { showToast } = useToast();
  const { settings, activeRestaurantId } = useSettings();

  const knownOrderIds = useRef(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    setLoading(true);
    initialLoadDone.current = false;
    knownOrderIds.current = new Set();

    const ordersColPath = activeRestaurantId && activeRestaurantId !== "default"
      ? `restaurants/${activeRestaurantId}/orders`
      : "orders";

    // Real-time Firestore orders listener
    const q = query(collection(db, ordersColPath), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        const newOrdersToAlert = [];

        snapshot.forEach((docSnap) => {
          const orderId = docSnap.id;
          const orderData = docSnap.data();
          list.push({ id: orderId, ...orderData });

          // If this is a new order ID after initial load, trigger alerts
          if (initialLoadDone.current && !knownOrderIds.current.has(orderId)) {
            newOrdersToAlert.push({ id: orderId, ...orderData });
          }
        });

        // Initialize known IDs first so we do not alert on first load
        snapshot.forEach((docSnap) => {
          knownOrderIds.current.add(docSnap.id);
        });

        // Trigger alerts for newly received orders
        if (newOrdersToAlert.length > 0) {
          newOrdersToAlert.forEach((order, index) => {
            setTimeout(() => {
              playNewOrderChime();
            }, index * 350);

            showToast(
              "🟢 New Order Received",
              "new-order",
              `Table: ${order.tableNumber || "N/A"}\n\nPlease review the new order.`
            );

            setHighlightedOrderIds((prev) => {
              const next = new Set(prev);
              next.add(order.id);
              return next;
            });

            setTimeout(() => {
              setHighlightedOrderIds((prev) => {
                const next = new Set(prev);
                next.delete(order.id);
                return next;
              });
            }, 6000);
          });
        }

        setOrders(list);
        initialLoadDone.current = true;
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "orders");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeRestaurantId, showToast]);

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      const docPath = activeRestaurantId && activeRestaurantId !== "default"
        ? `restaurants/${activeRestaurantId}/orders/${orderId}`
        : `orders/${orderId}`;

      const orderRef = doc(db, docPath);
      await updateDoc(orderRef, { status: nextStatus });
      showToast(`Order status updated to: ${nextStatus.toUpperCase()}`, "success");

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === "all" || o.status === activeTab;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tableNumber && o.tableNumber.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerNotes && o.customerNotes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="admin-content-area" id="admin-orders-content">
        <div className="dashboard-header" id="admin-orders-header">
          <div>
            <h1 style={{ fontSize: "2rem" }}>
              {settings.restaurantName ? `${settings.restaurantName} - Live Orders` : "Live Kitchen Console"}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Approve pending orders, update cooking queues, and print chef receipts.
            </p>
          </div>

          <button className="btn btn-outline" onClick={playNewOrderChime} style={{ gap: "8px" }}>
            <Volume2 size={16} /> Test Chime
          </button>
        </div>

        {/* Console Filters Tab bar & Search */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            marginBottom: "24px",
            flexWrap: "wrap"
          }}
        >
          <div className="admin-filters">
            {["all", "pending", "preparing", "ready", "completed", "cancelled"].map((tab) => (
              <button
                key={tab}
                className={`filter-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
                style={{ textTransform: "capitalize" }}
              >
                {tab === "all" ? "All Orders" : tab}
              </button>
            ))}
          </div>

          <div className="input-with-icon-wrapper" style={{ maxWidth: "300px" }}>
            <Search size={16} className="input-with-icon-left" />
            <input
              type="text"
              className="search-input search-input-with-icon"
              placeholder="Search table or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ borderRadius: "30px", fontSize: "0.85rem" }}
            />
          </div>
        </div>

        {/* Orders Queue Dashboard */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.1fr", gap: "24px", alignItems: "start" }}>
          {/* Order selection grid cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} id="orders-list-panel">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((o) => {
                const isSelected = selectedOrder && selectedOrder.id === o.id;
                const isNew = o.status === "pending";
                const isHighlighted = highlightedOrderIds.has(o.id);

                return (
                  <div
                    key={o.id}
                    className={`card card-hover ${isSelected ? "selected-active-card" : ""} ${isHighlighted ? "new-order-highlight-card" : ""}`}
                    onClick={() => setSelectedOrder(o)}
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      borderLeft: isNew ? "5px solid var(--status-pending)" : isSelected ? "5px solid var(--primary-color)" : "1px solid var(--border-color)",
                      animation: isHighlighted ? "none" : isNew ? "pulse 2s infinite" : "none",
                      backgroundColor: "var(--surface-color)"
                    }}
                    id={`order-card-${o.id}`}
                  >
                    <div className="flex justify-between align-center">
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          #{o.id.slice(-8).toUpperCase()}
                        </div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                          Table {o.tableNumber}
                          {isHighlighted && (
                            <span style={{
                              backgroundColor: "var(--status-completed, #10b981)",
                              color: "#ffffff",
                              fontSize: "0.65rem",
                              fontWeight: "800",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}>
                              NEW
                            </span>
                          )}
                        </h3>
                      </div>
                      <span className={`status-badge status-${o.status}`}>
                        {o.status}
                      </span>
                    </div>

                    <div className="flex justify-between align-center" style={{ marginTop: "12px", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>
                        {o.items?.reduce((tot, i) => tot + i.quantity, 0)} Items • {o.orderTime}
                      </span>
                      <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>
                        {formatCurrency(o.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card empty-state">
                <ChefHat size={40} style={{ color: "var(--text-muted)" }} />
                <div className="empty-state-title">No orders in this filter</div>
                <p className="empty-state-desc">The kitchen is fully caught up with all tables!</p>
              </div>
            )}
          </div>

          {/* Active Detail/Action Console Panel */}
          <div style={{ position: "sticky", top: "96px" }} id="active-order-console-panel">
            {selectedOrder ? (
              <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div className="flex justify-between align-center" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      ORDER #{selectedOrder.id.toUpperCase()}
                    </span>
                    <h2 style={{ fontSize: "1.6rem", marginTop: "4px" }}>Table {selectedOrder.tableNumber}</h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Placed at: {selectedOrder.orderDate} {selectedOrder.orderTime}</p>
                  </div>

                  <button className="btn btn-outline btn-icon" onClick={handlePrint} title="Print Chef Ticket">
                    <Printer size={18} />
                  </button>
                </div>

                {/* Status controllers */}
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Queue Controller Actions</span>
                  <div className="flex flex-wrap gap-2" style={{ marginTop: "8px" }} id="status-controller-actions">
                    {selectedOrder.status === "pending" && (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => updateOrderStatus(selectedOrder.id, "preparing")}
                          style={{ backgroundColor: "var(--status-preparing)" }}
                        >
                          <CookingPot size={16} /> Accept & Prepare
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                          style={{ borderColor: "var(--status-cancelled)", color: "var(--status-cancelled)" }}
                        >
                          <Ban size={16} /> Reject / Cancel
                        </button>
                      </>
                    )}
                    {selectedOrder.status === "preparing" && (
                      <button
                        className="btn btn-primary"
                        onClick={() => updateOrderStatus(selectedOrder.id, "ready")}
                        style={{ backgroundColor: "var(--status-ready)" }}
                      >
                        <CheckCircle size={16} /> Mark as Ready
                      </button>
                    )}
                    {selectedOrder.status === "ready" && (
                      <button
                        className="btn btn-primary"
                        onClick={() => updateOrderStatus(selectedOrder.id, "completed")}
                        style={{ backgroundColor: "var(--status-completed)" }}
                      >
                        <CheckCircle size={16} /> Complete & Serve
                      </button>
                    )}
                    {(selectedOrder.status === "completed" || selectedOrder.status === "cancelled") && (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        This order is archived as <strong>{selectedOrder.status.toUpperCase()}</strong>.
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Items summary list */}
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Chef Kitchen Ticket</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between align-center" style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
                        <div className="flex align-center gap-2">
                          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.isVeg ? "var(--status-veg)" : "var(--status-nonveg)" }}></span>
                          <span style={{ fontWeight: "700", fontSize: "1.05rem" }}>x{item.quantity}</span>
                          <span style={{ fontWeight: "600" }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special directions */}
                {selectedOrder.customerNotes && (
                  <div style={{ padding: "16px", backgroundColor: "rgba(245, 158, 11, 0.05)", borderLeft: "3px solid #f59e0b", borderRadius: "4px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: "700" }}>SPECIAL COOKING NOTES</span>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: "600", marginTop: "4px" }}>
                      "{selectedOrder.customerNotes}"
                    </p>
                  </div>
                )}

                {/* Price aggregation footer */}
                <div style={{ borderTop: "2px solid var(--border-color)", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "1.3rem", fontWeight: "700", fontFamily: "var(--font-display)" }}>
                  <span>Grand Total</span>
                  <span style={{ color: "var(--primary-color)" }}>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                <Clock size={48} style={{ margin: "0 auto 16px" }} />
                <h3>No Order Selected</h3>
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Select any table ticket from the queue left side to inspect dishes and change state.</p>
              </div>
            )}
          </div>
        </div>

        {/* HIDDEN PRINT-FRIENDLY RECEIPT FORMAT */}
        {selectedOrder && (
          <div className="print-receipt print-only" id="printable-kitchen-receipt">
            <h2 style={{ textAlign: "center", textTransform: "uppercase" }}>{settings.restaurantName || "EasyOrder"}</h2>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "10px", marginBottom: "10px" }}>
              <h3>TABLE {selectedOrder.tableNumber}</h3>
              <p>ID: #{selectedOrder.id.slice(-8).toUpperCase()}</p>
              <p>{selectedOrder.orderDate} {selectedOrder.orderTime}</p>
            </div>

            <div style={{ marginBottom: "10px", borderBottom: "1px dashed #000", paddingBottom: "10px" }}>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", fontSize: "14px" }}>
                  <span><strong>x{item.quantity}</strong> {item.name} {item.isVeg ? "(V)" : ""}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {selectedOrder.customerNotes && (
              <div style={{ marginBottom: "10px", borderBottom: "1px dashed #000", paddingBottom: "10px" }}>
                <strong>INSTRUCTIONS:</strong>
                <p style={{ fontStyle: "italic", fontSize: "13px" }}>"{selectedOrder.customerNotes}"</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold" }}>
              <span>TOTAL</span>
              <span>{formatCurrency(selectedOrder.totalAmount)}</span>
            </div>
          </div>
        )}
      </main>
  );
}
