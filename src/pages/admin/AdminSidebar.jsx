import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Utensils, Table, Settings, LogOut, Moon, Sun, ShieldCheck, ChevronDown } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { auth, db } from "../../firebase/firebase.js";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAllRestaurants } from "../../firebase/multiRestaurant.js";

export default function AdminSidebar() {
  const { settings, activeRestaurantId, setActiveRestaurantId } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if Super Admin session is active
    const saSession = localStorage.getItem("superAdminSession");
    if (saSession) {
      setIsSuperAdmin(true);
      getAllRestaurants().then(setRestaurantsList).catch(console.error);
    }
  }, []);

  // Monitor pending orders for active restaurant
  useEffect(() => {
    const ordersColPath = activeRestaurantId && activeRestaurantId !== "default"
      ? `restaurants/${activeRestaurantId}/orders`
      : "orders";

    const q = query(collection(db, ordersColPath), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    }, (error) => {
      console.warn("Sidebar pending count listener:", error);
    });
    return () => unsubscribe();
  }, [activeRestaurantId]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        localStorage.removeItem("adminLoginTimestamp");
        await signOut(auth);
        navigate("/admin/login");
      } catch (err) {
        console.error("Error signing out:", err);
      }
    }
  };

  const handleSwitchRestaurant = (e) => {
    const newId = e.target.value;
    setActiveRestaurantId(newId);
    localStorage.setItem("activeAdminRestaurantId", newId);
  };

  const menuItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin/dashboard" },
    { label: "Active Orders", icon: <ShoppingBag size={18} />, path: "/admin/orders", badge: pendingCount },
    { label: "Menu Manager", icon: <Utensils size={18} />, path: "/admin/menu" },
    { label: "Table & QR Manager", icon: <Table size={18} />, path: "/admin/tables" },
    { label: "Settings & Branding", icon: <Settings size={18} />, path: "/admin/settings" }
  ];

  return (
    <aside className="admin-sidebar" id="admin-panel-sidebar">
      <div className="admin-sidebar-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
          <img
            src={settings.restaurantLogo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop"}
            alt={settings.restaurantName}
            style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
          />
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={{ fontWeight: "800", fontSize: "1.05rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {settings.restaurantName || "EasyOrder"}
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Admin Panel
            </span>
          </div>
        </div>

        {/* Super Admin Switcher Dropdown */}
        {isSuperAdmin && restaurantsList.length > 0 && (
          <div style={{ width: "100%", marginTop: "8px" }}>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              SWITCH TENANT
            </label>
            <select
              value={activeRestaurantId}
              onChange={handleSwitchRestaurant}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "0.8rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--surface-color)",
                color: "var(--text-primary)",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {restaurantsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav className="sidebar-nav" id="admin-sidebar-nav-links" style={{ flex: 1, padding: "16px 0" }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              id={`sidebar-link-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--primary-color)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    animation: "pulse 2s infinite"
                  }}
                  id="pending-orders-badge"
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
        {isSuperAdmin && (
          <Link
            to="/super-admin/restaurants"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(230, 57, 70, 0.08)",
              color: "var(--primary-color)",
              fontSize: "0.82rem",
              fontWeight: "700",
              textDecoration: "none"
            }}
          >
            <ShieldCheck size={16} />
            <span>Super Admin Console</span>
          </Link>
        )}

        <button
          className="sidebar-link"
          onClick={toggleTheme}
          style={{ width: "100%", justifyContent: "flex-start", cursor: "pointer", fontSize: "0.85rem" }}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === "light" ? "Dark Theme" : "Light Theme"}</span>
        </button>

        <button
          className="sidebar-link"
          onClick={handleLogout}
          style={{ color: "var(--status-cancelled)", cursor: "pointer", fontSize: "0.85rem" }}
          id="sidebar-logout-btn"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
