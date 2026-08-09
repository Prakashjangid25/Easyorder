import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SuperAdminSidebar from "../../components/super-admin/SuperAdminSidebar.jsx";
import { getAllRestaurants } from "../../firebase/multiRestaurant.js";
import { Store, CheckCircle, XCircle, ArrowRight, Plus, ExternalLink, Activity } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setActiveRestaurantId } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const list = await getAllRestaurants();
        setRestaurants(list);
      } catch (e) {
        console.error(e);
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <SuperAdminSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>
              Super Admin Overview
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              High-level metrics and controls for your multi-restaurant QR platform.
            </p>
          </div>

          <Link
            to="/super-admin/restaurants"
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}
          >
            <Plus size={18} />
            <span>Manage Restaurants</span>
          </Link>
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Restaurants</span>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "rgba(230, 57, 70, 0.1)", color: "var(--primary-color)" }}>
                <Store size={20} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-primary)" }}>{restaurants.length}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Registered on platform</div>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Active Tenants</span>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "rgba(42, 157, 143, 0.1)", color: "#2a9d8f" }}>
                <CheckCircle size={20} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#2a9d8f" }}>{activeCount}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Receiving customer orders</div>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Inactive / Suspended</span>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "rgba(230, 57, 70, 0.1)", color: "#e63946" }}>
                <XCircle size={20} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#e63946" }}>{inactiveCount}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Currently disabled</div>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>System Engine</span>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "rgba(69, 123, 157, 0.1)", color: "var(--secondary-color)" }}>
                <Activity size={20} />
              </div>
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-primary)" }}>Multi-Tenant</div>
            <div style={{ fontSize: "0.8rem", color: "#2a9d8f", fontWeight: "600", marginTop: "4px" }}>🟢 Firestore Connected</div>
          </div>
        </div>

        {/* Recent Restaurants List */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>Restaurants Summary</h2>
            <Link to="/super-admin/restaurants" style={{ fontSize: "0.85rem", color: "var(--primary-color)", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading restaurants...</p>
          ) : restaurants.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No restaurants created yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px" }}>Restaurant</th>
                    <th style={{ padding: "12px" }}>Slug / ID</th>
                    <th style={{ padding: "12px" }}>Admin Email</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((res) => (
                    <tr key={res.id} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "0.9rem" }}>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{res.name}</td>
                      <td style={{ padding: "12px", fontFamily: "monospace", color: "var(--text-muted)" }}>{res.id}</td>
                      <td style={{ padding: "12px" }}>{res.adminEmail || "N/A"}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          backgroundColor: res.status === "active" ? "rgba(42, 157, 143, 0.15)" : "rgba(230, 57, 70, 0.15)",
                          color: res.status === "active" ? "#2a9d8f" : "#e63946"
                        }}>
                          {res.status === "active" ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenAdmin(res.id, res.name)}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <ExternalLink size={14} />
                          <span>Open Admin</span>
                        </button>
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
