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
        // Fetch restaurant main doc
        const resRef = doc(db, "restaurants", restaurantId);
        const resSnap = await getDoc(resRef);

        if (resSnap.exists()) {
          setRestaurant({ id: resSnap.id, ...resSnap.data() });
        } else {
          showToast("Restaurant not found", "error");
          navigate("/superadmin/restaurants");
          return;
        }

        // Fetch subcollections counts
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
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            <h3>Loading Restaurant Details...</h3>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <SuperAdminSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
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
                style={{ width: "64px", height: "64px", borderRadius: "16px", objectFit: "cover", border: "1px solid var(--border-color)" }}
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>
                    {restaurant?.name}
                  </h1>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    backgroundColor: restaurant?.status === "active" ? "rgba(42, 157, 143, 0.15)" : "rgba(230, 57, 70, 0.15)",
                    color: restaurant?.status === "active" ? "#2a9d8f" : "#e63946"
                  }}>
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
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "700" }}
            >
              <ExternalLink size={16} />
              <span>Open Restaurant Admin Panel</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Menu Items</span>
              <ShoppingBag size={20} style={{ color: "var(--primary-color)" }} />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800" }}>{menuCount}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>Active products in catalog</div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Dining Tables</span>
              <Table size={20} style={{ color: "var(--secondary-color)" }} />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800" }}>{tableCount}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>QR enabled tables</div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Orders</span>
              <Receipt size={20} style={{ color: "#2a9d8f" }} />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800" }}>{orderCount}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>Lifetime customer orders</div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Revenue</span>
              <div style={{ fontWeight: "800", color: "#2a9d8f", fontSize: "1.1rem" }}>₹</div>
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2a9d8f" }}>{formatCurrency(totalRevenue)}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>Completed order revenue</div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          {/* Restaurant Profile Information */}
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              Restaurant Contact & Credentials
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Mail size={16} style={{ color: "var(--text-muted)" }} />
                <span><strong>Admin Email:</strong> {restaurant?.adminEmail || "N/A"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Phone size={16} style={{ color: "var(--text-muted)" }} />
                <span><strong>Phone:</strong> {restaurant?.phone || "N/A"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <MapPin size={16} style={{ color: "var(--text-muted)" }} />
                <span><strong>Address:</strong> {restaurant?.address || "N/A"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Calendar size={16} style={{ color: "var(--text-muted)" }} />
                <span><strong>Created On:</strong> {restaurant?.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Customer Ordering Preview URL */}
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              Customer Order Endpoint
            </h2>

            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Direct URL for customers scanning table QR codes for <strong>{restaurant?.name}</strong>:
            </p>

            <div style={{
              backgroundColor: "var(--surface-hover, rgba(0,0,0,0.03))",
              padding: "12px 16px",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              wordBreak: "break-all",
              border: "1px solid var(--border-color)",
              marginBottom: "16px"
            }}>
              {window.location.origin}/customer?restaurant={restaurant?.id}
            </div>

            <a
              href={`${window.location.origin}/customer?restaurant=${restaurant?.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}
            >
              <span>Test Customer Menu Page</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Recent Activity Orders */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
            Recent Orders ({recentOrders.length})
          </h2>

          {recentOrders.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No orders recorded for this restaurant yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "10px" }}>Order ID</th>
                    <th style={{ padding: "10px" }}>Table</th>
                    <th style={{ padding: "10px" }}>Amount</th>
                    <th style={{ padding: "10px" }}>Status</th>
                    <th style={{ padding: "10px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "0.88rem" }}>
                      <td style={{ padding: "10px", fontFamily: "monospace" }}>#{ord.id.slice(-6)}</td>
                      <td style={{ padding: "10px", fontWeight: "600" }}>Table {ord.tableNumber || "N/A"}</td>
                      <td style={{ padding: "10px", fontWeight: "700" }}>{formatCurrency(ord.totalAmount || 0)}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          backgroundColor: ord.status === "completed" ? "rgba(42, 157, 143, 0.15)" : "rgba(230, 57, 70, 0.15)",
                          color: ord.status === "completed" ? "#2a9d8f" : "#e63946"
                        }}>
                          {ord.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td style={{ padding: "10px", color: "var(--text-muted)" }}>
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
