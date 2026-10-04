import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SuperAdminSidebar from "../../components/super-admin/SuperAdminSidebar.jsx";
import { getAllRestaurants } from "../../firebase/multiRestaurant.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { Store, CheckCircle, XCircle, ArrowRight, Plus, ExternalLink, ShoppingBag, IndianRupee, Eye, TrendingUp, Activity } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { formatCurrency } from "../../utils/format.js";

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [todaysOrders, setTodaysOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const { setActiveRestaurantId } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const list = await getAllRestaurants();
        setRestaurants(list);

        let sumTotalOrders = 0;
        let sumTodayOrders = 0;
        let sumRevenue = 0;
        const todayStr = new Date().toLocaleDateString();

        for (const res of list) {
          const ordersPath = res.id === "default" ? "orders" : `restaurants/${res.id}/orders`;
          try {
            const snap = await getDocs(collection(db, ordersPath));
            sumTotalOrders += snap.size;
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.status === "completed") {
                sumRevenue += (data.totalAmount || 0);
              }
              if (data.createdAt) {
                const oDate = new Date(data.createdAt).toLocaleDateString();
                if (oDate === todayStr) {
                  sumTodayOrders += 1;
                }
              }
            });
          } catch (e) {
            // Ignore subcollection read error if empty
          }
        }

        setTotalOrders(sumTotalOrders);
        setTodaysOrders(sumTodayOrders);
        setTotalRevenue(sumRevenue);
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeCount = restaurants.filter(r => r.status === "active").length;
  const inactiveCount = restaurants.filter(r => r.status === "inactive").length;

  const handleOpenAdmin = (resId, resName) => {
    setActiveRestaurantId(resId);
    localStorage.setItem("activeAdminRestaurantId", resId);
    showToast(`Switched context to ${resName}`, "info");
    navigate("/admin/dashboard");
  };

  const stats = [
    { label: "Total Restaurants", value: restaurants.length, sub: "Registered SaaS tenants", icon: <Store size={22} />, color: "var(--primary-color)", bg: "rgba(230, 57, 70, 0.1)", gradient: "sa-red" },
    { label: "Active Restaurants", value: activeCount, sub: "Receiving live orders", icon: <CheckCircle size={22} />, color: "#2a9d8f", bg: "rgba(42, 157, 143, 0.1)", gradient: "sa-green" },
    { label: "Inactive Restaurants", value: inactiveCount, sub: "Disabled / suspended", icon: <XCircle size={22} />, color: "#e63946", bg: "rgba(230, 57, 70, 0.1)", gradient: "sa-orange" },
    { label: "Total Orders", value: totalOrders, sub: `Today: ${todaysOrders} orders`, icon: <ShoppingBag size={22} />, color: "var(--secondary-color)", bg: "rgba(69, 123, 157, 0.1)", gradient: "sa-blue" },
    { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: "Across all tenants", icon: <IndianRupee size={22} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", gradient: "sa-purple" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <SuperAdminSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }} className="sa-scroll">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                Super Admin Overview
              </h1>
              <span className="sa-badge sa-badge-success" style={{ gap: "4px" }}>
                <Activity size={12} />
                Live
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>
              High-level metrics and SaaS platform management console.
            </p>
          </div>

          <Link
            to="/superadmin/restaurants"
            className="sa-btn-premium"
            style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
          >
            <Plus size={18} />
            <span>Create Restaurant</span>
          </Link>
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {stats.map((stat, idx) => (
            <div key={idx} className={`sa-stat-card ${stat.gradient}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {stat.label}
                </span>
                <div style={{
                  padding: "10px",
                  borderRadius: "12px",
                  backgroundColor: stat.bg,
                  color: stat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {stat.icon}
                </div>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: stat.color, lineHeight: 1.2 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "6px" }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Restaurants List */}
        <div className="sa-glass-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
              Restaurants Summary
            </h2>
            <Link
              to="/superadmin/restaurants"
              style={{
                fontSize: "0.85rem",
                color: "var(--primary-color)",
                fontWeight: "700",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "3px solid var(--border-color)",
                borderTopColor: "var(--primary-color)",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px"
              }} />
              <p style={{ color: "var(--text-muted)" }}>Loading platform summary...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Store size={48} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>No restaurants created yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Slug / ID</th>
                    <th>Admin Email</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((res) => (
                    <tr key={res.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={res.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop"}
                            alt={res.name}
                            style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }}
                          />
                          <span style={{ fontWeight: "600" }}>{res.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", color: "var(--text-muted)", fontSize: "0.82rem" }}>{res.id}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{res.adminEmail || "N/A"}</td>
                      <td>
                        <span className={`sa-badge ${res.status === "active" ? "sa-badge-success" : "sa-badge-danger"}`}>
                          {res.status === "active" ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <Link
                            to={`/superadmin/restaurants/${res.id}`}
                            className="sa-icon-btn"
                            title="Inspect Restaurant"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleOpenAdmin(res.id, res.name)}
                            className="sa-icon-btn"
                            title="Open Admin Panel"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
