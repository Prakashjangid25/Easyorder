import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Plus, Trash2, QrCode, ExternalLink, Printer, Table, Clipboard } from "lucide-react";
import { handleFirestoreError, OperationType } from "../../firebase/errorHandler.js";

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTableQR, setSelectedTableQR] = useState(null);

  const { showToast } = useToast();
  const { settings, activeRestaurantId } = useSettings();

  const appBaseUrl = window.location.origin;

  const tablesColPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/tables`
    : "tables";

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, tablesColPath), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setTables(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "tables");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeRestaurantId, tablesColPath]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    const cleanName = tableName.trim();
    if (!cleanName) {
      showToast("Table name/number is required", "error");
      return;
    }

    const exists = tables.some((t) => t.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      showToast("This table already exists!", "error");
      return;
    }

    try {
      await addDoc(collection(db, tablesColPath), {
        restaurantId: activeRestaurantId,
        name: cleanName,
        createdAt: new Date().toISOString()
      });
      showToast(`Created ${cleanName} successfully!`, "success");
      setTableName("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "tables");
    }
  };

  const handleDeleteTable = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? Customers will no longer be able to order from this table.`)) {
      try {
        await deleteDoc(doc(db, tablesColPath, id));
        showToast(`${name} deleted`, "success");
        if (selectedTableQR && selectedTableQR.id === id) {
          setSelectedTableQR(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tables/${id}`);
      }
    }
  };

  // Construct the scanning URL for QR code
  const getTableScanUrl = (name) => {
    if (activeRestaurantId) {
      return `${appBaseUrl}/menu/${activeRestaurantId}/${encodeURIComponent(name)}`;
    }
    return `${appBaseUrl}/menu?table=${encodeURIComponent(name)}`;
  };

  const getQrCodeApiUrl = (name) => {
    const scanUrl = getTableScanUrl(name);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(scanUrl)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Sticker URL copied to clipboard!", "success");
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="admin-shell" id="admin-tables-page-container">
      <AdminSidebar />

      <main className="admin-content-area" id="admin-tables-content">
        <div className="dashboard-header" id="admin-tables-header">
          <div>
            <h1 style={{ fontSize: "2rem" }}>
              {settings.restaurantName ? `${settings.restaurantName} - Table & QR Manager` : "Table & QR Manager"}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Register dining tables, download dynamic QR code tags, and monitor active customer terminals.
            </p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr", gap: "32px", alignItems: "start" }}>
          {/* Create Table Form & List */}
          <div className="card" id="tables-list-panel">
            <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Table size={18} /> Dining Tables
            </h2>

            <form onSubmit={handleAddTable} className="flex gap-2" style={{ marginBottom: "24px", alignItems: "flex-end" }}>
              <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="input-label" htmlFor="table-name-create-input">Table Name / Number</label>
                <input
                  id="table-name-create-input"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Table 15 or Bar 2"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: "12px 20px", fontWeight: "700" }}>
                <Plus size={16} /> Add Table
              </button>
            </form>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tables.map((t) => {
                const isSelected = selectedTableQR && selectedTableQR.id === t.id;
                return (
                  <div
                    key={t.id}
                    className="flex justify-between align-center"
                    style={{
                      padding: "12px 16px",
                      backgroundColor: isSelected ? "rgba(230, 57, 70, 0.05)" : "var(--surface-hover)",
                      border: isSelected ? "1.5px solid var(--primary-color)" : "1.5px solid transparent",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedTableQR(t)}
                    id={`table-row-${t.id}`}
                  >
                    <div>
                      <span style={{ fontWeight: "700", fontSize: "1rem" }}>{t.name}</span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        URL: {getTableScanUrl(t.name).slice(0, 35)}...
                      </span>
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => setSelectedTableQR(t)} style={{ width: "32px", height: "32px" }} title="Show QR Code">
                        <QrCode size={14} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDeleteTable(t.id, t.name)} style={{ width: "32px", height: "32px", color: "var(--status-cancelled)" }} title="Delete Table">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR Code display */}
          <div style={{ position: "sticky", top: "96px" }} id="table-qr-console-panel">
            {selectedTableQR ? (
              <div className="card" style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px" }}>
                <h3 style={{ fontSize: "1.4rem" }}>{selectedTableQR.name} Sticker</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Customers scanning this code will be redirected to the menu with Table auto-assigned.
                </p>

                {/* QR Code image display */}
                <div style={{ margin: "16px auto", border: "12px solid #ffffff", borderRadius: "12px", boxShadow: "var(--shadow-md)", width: "274px" }}>
                  <img
                    src={getQrCodeApiUrl(selectedTableQR.name)}
                    alt={`${selectedTableQR.name} QR Code`}
                    style={{ width: "250px", height: "250px" }}
                  />
                </div>

                <div className="flex gap-2 justify-center">
                  <button className="btn btn-primary" onClick={handlePrintQR} style={{ gap: "8px", fontWeight: "700" }} id="print-qr-code-btn">
                    <Printer size={16} /> Print Sticker
                  </button>
                  <button className="btn btn-outline" onClick={() => copyToClipboard(getTableScanUrl(selectedTableQR.name))} style={{ gap: "8px" }}>
                    <Clipboard size={16} /> Copy URL
                  </button>
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>STICKER REDIRECT TARGET</span>
                  <a
                    href={getTableScanUrl(selectedTableQR.name)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.85rem", color: "var(--secondary-color)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: "600" }}
                  >
                    Open Link <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                <QrCode size={48} style={{ margin: "0 auto 16px" }} />
                <h3>No Table Selected</h3>
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Select any table on the left side to review, print, or test its dynamic QR code sticker.</p>
              </div>
            )}
          </div>
        </div>

        {/* HIDDEN PRINT LAYOUT FOR SINGLE QR STICKER */}
        {selectedTableQR && (
          <div className="print-receipt print-only" id="printable-qr-sticker">
            <div style={{ border: "2px solid #000", padding: "20px", borderRadius: "10px", textAlign: "center", width: "70mm", margin: "auto" }}>
              <h2 style={{ margin: "0 0 10px 0", fontSize: "18px", textTransform: "uppercase" }}>{settings?.restaurantName || "EasyOrder"}</h2>
              <p style={{ margin: "0 0 15px 0", fontSize: "14px" }}>Scan to Order Food</p>

              <img
                src={getQrCodeApiUrl(selectedTableQR.name)}
                alt="Print QR"
                style={{ width: "55mm", height: "55mm", display: "block", margin: "auto" }}
              />

              <h1 style={{ margin: "15px 0 0 0", fontSize: "24px", letterSpacing: "1px" }}>{selectedTableQR.name.toUpperCase()}</h1>
              <p style={{ fontSize: "10px", color: "#666", marginTop: "5px" }}>Powered by EasyOrder</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
