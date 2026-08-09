import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, writeBatch, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { handleFirestoreError, OperationType } from "../../firebase/errorHandler.js";
import { QRCodeSVG } from "qrcode.react";
import { toPng, toSvg } from "html-to-image";
import jsPDF from "jspdf";
import {
  Palette,
  Printer,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  Layout,
  Type,
  ImageIcon,
  Sliders,
  Check,
  FileText,
  Layers,
  CheckCircle2,
  Table as TableIcon
} from "lucide-react";

// Default QR Design Configuration
export const DEFAULT_QR_DESIGN = {
  template: "modern",
  
  // QR Engine Colors & Geometry (NO LOGO INSIDE QR)
  qrColor: "#1e293b",
  qrBgColor: "#ffffff",
  qrSize: 180,
  qrMargin: 12,
  dotStyle: "square", // square, rounded
  
  // Header Logo & Branding (OUTSIDE QR)
  showLogo: true,
  logoUrl: "",
  showRestaurantName: true,
  restaurantNameText: "",
  
  // Typography & Labels
  headingText: "Scan to View Menu & Order",
  subtitleText: "Point your phone camera to order food & drinks directly from your table.",
  tablePrefix: "TABLE",
  ctaBadgeText: "⚡ SCAN TO ORDER ⚡",
  fontFamily: "Plus Jakarta Sans, sans-serif",
  fontSizeScale: "md", // sm, md, lg, xl
  textColor: "#334155",
  headingColor: "#0f172a",
  textAlign: "center",
  
  // Card Frame Layout
  cardVariant: "standard", // standard, tent, sticker, dark
  cardWidth: 340,
  cardBgType: "solid", // solid, gradient, dark
  cardBgColor: "#ffffff",
  cardGradient: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 20,
  cardShadow: "elevated", // none, soft, elevated, glowing, deep
  spacing: "normal", // compact, normal, spacious
  accentColor: "#e63946"
};

