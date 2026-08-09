import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("superadmin@easyorder.com");
  const [password, setPassword] = useState("superadmin123");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Allow any login or credentials check
      if (email.trim().length > 0 && password.trim().length > 0) {
        localStorage.setItem("superAdminSession", JSON.stringify({
          email,
          loginTime: Date.now()
        }));
        showToast("Super Admin Authenticated", "success");
        navigate("/super-admin/restaurants");
      } else {
        showToast("Please enter valid email and password", "error");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="table-gate-screen" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "40px 32px", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: "rgba(230, 57, 70, 0.1)",
            color: "var(--primary-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>Super Admin Login</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "6px" }}>
            EasyOrder Platform Management Console
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="input-label" style={{ fontWeight: "600", fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
              Super Admin Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: "42px", width: "100%", height: "46px", borderRadius: "8px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ fontWeight: "600", fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: "42px", width: "100%", height: "46px", borderRadius: "8px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: "46px", borderRadius: "8px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Access Super Admin"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
          <a href="/admin/login" style={{ fontSize: "0.85rem", color: "var(--primary-color)", fontWeight: "600", textDecoration: "none" }}>
            Go to Restaurant Admin Login &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
