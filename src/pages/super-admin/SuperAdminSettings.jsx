import React, { useState } from "react";
import SuperAdminSidebar from "../../components/super-admin/SuperAdminSidebar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Shield, Server, Database, Globe, Save } from "lucide-react";

export default function SuperAdminSettings() {
  const { showToast } = useToast();
  const [platformName, setPlatformName] = useState("EasyOrder QR Platform");
  const [currency, setCurrency] = useState("INR (₹)");
  const [defaultLanguage, setDefaultLanguage] = useState("English");
  const [allowRegistration, setAllowRegistration] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    showToast("Platform configurations saved successfully", "success");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <SuperAdminSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Platform Settings
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Global system-wide configurations for EasyOrder Multi-Restaurant Engine.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <Globe size={20} style={{ color: "var(--primary-color)" }} />
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>System Identifiers</h2>
            </div>

            <div>
              <label className="input-label">Platform Name</label>
              <input
                type="text"
                className="input-field"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label className="input-label">Platform Currency</label>
                <input
                  type="text"
                  className="input-field"
                  value={currency}
                  readOnly
                  style={{ backgroundColor: "rgba(0,0,0,0.03)", cursor: "not-allowed" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  INR (₹) is enforced globally per platform spec.
                </span>
              </div>

              <div>
                <label className="input-label">Default Language</label>
                <input
                  type="text"
                  className="input-field"
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <Shield size={20} style={{ color: "var(--primary-color)" }} />
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Security & Access</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>Allow Super Admin Restaurant Creation</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Enable provisioning of new restaurant tenants in real-time</div>
              </div>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <Database size={20} style={{ color: "var(--primary-color)" }} />
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Database & Connection Info</h2>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div><strong>Firebase Project ID:</strong> easy-order-e6a5f</div>
              <div><strong>Firestore Database:</strong> Connected (Active)</div>
              <div><strong>Storage Bucket:</strong> easy-order-e6a5f.firebasestorage.app</div>
              <div><strong>Multi-Tenant Mode:</strong> Isolated per <code>restaurantId</code></div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "12px 24px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start" }}
          >
            <Save size={18} />
            <span>Save Settings</span>
          </button>
        </form>
      </main>
    </div>
  );
}
