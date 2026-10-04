import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import SuperAdminSidebar from "../../components/super-admin/SuperAdminSidebar.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { formatCurrency } from "../../utils/format.js";
import {
  ArrowLeft,
  Store,
  ShoppingBag,
  Table,
  Receipt,
  CheckCircle,
  XCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers
} from "lucide-react";

export default function SuperAdminInspectRestaurant() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuCount, setMenuCount] = useState(0);
  const [tableCount, setTableCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);

  const { setActiveRestaurantId } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRestaurantDetails() {
      if (!restaurantId) return;
      setLoading(true);

      try {
        const resRef = doc(db, "restaurants", restaurantId);
        const resSnap = await getDoc(resRef);

        if (resSnap.exists()) {
          setRestaurant({ id: resSnap.id, ...resSnap.data() });
        } else {
          showToast("Restaurant not found", "error");
          navigate("/superadmin/restaurants");
          return;
        }

        const prodsPath = `restaurants/${restaurantId}/products`;
        const tablesPath = `restaurants/${restaurantId}/tables`;
        const ordersPath = `restaurants/${restaurantId}/orders`;

        const [prodsSnap, tablesSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, prodsPath)).catch(() => ({ size: 0, docs: [] })),
          getDocs(collection(db, tablesPath)).catch(() => ({ size: 0, docs: [] })),
          getDocs(query(collection(db, ordersPath), orderBy("createdAt", "desc"))).catch(() => ({ size: 0, docs: [] }))
        ]);

        setMenuCount(prodsSnap.size || 0);
        setTableCount(tablesSnap.size || 0);

        let totalRev = 0;
        const ordersList = [];
        if (ordersSnap.docs) {
          ordersSnap.docs.forEach((d) => {
            const data = d.data();
            ordersList.push({ id: d.id, ...data });
            if (data.status === "completed") {
              totalRev += (data.totalAmount || 0);
            }
          });
        }

        setOrderCount(ordersList.length);
        setTotalRevenue(totalRev);
        setRecentOrders(ordersList.slice(0, 5));
      } catch (error) {
        console.error("Error inspecting restaurant:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurantDetails();
  }, [restaurantId, showToast, navigate]);

  const handleOpenRestaurantAdmin = () => {
    if (restaurant) {
      setActiveRestaurantId(restaurant.id);
      localStorage.setItem("activeAdminRestaurantId", restaurant.id);
      showToast(`Switched context to ${restaurant.name}`, "info");
      navigate("/admin/dashboard");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
        <SuperAdminSidebar />
        <main style={{ flex: 1, padding: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "3px solid var(--border-color)",
              borderTopColor: "var(--primary-color)",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }} />
            <h3 style={{ color: "var(--text-muted)" }}>Loading Restaurant Details...</h3>
          </div>
        </main>
      </div>
    );
  }

  const metrics = [
    { label: "Total Menu Items", value: menuCount, sub: "Active products in catalog", icon: <ShoppingBag size={20} />, color: "var(--primary-color)", bg: "rgba(230, 57, 70, 0.1)", gradient: "sa-red" },
    { label: "Dining Tables", value: tableCount, sub: "QR enabled tables", icon: <Table size={20} />, color: "var(--secondary-color)", bg: "rgba(69, 123, 157, 0.1)", gradient: "sa-blue" },
    { label: "Total Orders", value: orderCount, sub: "Lifetime customer orders", icon: <Receipt size={20} />, color: "#2a9d8f", bg: "rgba(42, 157, 143, 0.1)", gradient: "sa-green" },
    { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: "Completed order revenue", icon: <IndianRupee size={20} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", gradient: "sa-purple" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <SuperAdminSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }} className="sa-scroll">
        {/* Back Link & Header */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            to="/superadmin/restaurants"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-muted)",
              fontSize: "0.88rem",
              fontWeight: "600",
              textDecoration: "none",
              marginBottom: "16px"
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Restaurants List</span>
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img
                src={restaurant?.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop"}
                alt={restaurant?.name}
                style={{ width: "64px", height: "64px", borderRadius: "16px", objectFit: "cover", border: "2px solid var(--border-color)" }}
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                    {restaurant?.name}
                  </h1>
                  <span className={`sa-badge ${restaurant?.status === "active" ? "sa-badge-success" : "sa-badge-danger"}`}>
                    {restaurant?.status === "active" ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", fontFamily: "monospace" }}>
                  ID: {restaurant?.id}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenRestaurantAdmin}
              className="sa-btn-premium"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <ExternalLink size={16} />
              <span>Open Restaurant Admin Panel</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {metrics.map((metric, idx) => (
            <div key={idx} className={`sa-stat-card ${metric.gradient}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>{metric.label}</span>
                <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: metric.bg, color: metric.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {metric.icon}
                </div>
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: metric.color }}>{metric.value}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>{metric.sub}</div>
            </div>
          ))}
        </div>

        {/* Detailed Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          {/* Restaurant Profile Information */}
          <div className="sa-glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Store size={18} style={{ color: "var(--primary-color)" }} />
              Restaurant Contact & Credentials
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Mail size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span><strong>Admin Email:</strong> {restaurant?.adminEmail || "N/A"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Phone size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span><strong>Phone:</strong> {restaurant?.phone || "N/A"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <MapPin size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span><strong>Address:</strong> {restaurant?.address || "N/A"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Calendar size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span><strong>Created On:</strong> {restaurant?.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Customer Ordering Preview URL */}
          <div className="sa-glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={18} style={{ color: "var(--primary-color)" }} />
              Customer Order Endpoint
            </h2>

            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Direct URL for customers scanning table QR codes for <strong>{restaurant?.name}</strong>:
            </p>

            <div style={{
              backgroundColor: "var(--surface-hover, rgba(0,0,0,0.03))",
              padding: "12px 16px",
              borderRadius: "12px",
              fontFamily: "monospace",
              fontSize: "0.82rem",
              wordBreak: "break-all",
              border: "1px solid var(--border-color)",
              marginBottom: "16px",
              color: "var(--text-secondary)"
            }}>
              {window.location.origin}/customer?restaurant={restaurant?.id}
            </div>

            <a
              href={`${window.location.origin}/customer?restaurant=${restaurant?.id}`}
              target="_blank"
              rel="noreferrer"
              className="sa-btn-secondary-premium"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", textDecoration: "none" }}
            >
              <span>Test Customer Menu Page</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Recent Activity Orders */}
        <div className="sa-glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Receipt size={18} style={{ color: "var(--primary-color)" }} />
            Recent Orders ({recentOrders.length})
          </h2>

          {recentOrders.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No orders recorded for this restaurant yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Table</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontFamily: "monospace" }}>#{ord.id.slice(-6)}</td>
                      <td style={{ fontWeight: "600" }}>Table {ord.tableNumber || "N/A"}</td>
                      <td style={{ fontWeight: "700" }}>{formatCurrency(ord.totalAmount || 0)}</td>
                      <td>
                        <span className={`sa-badge ${ord.status === "completed" ? "sa-badge-success" : "sa-badge-danger"}`}>
                          {ord.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : "Just now"}
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

function IndianRupee({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}
