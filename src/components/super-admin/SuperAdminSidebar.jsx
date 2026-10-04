import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Store, Settings, LogOut, ShieldCheck, Sparkles } from "lucide-react";
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
    <aside
      className="admin-sidebar sa-scroll"
      id="super-admin-sidebar"
      style={{
        width: "260px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-color)",
        borderRight: "1px solid var(--border-color)",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto"
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #e63946 0%, #ff6b6b 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(230, 57, 70, 0.3)"
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{
              fontWeight: "800",
              fontSize: "1.1rem",
              color: "var(--text-primary)",
              letterSpacing: "-0.3px"
            }}>
              EasyOrder
            </div>
            <div style={{
              fontSize: "0.7rem",
              color: "var(--primary-color)",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Sparkles size={10} />
              Super Admin
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/superadmin/dashboard" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sa-sidebar-link ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border-color)" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          borderRadius: "12px",
          background: "var(--surface-hover)",
          marginBottom: "12px"
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #457b9d 0%, #5fa8d3 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: "700"
          }}>
            SA
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Super Admin
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Platform Owner
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid rgba(230, 57, 70, 0.2)",
            backgroundColor: "rgba(230, 57, 70, 0.05)",
            color: "#e63946",
            fontSize: "0.85rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.25s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(230, 57, 70, 0.1)";
            e.currentTarget.style.transform = "translateX(2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(230, 57, 70, 0.05)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
