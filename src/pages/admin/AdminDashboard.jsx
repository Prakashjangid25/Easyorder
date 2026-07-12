import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { IndianRupee, Clock, CheckCircle, ShoppingCart, Ban, CookingPot, Flame, Award, Utensils } from "lucide-react";
import { StatCardSkeleton, TableRowSkeleton } from "../../components/SkeletonLoader.jsx";
import { formatCurrency } from "../../utils/format.js";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read all orders in real-time
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("Dashboard orders read error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute stats helper
  const getStats = () => {
    const today = new Date().toLocaleDateString();
    
    const todayOrders = orders.filter((o) => {
      if (!o.createdAt) return false;
      const oDate = new Date(o.createdAt).toLocaleDateString();
      return oDate === today;
    });

    const completedToday = todayOrders.filter((o) => o.status === "completed");
    const revenueToday = completedToday.reduce((total, o) => total + (o.totalAmount || 0), 0);

    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const preparingCount = orders.filter((o) => o.status === "preparing").length;
    const readyCount = orders.filter((o) => o.status === "ready").length;
    const completedCount = orders.filter((o) => o.status === "completed").length;
    const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

    // Aggregate popular products
    const itemSales = {};
    orders.forEach((order) => {
      // Only count completed/preparing/ready orders for sales stats!
      if (order.status !== "cancelled" && order.items) {
        order.items.forEach((item) => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = { count: 0, isVeg: item.isVeg || false };
          }
          itemSales[item.name].count += item.quantity || 1;
        });
      }
    });

    const popularItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, sales: data.count, isVeg: data.isVeg }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      todayOrdersCount: todayOrders.length,
      revenueToday,
      pendingCount,
      preparingCount,
      readyCount,
      completedCount,
      cancelledCount,
      popularItems
    };
  };

  const stats = getStats();

  return (
    <div className="admin-shell" id="admin-dashboard-container">
      <AdminSidebar />
      
      <main className="admin-content-area" id="admin-dashboard-content">
        <div className="dashboard-header" id="admin-dashboard-header">
          <div>
            <h1 style={{ fontSize: "2rem" }}>Restaurant Overview</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Monitor live performance, customer orders, and sales trends.
            </p>
          </div>
          <div className="badge" style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}>
            📅 Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Statistics Metric Cards */}
        {loading ? (
          <div className="stat-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="stat-grid" id="admin-stats-summary-grid">
            {/* Stat: Revenue Today */}
            <div className="card stat-card" style={{ borderLeft: "4px solid #10b981" }}>
              <div className="stat-icon-container" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <IndianRupee size={24} />
              </div>
              <div>
                <span className="stat-label">Revenue Today</span>
                <div className="stat-number">{formatCurrency(stats.revenueToday)}</div>
              </div>
            </div>

            {/* Stat: Today's Orders */}
            <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary-color)" }}>
              <div className="stat-icon-container" style={{ backgroundColor: "rgba(230, 57, 70, 0.1)", color: "var(--primary-color)" }}>
                <ShoppingCart size={24} />
              </div>
              <div>
                <span className="stat-label">Today's Orders</span>
                <div className="stat-number">{stats.todayOrdersCount}</div>
              </div>
            </div>

            {/* Stat: Pending Orders */}
            <div className="card stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
              <div className="stat-icon-container" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                <Clock size={24} />
              </div>
              <div>
                <span className="stat-label">Pending Orders</span>
                <div className="stat-number" style={{ color: "#f59e0b" }}>{stats.pendingCount}</div>
              </div>
            </div>

            {/* Stat: Preparing Orders */}
            <div className="card stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
              <div className="stat-icon-container" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                <CookingPot size={24} />
              </div>
              <div>
                <span className="stat-label">Preparing Food</span>
                <div className="stat-number" style={{ color: "#3b82f6" }}>{stats.preparingCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Extended Stats Bento Panel */}
        <div className="grid-2" style={{ marginTop: "24px" }} id="admin-dashboard-bento-grid">
          {/* Section: Live Queue Tracker */}
          <div className="card" id="dashboard-queue-card">
            <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignCenter: "center", gap: "8px" }}>
              <Clock size={18} /> Order Queue Breakdowns
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { name: "Pending Approval", count: stats.pendingCount, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
                { name: "In Preparation (Cooking)", count: stats.preparingCount, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
                { name: "Ready to Serve", count: stats.readyCount, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
                { name: "Completed Today", count: stats.completedCount, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
                { name: "Cancelled Today", count: stats.cancelledCount, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" }
              ].map((qType) => (
                <div key={qType.name} className="flex justify-between align-center" style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--surface-hover)" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>{qType.name}</span>
                  <span style={{ backgroundColor: qType.bg, color: qType.color, padding: "4px 12px", borderRadius: "12px", fontWeight: "700", fontSize: "0.9rem" }}>
                    {qType.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Popular Items Aggregate */}
          <div className="card" id="dashboard-popular-items-card">
            <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignCenter: "center", gap: "8px" }}>
              <Award size={18} /> Best Sellers (Popular Items)
            </h2>
            {stats.popularItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {stats.popularItems.map((item, idx) => (
                  <div key={item.name} className="flex justify-between align-center" style={{ borderBottom: idx === 4 ? "none" : "1px solid var(--border-color)", paddingBottom: idx === 4 ? "0" : "12px" }}>
                    <div className="flex align-center gap-2">
                      <span style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.95rem" }}>#{idx + 1}</span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: item.isVeg ? "var(--status-veg)" : "var(--status-nonveg)"
                        }}
                      ></span>
                      <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{item.name}</span>
                    </div>
                    <div className="flex align-center gap-1" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      <Flame size={14} color="#d97706" />
                      <span style={{ fontWeight: "700" }}>{item.sales} sold</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <Utensils size={32} style={{ color: "var(--text-muted)" }} />
                <div className="empty-state-title" style={{ fontSize: "1rem" }}>No sales data yet</div>
                <div className="empty-state-desc" style={{ fontSize: "0.8rem" }}>Completed orders will automatically populate your best sellers list here.</div>
              </div>
            )}
          </div>
        </div>

        {/* Section: Recent Orders Table */}
        <div style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>Recent Orders Arrivals</h2>
          <div className="admin-table-container">
            <table className="admin-table" id="dashboard-recent-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Table</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))
                ) : orders.length > 0 ? (
                  orders.slice(0, 5).map((o) => (
                    <tr key={o.id} id={`dashboard-order-row-${o.id}`}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: "600", fontSize: "0.85rem" }}>
                        #{o.id.slice(-8).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: "600" }}>Table {o.tableNumber}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{o.orderTime || "N/A"}</td>
                      <td style={{ fontWeight: "700", fontFamily: "var(--font-display)" }}>{formatCurrency(o.totalAmount)}</td>
                      <td>
                        <span className={`status-badge status-${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px 0" }}>
                      <div className="empty-state">
                        <ShoppingCart size={36} style={{ color: "var(--text-muted)" }} />
                        <div className="empty-state-title">No orders found</div>
                        <p className="empty-state-desc">Customer orders will appear here automatically.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
