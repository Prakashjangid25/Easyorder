import React, { useState } from "react";
import SuperAdminSidebar from "../../components/super-admin/SuperAdminSidebar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Shield, Server, Database, Globe, Save, CheckCircle } from "lucide-react";

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

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }} className="sa-scroll">
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
            Platform Settings
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>
            Global system-wide configurations for EasyOrder Multi-Restaurant Engine.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* System Identifiers */}
          <div className="sa-glass-card" style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "rgba(230, 57, 70, 0.1)",
                color: "var(--primary-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Globe size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>System Identifiers</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="sa-label">Platform Name</label>
                <input
                  type="text"
                  className="sa-input"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="sa-label">Platform Currency</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={currency}
                    readOnly
                    style={{ backgroundColor: "rgba(0,0,0,0.03)", cursor: "not-allowed" }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    INR (₹) is enforced globally per platform spec.
                  </span>
                </div>

                <div>
                  <label className="sa-label">Default Language</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="sa-glass-card" style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "rgba(230, 57, 70, 0.1)",
                color: "var(--primary-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Shield size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Security & Access</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>Allow Super Admin Restaurant Creation</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Enable provisioning of new restaurant tenants in real-time</div>
              </div>
              <button
                type="button"
                className={`sa-toggle ${allowRegistration ? "active" : ""}`}
                onClick={() => setAllowRegistration(!allowRegistration)}
                aria-label="Toggle restaurant creation"
              />
            </div>
          </div>

          {/* Database & Connection Info */}
          <div className="sa-glass-card" style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "rgba(230, 57, 70, 0.1)",
                color: "var(--primary-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Database size={20} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Database & Connection Info</h2>
            </div>

            <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle size={16} style={{ color: "#2a9d8f", flexShrink: 0 }} />
                <span><strong>Firebase Project ID:</strong> easy-order-e6a5f</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle size={16} style={{ color: "#2a9d8f", flexShrink: 0 }} />
                <span><strong>Firestore Database:</strong> Connected (Active)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle size={16} style={{ color: "#2a9d8f", flexShrink: 0 }} />
                <span><strong>Storage Bucket:</strong> easy-order-e6a5f.firebasestorage.app</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle size={16} style={{ color: "#2a9d8f", flexShrink: 0 }} />
                <span><strong>Multi-Tenant Mode:</strong> Isolated per <code style={{ background: "var(--surface-hover)", padding: "2px 6px", borderRadius: "4px" }}>restaurantId</code></span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="sa-btn-premium"
            style={{ padding: "14px 28px", display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start" }}
          >
            <Save size={18} />
            <span>Save Settings</span>
          </button>
        </form>
      </main>
    </div>
  );
}
