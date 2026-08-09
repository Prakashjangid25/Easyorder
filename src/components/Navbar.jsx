import React from "react";
import { useSettings } from "../context/SettingsContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { Sun, Moon, Utensils, ShieldAlert, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase/firebase.js";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const { tableNumber, clearTableNumber } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide global navbar inside Super Admin and Admin pages (AdminLayout handles admin header/sidebar)
  if (
    location.pathname.startsWith("/superadmin") ||
    location.pathname.startsWith("/super-admin") ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

  const handleAdminLogout = async () => {
    try {
      localStorage.removeItem("adminLoginTimestamp");
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error: ", error);
    }
  };

  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";

  return (
    <header className="app-header" id="easyorder-header">
      <div className="container header-container">
        {/* Restaurant Branding Logo */}
        <div className="logo-container" onClick={() => navigate("/")} style={{ cursor: "pointer", minWidth: 0, flexShrink: 1 }}>
          <img
            src={theme === "dark" ? settings.darkModeLogo || settings.restaurantLogo : settings.restaurantLogo}
            alt={settings.restaurantName}
            onError={(e) => {
              e.target.style.display = "none";
            }}
            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          <span className="logo-text">
            {settings.restaurantName === "EasyOrder" ? (
              <>
                Easy<span className="logo-accent">Order</span>
              </>
            ) : (
              <>
                {settings.restaurantName.split(" ")[0]}
                {settings.restaurantName.split(" ").length > 1 && (
                  <span className="logo-accent">
                    {" "}{settings.restaurantName.split(" ").slice(1).join(" ")}
                  </span>
                )}
              </>
            )}
          </span>
        </div>

        {/* Dynamic Header Controls */}
        <div className="header-actions" style={{ flexShrink: 0 }}>
          {/* Table ID Badge for Customers */}
          {tableNumber && !location.pathname.startsWith("/admin") && (
            <div
              className="badge"
              style={{
                backgroundColor: "rgba(230, 57, 70, 0.1)",
                color: "var(--primary-color)",
                border: "1px solid var(--primary-color)",
                gap: "4px",
                padding: "6px 10px",
                cursor: "pointer",
                borderRadius: "20px",
                whiteSpace: "nowrap",
                fontSize: "0.78rem"
              }}
              title="Click to change Table"
              onClick={() => {
                if (window.confirm("Do you want to switch or leave your table?")) {
                  clearTableNumber();
                  navigate("/customer");
                }
              }}
            >
              <Utensils size={13} />
              <span>Table {tableNumber}</span>
            </div>
          )}

          {/* Admin Control Badges */}
          {auth.currentUser && isAdminRoute && (
            <div
              className="badge"
              style={{
                backgroundColor: "rgba(69, 123, 157, 0.1)",
                color: "var(--secondary-color)",
                border: "1px solid var(--secondary-color)",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "20px"
              }}
            >
              <ShieldAlert size={14} />
              <span>Admin</span>
            </div>
          )}

          {/* Theme Switcher Button */}
          <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle Theme" id="theme-toggle-btn">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Logout Button inside Header for Admins */}
          {auth.currentUser && isAdminRoute && (
            <button
              className="btn-icon"
              onClick={handleAdminLogout}
              style={{ borderColor: "var(--status-cancelled)", color: "var(--status-cancelled)" }}
              title="Logout"
              id="admin-logout-btn"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
