import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Utensils, Table, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { auth } from "../../firebase/firebase.js";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

export default function AdminSidebar() {
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  // Monitor pending orders for a live badge inside the sidebar!
  useEffect(() => {
    const q = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    }, (error) => {
      console.error("Error loading pending count in sidebar:", error);
    });
    return () => unsubscribe();
  }, []);

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

  const menuItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin/dashboard" },
    { label: "Active Orders", icon: <ShoppingBag size={18} />, path: "/admin/orders", badge: pendingCount },
    { label: "Menu Manager", icon: <Utensils size={18} />, path: "/admin/menu" },
    { label: "Table Manager", icon: <Table size={18} />, path: "/admin/tables" },
    { label: "Branding & settings", icon: <Settings size={18} />, path: "/admin/settings" }
  ];

  return (
    <aside className="admin-sidebar" id="admin-panel-sidebar">
      <div className="admin-sidebar-header">
        <img
          src={theme === "dark" ? settings.darkModeLogo || settings.restaurantLogo : settings.restaurantLogo}
          alt={settings.restaurantName}
          style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "700", fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>
            EasyOrder
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Admin Portal
          </span>
        </div>
      </div>

      <nav className="sidebar-nav" id="admin-sidebar-nav-links" style={{ flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              id={`sidebar-link-${item.label.toLowerCase().replace(/\s/g, "-")}`}
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
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
        {/* Toggle Theme button */}
        <button
          className="sidebar-link"
          onClick={toggleTheme}
          style={{ width: "100%", justifyContent: "flex-start", cursor: "pointer" }}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>

        {/* Logout button */}
        <button
          className="sidebar-link"
          onClick={handleLogout}
          style={{ color: "var(--status-cancelled)", cursor: "pointer" }}
          id="sidebar-logout-btn"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
