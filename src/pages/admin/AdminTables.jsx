import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Plus, Trash2, QrCode, ExternalLink, Printer, Table, Clipboard, Download, FileText, Palette } from "lucide-react";
import { handleFirestoreError, OperationType } from "../../firebase/errorHandler.js";
import { QrCardComponent, DEFAULT_QR_DESIGN } from "./QrDesigner.jsx";
import { toPng, toSvg } from "html-to-image";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTableQR, setSelectedTableQR] = useState(null);
  const [defaultDesign, setDefaultDesign] = useState(DEFAULT_QR_DESIGN);

  const { showToast } = useToast();
  const { settings, activeRestaurantId } = useSettings();

  const appBaseUrl = window.location.origin;

  const tablesColPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/tables`
    : "tables";

  const qrSettingsDocPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/settings/qrDesigner`
    : "settings/qrDesigner";

  // Fetch Tables & Restaurant Default QR Design
  useEffect(() => {
    setLoading(true);

    // Fetch Restaurant's Default QR Design
    const qrDocRef = doc(db, qrSettingsDocPath);
    getDoc(qrDocRef).then((snap) => {
      if (snap.exists()) {
        setDefaultDesign((prev) => ({ ...prev, ...snap.data() }));
      }
    }).catch((err) => {
      console.warn("Could not load default QR design for new tables:", err);
    });

    const q = query(collection(db, tablesColPath), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setTables(list);
        
        // Auto-select first table if none selected
        if (list.length > 0 && !selectedTableQR) {
          setSelectedTableQR(list[0]);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "tables");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeRestaurantId, tablesColPath, qrSettingsDocPath]);

  // Create New Table (AUTOMATICALLY USES DEFAULT QR DESIGN)
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
      const newTableData = {
        restaurantId: activeRestaurantId,
        name: cleanName,
        qrDesign: defaultDesign, // Automatically assign the restaurant's default QR design
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, tablesColPath), newTableData);
      showToast(`Created ${cleanName} with default QR design!`, "success");
      setTableName("");
      setSelectedTableQR({ id: docRef.id, ...newTableData });
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Sticker URL copied to clipboard!", "success");
  };

  const handlePrintQR = () => {
    window.print();
  };

  // Active design for selected table
  const activeTableDesign = selectedTableQR?.qrDesign || defaultDesign;
  const effectiveRestaurantName = activeTableDesign?.restaurantNameText || settings?.restaurantName || "EasyOrder Bistro";

  // PNG Export
  const handleDownloadPNG = async () => {
    if (!selectedTableQR) return;
    const cardEl = document.getElementById(`table-card-export-${selectedTableQR.id}`);
    if (!cardEl) return;

    try {
      const dataUrl = await toPng(cardEl, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${selectedTableQR.name.replace(/[^a-z0-9]/gi, "_")}_QR.png`;
      link.href = dataUrl;
      link.click();
      showToast("PNG downloaded successfully!", "success");
    } catch (err) {
      console.error("PNG export error:", err);
      showToast("Failed to download PNG", "error");
    }
  };

  // SVG Export
  const handleDownloadSVG = async () => {
    if (!selectedTableQR) return;
    const cardEl = document.getElementById(`table-card-export-${selectedTableQR.id}`);
    if (!cardEl) return;

    try {
      const dataUrl = await toSvg(cardEl, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${selectedTableQR.name.replace(/[^a-z0-9]/gi, "_")}_QR.svg`;
      link.href = dataUrl;
      link.click();
      showToast("SVG exported successfully!", "success");
    } catch (err) {
      console.error("SVG export error:", err);
      showToast("Failed to export SVG", "error");
    }
  };

  // PDF Export
  const handleSavePDF = async () => {
    if (!selectedTableQR) return;
    const cardEl = document.getElementById(`table-card-export-${selectedTableQR.id}`);
    if (!cardEl) return;

    try {
      showToast("Generating PDF...", "info");
      const dataUrl = await toPng(cardEl, { pixelRatio: 3, cacheBust: true });

      const widthPx = activeTableDesign.cardWidth || 340;
      const heightPx = cardEl.offsetHeight || 480;

      const widthMm = widthPx * 0.264583;
      const heightMm = heightPx * 0.264583;

      const pdf = new jsPDF({
        orientation: widthMm > heightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm + 10, heightMm + 10]
      });

      pdf.addImage(dataUrl, "PNG", 5, 5, widthMm, heightMm);
      pdf.save(`${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${selectedTableQR.name.replace(/[^a-z0-9]/gi, "_")}_QR.pdf`);

      showToast("PDF saved successfully!", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("Failed to generate PDF", "error");
    }
  };

  return (
    <main className="admin-content-area" id="admin-tables-content">
      <div className="dashboard-header flex justify-between align-center flex-wrap gap-2" id="admin-tables-header">
        <div>
          <h1 style={{ fontSize: "2rem" }}>
            {settings.restaurantName ? `${settings.restaurantName} - Table & QR Manager` : "Table & QR Manager"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Register dining tables, customize branded QR codes, and export print-ready table tags.
          </p>
        </div>

        <Link to="/admin/qr-designer" className="btn btn-primary" style={{ gap: "8px", fontWeight: "700" }}>
          <Palette size={18} /> Open QR Designer Studio
        </Link>
      </div>

      {/* Layout Grid */}
      <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr", gap: "32px", alignItems: "start" }}>
        {/* Create Table Form & List */}
        <div className="card" id="tables-list-panel">
          <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Table size={18} /> Dining Tables ({tables.length})
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
            {tables.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No tables created yet. Add your first table above!
              </div>
            ) : (
              tables.map((t) => {
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
                      <button className="btn-icon" onClick={() => setSelectedTableQR(t)} style={{ width: "32px", height: "32px" }} title="Show QR Tag">
                        <QrCode size={14} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDeleteTable(t.id, t.name)} style={{ width: "32px", height: "32px", color: "var(--status-cancelled)" }} title="Delete Table">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Table QR Card Console */}
        <div style={{ position: "sticky", top: "96px" }} id="table-qr-console-panel">
          {selectedTableQR ? (
            <div className="card" style={{ padding: "24px", textAlign: "center", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="flex justify-between align-center">
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800" }}>{selectedTableQR.name} Card</h3>
                <Link to="/admin/qr-designer" style={{ fontSize: "0.8rem", color: "var(--primary-color)", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Palette size={14} /> Customize Design
                </Link>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                Complete rendered QR tag for {selectedTableQR.name}.
              </p>

              {/* QR Rendered Card Container */}
              <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                <QrCardComponent
                  table={selectedTableQR}
                  design={activeTableDesign}
                  settings={settings}
                  appBaseUrl={appBaseUrl}
                  customId={`table-card-export-${selectedTableQR.id}`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap justify-center" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <button className="btn btn-outline" onClick={handleDownloadPNG} style={{ gap: "6px", fontSize: "0.82rem" }}>
                  <Download size={14} /> PNG
                </button>
                <button className="btn btn-outline" onClick={handleDownloadSVG} style={{ gap: "6px", fontSize: "0.82rem" }}>
                  <Download size={14} /> SVG
                </button>
                <button className="btn btn-outline" onClick={handleSavePDF} style={{ gap: "6px", fontSize: "0.82rem", color: "#2563eb", borderColor: "#2563eb" }}>
                  <FileText size={14} /> PDF
                </button>
                <button className="btn btn-primary" onClick={handlePrintQR} style={{ gap: "6px", fontSize: "0.82rem", fontWeight: "700" }}>
                  <Printer size={14} /> Print
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <button className="btn btn-outline" onClick={() => copyToClipboard(getTableScanUrl(selectedTableQR.name))} style={{ gap: "8px", width: "100%", justifyContent: "center" }}>
                  <Clipboard size={14} /> Copy Table Order Link
                </button>

                <a
                  href={getTableScanUrl(selectedTableQR.name)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "0.85rem", color: "var(--secondary-color)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: "600" }}
                >
                  Test Table Menu Link <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
              <QrCode size={48} style={{ margin: "0 auto 16px" }} />
              <h3>No Table Selected</h3>
              <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Select any table on the left side to review, print, or export its QR card.</p>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED PRINT AREA */}
      {selectedTableQR && (
        <div className="print-only-container" id="printable-qr-sticker">
          <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
            <QrCardComponent
              table={selectedTableQR}
              design={activeTableDesign}
              settings={settings}
              appBaseUrl={appBaseUrl}
              isPrint={true}
            />
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-sticker, #printable-qr-sticker * {
            visibility: visible !important;
          }
          #printable-qr-sticker {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          @page {
            margin: 10mm;
            size: auto;
          }
          .qr-card-rendered {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
}