// 11 Ready-Made Design Templates
export const TEMPLATE_PRESETS = [
  {
    id: "minimal",
    name: "Minimal",
    desc: "Clean monochrome layout with crisp typography and subtle borders",
    settings: {
      template: "minimal",
      qrColor: "#0f172a",
      qrBgColor: "#ffffff",
      qrSize: 170,
      qrMargin: 8,
      dotStyle: "square",
      showLogo: true,
      headingText: "Menu & Ordering",
      subtitleText: "Scan with your phone camera to browse and order.",
      tablePrefix: "TABLE",
      ctaBadgeText: "SCAN HERE",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#475569",
      headingColor: "#0f172a",
      cardVariant: "standard",
      cardWidth: 320,
      cardBgType: "solid",
      cardBgColor: "#ffffff",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "#cbd5e1",
      borderRadius: 12,
      cardShadow: "soft",
      accentColor: "#0f172a"
    }
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Vibrant brand colors with floating badge and soft cards",
    settings: {
      template: "modern",
      qrColor: "#1e293b",
      qrBgColor: "#ffffff",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "rounded",
      showLogo: true,
      headingText: "Scan to View Menu & Order",
      subtitleText: "Instant contactless ordering right from your table.",
      tablePrefix: "TABLE",
      ctaBadgeText: "⚡ SCAN TO ORDER ⚡",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#334155",
      headingColor: "#0f172a",
      cardVariant: "standard",
      cardWidth: 350,
      cardBgType: "solid",
      cardBgColor: "#ffffff",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: "#f1f5f9",
      borderRadius: 20,
      cardShadow: "elevated",
      accentColor: "#e63946"
    }
  },
  {
    id: "premium",
    name: "Premium Gold",
    desc: "Luxurious dark gold aesthetic with serif title lettering",
    settings: {
      template: "premium",
      qrColor: "#18181b",
      qrBgColor: "#fafaf9",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "square",
      showLogo: true,
      headingText: "Exclusive Dining Experience",
      subtitleText: "Scan to discover our chef's signature menu & reserve orders.",
      tablePrefix: "TABLE",
      ctaBadgeText: "❖ TOUCHLESS MENU ❖",
      fontFamily: "Georgia, serif",
      textColor: "#d1d5db",
      headingColor: "#fef08a",
      cardVariant: "dark",
      cardWidth: 360,
      cardBgType: "dark",
      cardBgColor: "#121214",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: "#d4af37",
      borderRadius: 16,
      cardShadow: "glowing",
      accentColor: "#d4af37"
    }
  },
  {
    id: "classic",
    name: "Classic Bistro",
    desc: "Traditional eatery feel with double border and bold typography",
    settings: {
      template: "classic",
      qrColor: "#7f1d1d",
      qrBgColor: "#ffffff",
      qrSize: 185,
      qrMargin: 10,
      dotStyle: "square",
      showLogo: true,
      headingText: "Scan For Our Digital Menu",
      subtitleText: "Browse food items, customize your order, and request service.",
      tablePrefix: "TABLE NO.",
      ctaBadgeText: "DIGITAL MENU",
      fontFamily: "Georgia, serif",
      textColor: "#334155",
      headingColor: "#7f1d1d",
      cardVariant: "standard",
      cardWidth: 340,
      cardBgType: "solid",
      cardBgColor: "#fffbfb",
      borderWidth: 4,
      borderStyle: "double",
      borderColor: "#991b1b",
      borderRadius: 8,
      cardShadow: "soft",
      accentColor: "#991b1b"
    }
  },
  {
    id: "cafe",
    name: "Cozy Cafe",
    desc: "Warm cream & coffee tones with friendly rounded corners",
    settings: {
      template: "cafe",
      qrColor: "#451a03",
      qrBgColor: "#fffbeb",
      qrSize: 175,
      qrMargin: 10,
      dotStyle: "rounded",
      showLogo: true,
      headingText: "Fresh Bakes & Coffee Menu",
      subtitleText: "Scan to order your favorite coffee, drinks & breakfast specials.",
      tablePrefix: "TABLE",
      ctaBadgeText: "☕ SCAN & ORDER",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#78350f",
      headingColor: "#451a03",
      cardVariant: "standard",
      cardWidth: 330,
      cardBgType: "solid",
      cardBgColor: "#fef3c7",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: "#fde68a",
      borderRadius: 24,
      cardShadow: "soft",
      accentColor: "#b45309"
    }
  },
  {
    id: "restaurant",
    name: "Fine Dining",
    desc: "Refined navy & crimson style for fine dining establishments",
    settings: {
      template: "restaurant",
      qrColor: "#0f172a",
      qrBgColor: "#ffffff",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "square",
      showLogo: true,
      headingText: "Digital Table Menu",
      subtitleText: "Select your food and place orders directly to our kitchen.",
      tablePrefix: "TABLE",
      ctaBadgeText: "SCAN TO ORDER FOOD",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#334155",
      headingColor: "#1e3a8a",
      cardVariant: "standard",
      cardWidth: 350,
      cardBgType: "solid",
      cardBgColor: "#ffffff",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: "#cbd5e1",
      borderRadius: 16,
      cardShadow: "elevated",
      accentColor: "#1e3a8a"
    }
  },
  {
    id: "elegant",
    name: "Elegant Emerald",
    desc: "Sophisticated deep indigo and emerald color palette",
    settings: {
      template: "elegant",
      qrColor: "#064e3b",
      qrBgColor: "#ecfdf5",
      qrSize: 180,
      qrMargin: 10,
      dotStyle: "rounded",
      showLogo: true,
      headingText: "Scan to Order Online",
      subtitleText: "Place your order instantly and enjoy tabletop service.",
      tablePrefix: "TABLE",
      ctaBadgeText: "✦ CONTACTLESS MENU ✦",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#065f46",
      headingColor: "#064e3b",
      cardVariant: "standard",
      cardWidth: 340,
      cardBgType: "solid",
      cardBgColor: "#f0fdf4",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: "#a7f3d0",
      borderRadius: 20,
      cardShadow: "elevated",
      accentColor: "#059669"
    }
  },
  {
    id: "dark",
    name: "Dark Luxury",
    desc: "Sleek dark theme with high contrast cyan accents",
    settings: {
      template: "dark",
      qrColor: "#0f172a",
      qrBgColor: "#ffffff",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "square",
      showLogo: true,
      headingText: "Scan to Order & Pay",
      subtitleText: "Enjoy instant digital ordering right from your device.",
      tablePrefix: "TABLE",
      ctaBadgeText: "⚡ SCAN NOW ⚡",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#94a3b8",
      headingColor: "#f8fafc",
      cardVariant: "dark",
      cardWidth: 340,
      cardBgType: "dark",
      cardBgColor: "#0f172a",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: "#334155",
      borderRadius: 20,
      cardShadow: "glowing",
      accentColor: "#38bdf8"
    }
  },
  {
    id: "light",
    name: "Crisp Light",
    desc: "Ultra clean white layout with soft shadow and crisp lines",
    settings: {
      template: "light",
      qrColor: "#1e293b",
      qrBgColor: "#ffffff",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "rounded",
      showLogo: true,
      headingText: "Scan for Menu & Specials",
      subtitleText: "Fast, contactless food & drink ordering.",
      tablePrefix: "TABLE",
      ctaBadgeText: "SCAN TO ORDER",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#475569",
      headingColor: "#0f172a",
      cardVariant: "standard",
      cardWidth: 330,
      cardBgType: "solid",
      cardBgColor: "#ffffff",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "#e2e8f0",
      borderRadius: 24,
      cardShadow: "elevated",
      accentColor: "#2563eb"
    }
  },
  {
    id: "tent",
    name: "Table Tent Foldable",
    desc: "Dual-sided printable tent card designed for table centerpieces",
    settings: {
      template: "tent",
      qrColor: "#1e293b",
      qrBgColor: "#ffffff",
      qrSize: 160,
      qrMargin: 10,
      dotStyle: "square",
      showLogo: true,
      headingText: "Scan to View Menu",
      subtitleText: "Place orders directly from your phone.",
      tablePrefix: "TABLE",
      ctaBadgeText: "ORDER HERE",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#334155",
      headingColor: "#0f172a",
      cardVariant: "tent",
      cardWidth: 320,
      cardBgType: "solid",
      cardBgColor: "#ffffff",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: "#e2e8f0",
      borderRadius: 16,
      cardShadow: "soft",
      accentColor: "#e63946"
    }
  },
  {
    id: "sticker",
    name: "Sticker Badge",
    desc: "Rounded die-cut sticker badge format for table corners",
    settings: {
      template: "sticker",
      qrColor: "#111827",
      qrBgColor: "#ffffff",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "rounded",
      showLogo: true,
      headingText: "Scan & Order",
      subtitleText: "Order food & drinks directly",
      tablePrefix: "TABLE",
      ctaBadgeText: "SCAN ME ➔",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      textColor: "#374151",
      headingColor: "#111827",
      cardVariant: "sticker",
      cardWidth: 310,
      cardBgType: "solid",
      cardBgColor: "#ffffff",
      borderWidth: 4,
      borderStyle: "solid",
      borderColor: "#e63946",
      borderRadius: 36,
      cardShadow: "elevated",
      accentColor: "#e63946"
    }
  }
];

