import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Store, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";

export default function SuperAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("superAdminSession");
    showToast("Signed out from Super Admin panel", "info");
    navigate("/superadmin");
  };

  const menuItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/superadmin/dashboard" },
    { label: "Restaurants", icon: <Store size={18} />, path: "/superadmin/restaurants" },
    { label: "Settings", icon: <Settings size={18} />, path: "/superadmin/settings" }
  ];

  return (
    <aside className="admin-sidebar" id="super-admin-sidebar" style={{ width: "250px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      {/* Brand Header */}
      <div className="sidebar-brand" style={{ padding: "24px 20px", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            backgroundColor: "var(--primary-color)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "var(--text-primary)" }}>
              EasyOrder
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>
              Super Admin
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/superadmin/dashboard" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                color: isActive ? "var(--primary-color)" : "var(--text-secondary)",
                backgroundColor: isActive ? "rgba(230, 57, 70, 0.08)" : "transparent",
                fontWeight: isActive ? "700" : "500",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div style={{ marginTop: "auto", padding: "16px 12px", borderTop: "1px solid var(--border-color)" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            backgroundColor: "transparent",
            color: "var(--status-cancelled, #e63946)",
            fontSize: "0.85rem",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
