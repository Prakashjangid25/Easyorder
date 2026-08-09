import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Utensils, Table, Palette, Settings, LogOut, Moon, Sun, ShieldCheck, X } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { auth, db } from "../../firebase/firebase.js";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAllRestaurants } from "../../firebase/multiRestaurant.js";

export default function AdminSidebar({ isMobileOpen, onCloseMobile }) {
  const { settings, activeRestaurantId, setActiveRestaurantId } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);

  // Monitor pending orders for active restaurant
  useEffect(() => {
    if (!activeRestaurantId) return;

    const ordersColPath = `restaurants/${activeRestaurantId}/orders`;
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

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const menuItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin/dashboard" },
    { label: "Orders", icon: <ShoppingBag size={18} />, path: "/admin/orders", badge: pendingCount },
    { label: "Menu", icon: <Utensils size={18} />, path: "/admin/menu" },
    { label: "Tables & QR", icon: <Table size={18} />, path: "/admin/tables" },
    { label: "QR Designer", icon: <Palette size={18} />, path: "/admin/qr-designer" },
    { label: "Settings", icon: <Settings size={18} />, path: "/admin/settings" }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 990,
            display: "block"
          }}
          id="admin-sidebar-backdrop"
        />
      )}

      <aside
        className={`admin-sidebar ${isMobileOpen ? "mobile-open" : ""}`}
        id="admin-panel-sidebar"
      >
        <div className="admin-sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
            <img
              src={settings.restaurantLogo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop"}
              alt={settings.restaurantName}
              style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontWeight: "800", fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {settings.restaurantName || "EasyOrder"}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Admin Panel
              </span>
            </div>
          </div>

          {/* Close button visible on mobile */}
          <button
            className="mobile-sidebar-close-btn"
            onClick={onCloseMobile}
            style={{
              padding: "6px",
              color: "var(--text-muted)",
              borderRadius: "6px",
              cursor: "pointer"
            }}
            title="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" id="admin-sidebar-nav-links" style={{ flex: 1, padding: "16px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={handleLinkClick}
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
          <button
            className="sidebar-link"
            onClick={() => {
              toggleTheme();
            }}
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
    </>
  );
}