// Single Reusable QR Card Component (Source of Truth)
export function QrCardComponent({ table, design, settings, appBaseUrl, isPrint = false, customId }) {
  const tableName = table?.name || "Table 1";
  
  // Dynamic scan URL using the exact customer routing logic
  const scanUrl = settings?.activeRestaurantId && settings?.activeRestaurantId !== "default"
    ? `${appBaseUrl}/menu/${settings.activeRestaurantId}/${encodeURIComponent(tableName)}`
    : `${appBaseUrl}/menu?table=${encodeURIComponent(tableName)}`;

  const effectiveLogoUrl = design.logoUrl || settings?.restaurantLogo || "";
  const effectiveRestaurantName = design.restaurantNameText || settings?.restaurantName || "EasyOrder Bistro";

  const shadowMap = {
    none: "none",
    soft: "0 4px 12px rgba(0, 0, 0, 0.05)",
    elevated: "0 10px 30px rgba(0, 0, 0, 0.12)",
    glowing: `0 0 25px ${design.accentColor || "#e63946"}40`,
    deep: "0 20px 40px rgba(0, 0, 0, 0.25)"
  };

  const cardStyle = {
    width: `${design.cardWidth || 340}px`,
    maxWidth: "100%",
    backgroundColor: design.cardBgColor || "#ffffff",
    background: design.cardBgType === "gradient" ? (design.cardGradient || "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)") : (design.cardBgColor || "#ffffff"),
    border: `${design.borderWidth ?? 2}px ${design.borderStyle || "solid"} ${design.borderColor || "#e2e8f0"}`,
    borderRadius: `${design.borderRadius ?? 20}px`,
    boxShadow: isPrint ? "none" : (shadowMap[design.cardShadow] || shadowMap.elevated),
    padding: design.spacing === "compact" ? "18px 16px" : design.spacing === "spacious" ? "32px 28px" : "24px 20px",
    textAlign: design.textAlign || "center",
    fontFamily: design.fontFamily || "Plus Jakarta Sans, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: design.textAlign === "left" ? "flex-start" : design.textAlign === "right" ? "flex-end" : "center",
    gap: design.spacing === "compact" ? "10px" : design.spacing === "spacious" ? "18px" : "14px",
    color: design.textColor || "#334155",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact"
  };

  return (
    <div
      className={`qr-card-rendered ${design.cardVariant || "standard"}`}
      style={cardStyle}
      id={customId || `qr-card-${table?.id || "preview"}`}
    >
      {/* Table Tent Fold Indicator */}
      {design.cardVariant === "tent" && (
        <div style={{
          width: "100%",
          padding: "6px 0",
          borderBottom: "2px dashed #cbd5e1",
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#94a3b8",
          textAlign: "center",
          marginBottom: "8px"
        }}>
          ✂ Fold Here (Table Tent Top)
        </div>
      )}

      {/* Restaurant Branding Header (Logo OUTSIDE QR) */}
      {design.showRestaurantName && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: design.textAlign === "left" ? "flex-start" : design.textAlign === "right" ? "flex-end" : "center" }}>
          {design.showLogo && effectiveLogoUrl && (
            <img
              src={effectiveLogoUrl}
              alt="Restaurant Logo"
              style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <span style={{
            fontSize: design.fontSizeScale === "sm" ? "0.95rem" : design.fontSizeScale === "lg" ? "1.25rem" : design.fontSizeScale === "xl" ? "1.4rem" : "1.1rem",
            fontWeight: "800",
            color: design.headingColor || "#0f172a",
            letterSpacing: "-0.2px"
          }}>
            {effectiveRestaurantName}
          </span>
        </div>
      )}

      {/* Table Number Badge (ALWAYS DISPLAYED) */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: `${design.accentColor || "#e63946"}18`,
        color: design.accentColor || "#e63946",
        border: `1.5px solid ${design.accentColor || "#e63946"}40`,
        padding: "5px 16px",
        borderRadius: "20px",
        fontSize: "0.9rem",
        fontWeight: "800",
        letterSpacing: "0.5px",
        textTransform: "uppercase"
      }}>
        <span>{design.tablePrefix || "TABLE"} {tableName}</span>
      </div>

      {/* Custom Heading */}
      {design.headingText && (
        <h3 style={{
          fontSize: design.fontSizeScale === "sm" ? "1rem" : design.fontSizeScale === "lg" ? "1.3rem" : design.fontSizeScale === "xl" ? "1.45rem" : "1.15rem",
          fontWeight: "800",
          color: design.headingColor || "#0f172a",
          margin: 0,
          lineHeight: "1.3"
        }}>
          {design.headingText}
        </h3>
      )}

      {/* CLEAN QR CODE CONTAINER - NO LOGO INSIDE QR */}
      <div style={{
        padding: `${design.qrMargin ?? 12}px`,
        backgroundColor: design.qrBgColor || "#ffffff",
        borderRadius: design.dotStyle === "rounded" ? "16px" : "10px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        display: "inline-block",
        margin: "4px 0"
      }}>
        <QRCodeSVG
          value={scanUrl}
          size={design.qrSize || 180}
          fgColor={design.qrColor || "#1e293b"}
          bgColor={design.qrBgColor || "#ffffff"}
          level="H"
        />
      </div>

      {/* Custom Subtitle */}
      {design.subtitleText && (
        <p style={{
          fontSize: design.fontSizeScale === "sm" ? "0.75rem" : design.fontSizeScale === "lg" ? "0.92rem" : "0.82rem",
          lineHeight: "1.4",
          margin: 0,
          color: design.textColor || "#334155",
          opacity: 0.9
        }}>
          {design.subtitleText}
        </p>
      )}

      {/* CTA Badge */}
      {design.ctaBadgeText && (
        <div style={{
          backgroundColor: design.accentColor || "#e63946",
          color: "#ffffff",
          padding: "6px 18px",
          borderRadius: "24px",
          fontSize: "0.78rem",
          fontWeight: "800",
          letterSpacing: "0.5px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
        }}>
          {design.ctaBadgeText}
        </div>
      )}

      <span style={{ fontSize: "0.68rem", opacity: 0.6, letterSpacing: "0.3px", marginTop: "2px" }}>
        EasyOrder QR Dining
      </span>
    </div>
  );
}

export default function QrDesigner() {
  const { settings, activeRestaurantId } = useSettings();
  const { showToast } = useToast();

  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingBatch, setApplyingBatch] = useState(false);

  // Active design configuration state
  const [design, setDesign] = useState(DEFAULT_QR_DESIGN);
  
  // Control Panel Tabs
  const [activeTab, setActiveTab] = useState("presets");

  const appBaseUrl = window.location.origin;

  const tablesColPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/tables`
    : "tables";

  const qrSettingsDocPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/settings/qrDesigner`
    : "settings/qrDesigner";

  // Load Tables & Restaurant QR Design Settings
  useEffect(() => {
    if (!activeRestaurantId) return;

    setLoading(true);

    const q = query(collection(db, tablesColPath), orderBy("name", "asc"));
    const unsubTables = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setTables(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "tables");
      }
    );

    const docRef = doc(db, qrSettingsDocPath);
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setDesign((prev) => ({ ...prev, ...docSnap.data() }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not load default QR design, using defaults:", err);
        setLoading(false);
      });

    return () => {
      unsubTables();
    };
  }, [activeRestaurantId, tablesColPath, qrSettingsDocPath]);

  // Upload Logo for Card Header
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo image size must be under 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setDesign((prev) => ({ ...prev, logoUrl: dataUrl, showLogo: true }));
        showToast("Custom header logo uploaded successfully!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply Template Preset
  const applyPreset = (preset) => {
    setDesign((prev) => ({
      ...prev,
      ...preset.settings
    }));
    showToast(`Applied '${preset.name}' template!`, "success");
  };

  // Save Design as Restaurant Default
  const handleSaveDefaultDesign = async () => {
    if (!activeRestaurantId) {
      showToast("No active restaurant selected", "error");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, qrSettingsDocPath);
      await setDoc(docRef, {
        ...design,
        isDefault: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showToast("Default QR Design saved for this restaurant!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "qrDesigner");
    } finally {
      setSaving(false);
    }
  };

  // Apply Design to All Existing Tables in Firestore
  const handleApplyToAllExistingTables = async () => {
    if (!activeRestaurantId) return;

    if (!window.confirm("Apply this QR design to all existing tables in this restaurant?")) {
      return;
    }

    setApplyingBatch(true);
    try {
      const snapshot = await getDocs(collection(db, tablesColPath));
      const batch = writeBatch(db);

      snapshot.forEach((tableDoc) => {
        batch.update(doc(db, tablesColPath, tableDoc.id), {
          qrDesign: design,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();

      // Also save as default
      const docRef = doc(db, qrSettingsDocPath);
      await setDoc(docRef, { ...design, isDefault: true, updatedAt: new Date().toISOString() }, { merge: true });

      showToast(`Updated design for all ${snapshot.size} existing tables!`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "tables/batchUpdate");
    } finally {
      setApplyingBatch(false);
    }
  };

  // Reset Design Controls
  const handleResetDesign = () => {
    if (window.confirm("Reset design controls to default settings?")) {
      setDesign(DEFAULT_QR_DESIGN);
      showToast("Design reset to default", "info");
    }
  };

  // Selected table for preview
  const activeTableForPreview = selectedTableId === "all"
    ? (tables.length > 0 ? tables[0] : { id: "preview-1", name: "Table 1" })
    : (tables.find((t) => t.id === selectedTableId) || { id: "preview-1", name: "Table 1" });

  const effectiveRestaurantName = design.restaurantNameText || settings.restaurantName || "EasyOrder Bistro";

  // Download Complete QR Card as PNG
  const handleDownloadPNG = async (targetTable) => {
    const cardElement = document.getElementById(`qr-card-${targetTable?.id || "preview"}`);
    if (!cardElement) {
      showToast("QR card element not found", "error");
      return;
    }

    try {
      const dataUrl = await toPng(cardElement, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: design.cardBgColor || "#ffffff"
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${(targetTable?.name || "Table").replace(/[^a-z0-9]/gi, "_")}_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast("PNG downloaded successfully!", "success");
    } catch (err) {
      console.error("PNG generation error:", err);
      showToast("Failed to download PNG image", "error");
    }
  };

  // Download Complete QR Card as SVG
  const handleDownloadSVG = async (targetTable) => {
    const cardElement = document.getElementById(`qr-card-${targetTable?.id || "preview"}`);
    if (!cardElement) {
      showToast("QR card element not found", "error");
      return;
    }

    try {
      const dataUrl = await toSvg(cardElement, { cacheBust: true });

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${(targetTable?.name || "Table").replace(/[^a-z0-9]/gi, "_")}_QR.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast("SVG exported successfully!", "success");
    } catch (err) {
      console.error("SVG generation error:", err);
      showToast("Failed to export SVG file", "error");
    }
  };

  // Save Complete QR Card as High-Quality PDF
  const handleSavePDF = async (targetTable, isBatch = false) => {
    try {
      showToast("Generating PDF...", "info");

      if (!isBatch) {
        const cardElement = document.getElementById(`qr-card-${targetTable?.id || "preview"}`);
        if (!cardElement) {
          showToast("QR card element not found", "error");
          return;
        }

        const dataUrl = await toPng(cardElement, { pixelRatio: 3, cacheBust: true });

        const widthPx = design.cardWidth || 340;
        const heightPx = cardElement.offsetHeight || 480;

        // Convert px to mm
        const widthMm = widthPx * 0.264583;
        const heightMm = heightPx * 0.264583;

        const pdf = new jsPDF({
          orientation: widthMm > heightMm ? "landscape" : "portrait",
          unit: "mm",
          format: [widthMm + 10, heightMm + 10]
        });

        pdf.addImage(dataUrl, "PNG", 5, 5, widthMm, heightMm);
        pdf.save(`${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${(targetTable?.name || "Table").replace(/[^a-z0-9]/gi, "_")}_QR.pdf`);

        showToast("PDF generated and saved!", "success");
      } else {
        // Batch PDF for All Tables
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const activeTablesList = tables.length > 0 ? tables : [{ id: "preview-1", name: "Table 1" }];

        for (let i = 0; i < activeTablesList.length; i++) {
          const tbl = activeTablesList[i];
          const cardElement = document.getElementById(`print-qr-card-${tbl.id}`);
          if (cardElement) {
            const dataUrl = await toPng(cardElement, { pixelRatio: 3, cacheBust: true });

            if (i > 0) pdf.addPage();

            const widthPx = design.cardWidth || 340;
            const heightPx = cardElement.offsetHeight || 480;
            const widthMm = widthPx * 0.264583;
            const heightMm = heightPx * 0.264583;

            const xPos = (210 - widthMm) / 2;
            const yPos = (297 - heightMm) / 2;

            pdf.addImage(dataUrl, "PNG", xPos > 0 ? xPos : 10, yPos > 0 ? yPos : 10, widthMm, heightMm);
          }
        }

        pdf.save(`${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_ALL_TABLES_QR.pdf`);
        showToast("All tables saved into PDF successfully!", "success");
      }
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("Error generating PDF file", "error");
    }
  };

  // Trigger Browser Print
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <main className="admin-content-area" id="qr-designer-main-studio">
      {/* Header */}
      <div className="dashboard-header flex justify-between align-center flex-wrap gap-3" id="qr-designer-header">
        <div>
          <h1 style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <Palette size={26} style={{ color: "var(--primary-color)" }} />
            QR Design Studio
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Create customized, scannable QR card designs for your restaurant tables.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            className="btn btn-outline"
            onClick={handleResetDesign}
            style={{ gap: "6px" }}
            id="qr-designer-reset-btn"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            className="btn btn-outline"
            onClick={handleApplyToAllExistingTables}
            disabled={applyingBatch}
            style={{ gap: "6px" }}
            id="qr-designer-apply-all-btn"
          >
            <Layers size={16} /> {applyingBatch ? "Applying..." : "Apply to All Existing Tables"}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveDefaultDesign}
            disabled={saving}
            style={{ gap: "6px", fontWeight: "700" }}
            id="qr-designer-save-default-btn"
          >
            <Save size={16} /> {saving ? "Saving..." : "Set as Default QR Design"}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div
        className="studio-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.15fr",
          gap: "24px",
          alignItems: "start",
          width: "100%"
        }}
      >
        {/* LEFT PANEL: CONTROLS & CUSTOMIZER */}
        <div className="card studio-controls-card" style={{ padding: "20px" }} id="qr-controls-card">
          {/* Navigation Tabs */}
          <div
            className="flex gap-1 flex-wrap"
            style={{
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "12px",
              marginBottom: "20px"
            }}
            id="qr-studio-control-tabs"
          >
            {[
              { id: "presets", label: "Templates", icon: <Sparkles size={15} /> },
              { id: "qr", label: "QR Engine", icon: <Sliders size={15} /> },
              { id: "branding", label: "Logo & Name", icon: <ImageIcon size={15} /> },
              { id: "typography", label: "Typography", icon: <Type size={15} /> },
              { id: "card", label: "Card Frame", icon: <Layout size={15} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-outline"}`}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  gap: "6px",
                  borderRadius: "20px"
                }}
                id={`tab-control-${tab.id}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: PRESET TEMPLATES */}
          {activeTab === "presets" && (
            <div className="tab-panel" id="panel-presets">
              <h3 style={{ fontSize: "1rem", marginBottom: "8px", fontWeight: "700" }}>Ready-Made Design Presets</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Select a template preset to instantly apply professional colors, borders, and typography.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px"
                }}
              >
                {TEMPLATE_PRESETS.map((p) => {
                  const isSelected = design.template === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        border: isSelected ? "2px solid var(--primary-color)" : "1.5px solid var(--border-color)",
                        backgroundColor: isSelected ? "rgba(230, 57, 70, 0.05)" : "var(--surface-hover)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative"
                      }}
                      className="preset-card-item"
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            backgroundColor: "var(--primary-color)",
                            color: "#ffffff",
                            borderRadius: "50%",
                            padding: "2px"
                          }}
                        >
                          <Check size={12} />
                        </div>
                      )}
                      <h4 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "4px" }}>{p.name}</h4>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: "1.3" }}>{p.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE COLORS & ENGINE */}
          {activeTab === "qr" && (
            <div className="tab-panel flex flex-col gap-3" id="panel-qr-engine">
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>QR Code Colors & Size</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Keep high contrast between QR dots and QR background to guarantee maximum camera scannability.
              </p>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>QR Dots Color</label>
                  <div className="flex align-center gap-2">
                    <input
                      type="color"
                      value={design.qrColor}
                      onChange={(e) => setDesign((prev) => ({ ...prev, qrColor: e.target.value }))}
                      style={{ width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      value={design.qrColor}
                      onChange={(e) => setDesign((prev) => ({ ...prev, qrColor: e.target.value }))}
                      style={{ fontSize: "0.8rem", padding: "6px" }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>QR Background</label>
                  <div className="flex align-center gap-2">
                    <input
                      type="color"
                      value={design.qrBgColor}
                      onChange={(e) => setDesign((prev) => ({ ...prev, qrBgColor: e.target.value }))}
                      style={{ width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      value={design.qrBgColor}
                      onChange={(e) => setDesign((prev) => ({ ...prev, qrBgColor: e.target.value }))}
                      style={{ fontSize: "0.8rem", padding: "6px" }}
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Brand Accent Color (Badges & Highlights)</label>
                <div className="flex align-center gap-2">
                  <input
                    type="color"
                    value={design.accentColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, accentColor: e.target.value }))}
                    style={{ width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    value={design.accentColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, accentColor: e.target.value }))}
                    style={{ fontSize: "0.8rem", padding: "6px" }}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="flex justify-between align-center">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>QR Dimension Size</label>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>{design.qrSize}px</span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="280"
                  step="5"
                  value={design.qrSize}
                  onChange={(e) => setDesign((prev) => ({ ...prev, qrSize: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "var(--primary-color)" }}
                />
              </div>

              <div className="input-group">
                <div className="flex justify-between align-center">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>QR Container Inner Padding</label>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>{design.qrMargin}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="2"
                  value={design.qrMargin}
                  onChange={(e) => setDesign((prev) => ({ ...prev, qrMargin: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "var(--primary-color)" }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Dot Corners Style</label>
                <div className="flex gap-2">
                  {["square", "rounded"].map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`btn ${design.dotStyle === style ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setDesign((prev) => ({ ...prev, dotStyle: style }))}
                      style={{ flex: 1, textTransform: "capitalize", fontSize: "0.8rem", padding: "6px" }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & LOGO */}
          {activeTab === "branding" && (
            <div className="tab-panel flex flex-col gap-3" id="panel-branding">
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Restaurant Logo & Header Branding</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                The logo displays clearly in the card header alongside your restaurant name.
              </p>

              <div className="input-group">
                <label className="flex align-center gap-2 cursor-pointer" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={design.showLogo}
                    onChange={(e) => setDesign((prev) => ({ ...prev, showLogo: e.target.checked }))}
                  />
                  <span>Show Logo in Header</span>
                </label>
              </div>

              {design.showLogo && (
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Upload Header Logo Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="input-field"
                    style={{ fontSize: "0.8rem" }}
                  />
                </div>
              )}

              <div className="input-group" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "8px" }}>
                <label className="flex align-center gap-2 cursor-pointer" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={design.showRestaurantName}
                    onChange={(e) => setDesign((prev) => ({ ...prev, showRestaurantName: e.target.checked }))}
                  />
                  <span>Show Restaurant Name in Header</span>
                </label>
              </div>

              {design.showRestaurantName && (
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Restaurant Display Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. EasyOrder Bistro"
                    value={design.restaurantNameText}
                    onChange={(e) => setDesign((prev) => ({ ...prev, restaurantNameText: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TYPOGRAPHY & TEXT LABELS */}
          {activeTab === "typography" && (
            <div className="tab-panel flex flex-col gap-3" id="panel-typography">
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Card Labels & Typography</h3>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Table Number Prefix</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. TABLE or TABLE NO."
                  value={design.tablePrefix}
                  onChange={(e) => setDesign((prev) => ({ ...prev, tablePrefix: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Main Heading Text</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Scan to View Menu & Order"
                  value={design.headingText}
                  onChange={(e) => setDesign((prev) => ({ ...prev, headingText: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Subtitle / Instruction Text</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Point camera to order food & drinks"
                  value={design.subtitleText}
                  onChange={(e) => setDesign((prev) => ({ ...prev, subtitleText: e.target.value }))}
                  style={{ fontSize: "0.82rem" }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>CTA Badge Text</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. ⚡ SCAN TO ORDER ⚡"
                  value={design.ctaBadgeText}
                  onChange={(e) => setDesign((prev) => ({ ...prev, ctaBadgeText: e.target.value }))}
                />
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Heading Color</label>
                  <input
                    type="color"
                    value={design.headingColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, headingColor: e.target.value }))}
                    style={{ width: "100%", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Body Text Color</label>
                  <input
                    type="color"
                    value={design.textColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, textColor: e.target.value }))}
                    style={{ width: "100%", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Font Family</label>
                <select
                  className="input-field"
                  value={design.fontFamily}
                  onChange={(e) => setDesign((prev) => ({ ...prev, fontFamily: e.target.value }))}
                  style={{ fontSize: "0.85rem" }}
                >
                  <option value="Plus Jakarta Sans, sans-serif">Modern Sans (Plus Jakarta)</option>
                  <option value="Georgia, serif">Luxury Serif (Georgia)</option>
                  <option value="Inter, sans-serif">Clean Tech (Inter)</option>
                  <option value="Space Grotesk, sans-serif">Display Geometric (Space Grotesk)</option>
                  <option value="Courier New, monospace">Classic Monospace</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 5: CARD FRAME & LAYOUT */}
          {activeTab === "card" && (
            <div className="tab-panel flex flex-col gap-3" id="panel-card-layout">
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Card Container & Borders</h3>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Card Variant Format</label>
                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "standard", label: "Standard Card" },
                    { id: "tent", label: "Table Tent" },
                    { id: "sticker", label: "Sticker Badge" },
                    { id: "dark", label: "Dark Elegance" }
                  ].map((varItem) => (
                    <button
                      key={varItem.id}
                      type="button"
                      className={`btn ${design.cardVariant === varItem.id ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setDesign((prev) => ({ ...prev, cardVariant: varItem.id }))}
                      style={{ fontSize: "0.78rem", padding: "8px" }}
                    >
                      {varItem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <div className="flex justify-between align-center">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Card Width</label>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>{design.cardWidth}px</span>
                </div>
                <input
                  type="range"
                  min="280"
                  max="420"
                  step="10"
                  value={design.cardWidth}
                  onChange={(e) => setDesign((prev) => ({ ...prev, cardWidth: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "var(--primary-color)" }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Card Background Fill</label>
                <div className="flex align-center gap-2">
                  <input
                    type="color"
                    value={design.cardBgColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, cardBgColor: e.target.value }))}
                    style={{ width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    value={design.cardBgColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, cardBgColor: e.target.value }))}
                    style={{ fontSize: "0.8rem", padding: "6px" }}
                  />
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Border Width</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="input-field"
                    value={design.borderWidth}
                    onChange={(e) => setDesign((prev) => ({ ...prev, borderWidth: Number(e.target.value) }))}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Border Radius</label>
                  <input
                    type="number"
                    min="0"
                    max="48"
                    className="input-field"
                    value={design.borderRadius}
                    onChange={(e) => setDesign((prev) => ({ ...prev, borderRadius: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Border Color</label>
                <div className="flex align-center gap-2">
                  <input
                    type="color"
                    value={design.borderColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, borderColor: e.target.value }))}
                    style={{ width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    value={design.borderColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, borderColor: e.target.value }))}
                    style={{ fontSize: "0.8rem", padding: "6px" }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Border Style</label>
                <select
                  className="input-field"
                  value={design.borderStyle}
                  onChange={(e) => setDesign((prev) => ({ ...prev, borderStyle: e.target.value }))}
                  style={{ fontSize: "0.82rem" }}
                >
                  <option value="solid">Solid Line</option>
                  <option value="dashed">Dashed Line</option>
                  <option value="dotted">Dotted Line</option>
                  <option value="double">Double Line</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW & EXPORT CONSOLE */}
        <div style={{ position: "sticky", top: "96px" }} id="qr-studio-preview-console">
          <div className="card" style={{ padding: "24px" }} id="qr-preview-wrapper-card">
            <div className="flex justify-between align-center flex-wrap gap-2" style={{ marginBottom: "16px" }}>
              <div className="flex align-center gap-2">
                <h2 style={{ fontSize: "1.1rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                  <TableIcon size={18} style={{ color: "var(--primary-color)" }} />
                  Live Preview
                </h2>
                <span className="badge badge-success" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                  Realtime
                </span>
              </div>

              {/* Table Selector */}
              <div className="flex align-center gap-2">
                <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>Table:</label>
                <select
                  className="input-field"
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  style={{ padding: "4px 8px", fontSize: "0.82rem", minWidth: "120px" }}
                  id="preview-table-select"
                >
                  <option value="all">Table 1 (Default)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Render Area */}
            <div
              style={{
                backgroundColor: "var(--surface-hover)",
                borderRadius: "16px",
                padding: "36px 16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "420px",
                border: "1px dashed var(--border-color)",
                overflow: "auto"
              }}
              id="live-preview-viewport"
            >
              <QrCardComponent
                table={activeTableForPreview}
                design={design}
                settings={settings}
                appBaseUrl={appBaseUrl}
              />
            </div>

            {/* Action Bar for Exports & Print */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)"
              }}
            >
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Export & Print Options
              </span>

              <div className="flex gap-2 flex-wrap justify-between align-center">
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn btn-outline"
                    onClick={() => handleDownloadPNG(activeTableForPreview)}
                    style={{ gap: "6px", fontSize: "0.85rem" }}
                    id="export-png-btn"
                  >
                    <Download size={15} /> Download PNG
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() => handleDownloadSVG(activeTableForPreview)}
                    style={{ gap: "6px", fontSize: "0.85rem" }}
                    id="export-svg-btn"
                  >
                    <Download size={15} /> Download SVG
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() => handleSavePDF(activeTableForPreview, false)}
                    style={{ gap: "6px", fontSize: "0.85rem", color: "#2563eb", borderColor: "#2563eb" }}
                    id="export-pdf-btn"
                  >
                    <FileText size={15} /> Save as PDF
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn btn-primary"
                    onClick={handleTriggerPrint}
                    style={{ gap: "6px", fontSize: "0.85rem", fontWeight: "700" }}
                    id="trigger-print-btn"
                  >
                    <Printer size={15} /> Print QR Card
                  </button>
                </div>
              </div>

              {/* Batch Export Options */}
              {tables.length > 1 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "rgba(230, 57, 70, 0.05)",
                    borderRadius: "10px",
                    border: "1px solid rgba(230, 57, 70, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: "700", display: "block" }}>
                      Batch Export All {tables.length} Tables
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Generates QR cards for Table 1 to Table {tables.length} in a single PDF file.
                    </span>
                  </div>

                  <button
                    className="btn btn-outline"
                    onClick={() => handleSavePDF(null, true)}
                    style={{ gap: "6px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                    id="export-batch-pdf-btn"
                  >
                    <FileText size={14} /> Batch PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINT AREA FOR PRINT MEDIA */}
      <div className="print-only-container" id="qr-designer-print-area">
        {tables.length > 0 ? (
          tables.map((tbl) => (
            <div key={tbl.id} style={{ pageBreakAfter: "always", breakAfter: "page", padding: "10px", display: "flex", justifyContent: "center" }}>
              <QrCardComponent
                table={tbl}
                design={design}
                settings={settings}
                appBaseUrl={appBaseUrl}
                isPrint={true}
                customId={`print-qr-card-${tbl.id}`}
              />
            </div>
          ))
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
            <QrCardComponent
              table={{ id: "preview-1", name: "Table 1" }}
              design={design}
              settings={settings}
              appBaseUrl={appBaseUrl}
              isPrint={true}
              customId="print-qr-card-preview-1"
            />
          </div>
        )}
      </div>

      {/* PRINT CSS STYLES TO ENSURE HIGH-RES COLORS & BACKGROUNDS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #qr-designer-print-area, #qr-designer-print-area * {
            visibility: visible !important;
          }
          #qr-designer-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
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
