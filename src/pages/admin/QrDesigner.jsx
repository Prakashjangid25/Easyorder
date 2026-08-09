import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { handleFirestoreError, OperationType } from "../../firebase/errorHandler.js";
import { QRCodeSVG } from "qrcode.react";
import {
  Palette,
  Printer,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  Layout,
  Type,
  Image as ImageIcon,
  Sliders,
  Eye,
  Check,
  Table as TableIcon,
  ZoomIn,
  ZoomOut,
  Copy,
  ExternalLink,
  Layers,
  X,
  FileCode,
  Grid,
  FileText
} from "lucide-react";

// Default QR Design Configuration
export const DEFAULT_QR_DESIGN = {
  template: "modern",
  
  // QR Engine
  qrColor: "#1e293b",
  qrBgColor: "#ffffff",
  eyeOuterColor: "#e63946",
  eyeInnerColor: "#1e293b",
  qrSize: 180,
  qrMargin: 12,
  dotStyle: "square", // square, rounded, dots
  
  // Logo & Branding
  showLogo: true,
  logoUrl: "",
  logoSize: 42,
  logoBgShape: "circle", // circle, square, none
  logoBgColor: "#ffffff",
  showRestaurantName: true,
  restaurantNameText: "",
  
  // Typography & Labels
  headingText: "Scan to View Menu & Order",
  subtitleText: "Point your phone camera to order food & drinks directly from your table.",
  tablePrefix: "Table",
  ctaBadgeText: "⚡ SCAN TO ORDER ⚡",
  fontFamily: "Plus Jakarta Sans, sans-serif",
  fontSizeScale: "md", // sm, md, lg, xl
  textColor: "#334155",
  headingColor: "#0f172a",
  textAlign: "center",
  
  // Card & Frame Layout
  cardVariant: "standard", // standard, tent, sticker, minimal, luxury
  cardWidth: 340,
  cardBgType: "solid", // solid, gradient, glass, dark
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
      eyeOuterColor: "#0f172a",
      eyeInnerColor: "#0f172a",
      qrSize: 170,
      qrMargin: 8,
      dotStyle: "square",
      showLogo: true,
      logoBgShape: "none",
      headingText: "Menu & Ordering",
      subtitleText: "Scan with your phone camera to browse and order.",
      tablePrefix: "Table",
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
      eyeOuterColor: "#e63946",
      eyeInnerColor: "#1e293b",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "rounded",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ffffff",
      headingText: "Scan to View Menu & Order",
      subtitleText: "Instant contactless ordering right from your table.",
      tablePrefix: "Table",
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
      eyeOuterColor: "#d4af37",
      eyeInnerColor: "#18181b",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "square",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ffffff",
      headingText: "Exclusive Dining Experience",
      subtitleText: "Scan to discover our chef's signature menu & reserve orders.",
      tablePrefix: "Table",
      ctaBadgeText: "❖ TOUCHLESS MENU ❖",
      fontFamily: "Georgia, serif",
      textColor: "#d1d5db",
      headingColor: "#fef08a",
      cardVariant: "luxury",
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
      eyeOuterColor: "#991b1b",
      eyeInnerColor: "#7f1d1d",
      qrSize: 185,
      qrMargin: 10,
      dotStyle: "square",
      showLogo: true,
      logoBgShape: "square",
      logoBgColor: "#ffffff",
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
      eyeOuterColor: "#b45309",
      eyeInnerColor: "#451a03",
      qrSize: 175,
      qrMargin: 10,
      dotStyle: "rounded",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#fffbeb",
      headingText: "Fresh Bakes & Coffee Menu",
      subtitleText: "Scan to order your favorite coffee, drinks & breakfast specials.",
      tablePrefix: "Table",
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
      eyeOuterColor: "#1e3a8a",
      eyeInnerColor: "#0f172a",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "square",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ffffff",
      headingText: "Digital Table Menu",
      subtitleText: "Select your food and place orders directly to our kitchen.",
      tablePrefix: "Table",
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
      eyeOuterColor: "#059669",
      eyeInnerColor: "#064e3b",
      qrSize: 180,
      qrMargin: 10,
      dotStyle: "rounded",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ecfdf5",
      headingText: "Scan to Order Online",
      subtitleText: "Place your order instantly and enjoy tabletop service.",
      tablePrefix: "Table",
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
    desc: "Sleek dark theme with high contrast neon cyan accents",
    settings: {
      template: "dark",
      qrColor: "#0f172a",
      qrBgColor: "#ffffff",
      eyeOuterColor: "#38bdf8",
      eyeInnerColor: "#0f172a",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "square",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ffffff",
      headingText: "Scan to Order & Pay",
      subtitleText: "Enjoy instant digital ordering right from your device.",
      tablePrefix: "Table",
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
      eyeOuterColor: "#2563eb",
      eyeInnerColor: "#1e293b",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "rounded",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ffffff",
      headingText: "Scan for Menu & Specials",
      subtitleText: "Fast, contactless food & drink ordering.",
      tablePrefix: "Table",
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
      eyeOuterColor: "#e63946",
      eyeInnerColor: "#1e293b",
      qrSize: 160,
      qrMargin: 10,
      dotStyle: "square",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ffffff",
      headingText: "Scan to View Menu",
      subtitleText: "Place orders directly from your phone.",
      tablePrefix: "Table",
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
      eyeOuterColor: "#e63946",
      eyeInnerColor: "#111827",
      qrSize: 180,
      qrMargin: 12,
      dotStyle: "rounded",
      showLogo: true,
      logoBgShape: "circle",
      logoBgColor: "#ffffff",
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

export default function QrDesigner() {
  const { settings, activeRestaurantId } = useSettings();
  const { showToast } = useToast();

  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Active design config state
  const [design, setDesign] = useState(DEFAULT_QR_DESIGN);
  
  // Studio UI states
  const [activeTab, setActiveTab] = useState("presets"); // presets, qr, branding, typography, card
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [batchPrintMode, setBatchPrintMode] = useState(false);
  
  const printContainerRef = useRef(null);
  const cardPreviewRef = useRef(null);

  const appBaseUrl = window.location.origin;

  // Path for tables and QR design settings
  const tablesColPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/tables`
    : "tables";

  const qrSettingsDocPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/settings/qrDesigner`
    : "settings/qrDesigner";

  // Fetch Tables & saved QR design
  useEffect(() => {
    if (!activeRestaurantId) return;

    setLoading(true);

    // 1. Fetch tables
    const q = query(collection(db, tablesColPath), orderBy("name", "asc"));
    const unsubTables = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setTables(list);
        if (list.length > 0 && selectedTableId === "all") {
          // keep "all" or pick first table
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "tables");
      }
    );

    // 2. Fetch saved QR design settings
    const docRef = doc(db, qrSettingsDocPath);
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setDesign((prev) => ({ ...prev, ...docSnap.data() }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not load QR design settings, using default:", err);
        setLoading(false);
      });

    return () => {
      unsubTables();
    };
  }, [activeRestaurantId, tablesColPath, qrSettingsDocPath]);

  // Handle Logo File Upload
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
        showToast("Custom logo uploaded successfully!", "success");
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
    showToast(`Applied '${preset.name}' template preset!`, "success");
  };

  // Save Design to Firestore
  const handleSaveDesign = async () => {
    if (!activeRestaurantId) {
      showToast("No active restaurant selected", "error");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, qrSettingsDocPath);
      await setDoc(docRef, {
        ...design,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showToast("QR Design settings saved successfully!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "qrDesigner");
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetDesign = () => {
    if (window.confirm("Are you sure you want to reset all QR design settings to default?")) {
      setDesign(DEFAULT_QR_DESIGN);
      showToast("Design reset to default", "info");
    }
  };

  // Helper to generate dynamic scan URL for any table name
  const getTableScanUrl = (tableName) => {
    if (activeRestaurantId) {
      return `${appBaseUrl}/menu/${activeRestaurantId}/${encodeURIComponent(tableName)}`;
    }
    return `${appBaseUrl}/menu?table=${encodeURIComponent(tableName)}`;
  };

  // Selected single table for live preview
  const activeTableForPreview = tables.find((t) => t.id === selectedTableId) || (tables.length > 0 ? tables[0] : { id: "preview-1", name: "Table 1" });

  // Effective logo image URL
  const effectiveLogoUrl = design.logoUrl || settings.restaurantLogo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop";
  const effectiveRestaurantName = design.restaurantNameText || settings.restaurantName || "EasyOrder Bistro";

  // Download PNG file
  const handleDownloadPNG = () => {
    const previewEl = document.getElementById("active-qr-card-rendered");
    if (!previewEl) {
      showToast("Card element not ready", "error");
      return;
    }

    // Convert SVG QR to Canvas and triggers PNG download
    try {
      const svgEl = previewEl.querySelector("svg");
      if (!svgEl) {
        showToast("QR code SVG element not found", "error");
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 3; // high DPI export
        canvas.width = (design.cardWidth || 340) * scale;
        canvas.height = (canvas.width * 1.35);
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // Draw background
        ctx.scale(scale, scale);
        ctx.fillStyle = design.cardBgColor || "#ffffff";
        ctx.fillRect(0, 0, design.cardWidth || 340, canvas.height / scale);

        // Draw text and card frame
        ctx.fillStyle = design.headingColor || "#000000";
        ctx.font = `bold 18px ${design.fontFamily}`;
        ctx.textAlign = "center";
        ctx.fillText(effectiveRestaurantName, (design.cardWidth || 340) / 2, 40);

        // Draw SVG image onto canvas
        const qrX = ((design.cardWidth || 340) - design.qrSize) / 2;
        ctx.drawImage(image, qrX, 100, design.qrSize, design.qrSize);

        // Download link
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${activeTableForPreview.name.replace(/[^a-z0-9]/gi, "_")}_QR.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobURL);

        showToast("PNG downloaded successfully!", "success");
      };
      image.src = blobURL;
    } catch (err) {
      console.error("Error downloading PNG:", err);
      showToast("Failed to generate PNG image", "error");
    }
  };

  // Download SVG
  const handleDownloadSVG = () => {
    const previewEl = document.getElementById("active-qr-card-rendered");
    if (!previewEl) return;
    const svgEl = previewEl.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${effectiveRestaurantName.replace(/[^a-z0-9]/gi, "_")}_${activeTableForPreview.name.replace(/[^a-z0-9]/gi, "_")}_QR.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);

    showToast("SVG exported successfully!", "success");
  };

  // Trigger browser print
  const handlePrint = (batch = false) => {
    setBatchPrintMode(batch);
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Single QR Card Render Helper Component
  const renderQrCard = (tableItem, isPrintLayout = false) => {
    const scanUrl = getTableScanUrl(tableItem.name);

    // Dynamic style values
    const shadowMap = {
      none: "none",
      soft: "0 4px 12px rgba(0, 0, 0, 0.05)",
      elevated: "0 10px 30px rgba(0, 0, 0, 0.12)",
      glowing: `0 0 25px ${design.accentColor}40`,
      deep: "0 20px 40px rgba(0, 0, 0, 0.25)"
    };

    const cardStyle = {
      width: isPrintLayout ? "100%" : `${design.cardWidth}px`,
      maxWidth: "100%",
      backgroundColor: design.cardBgType === "dark" ? design.cardBgColor : design.cardBgColor,
      background: design.cardBgType === "gradient" ? design.cardGradient : design.cardBgColor,
      border: `${design.borderWidth}px ${design.borderStyle} ${design.borderColor}`,
      borderRadius: `${design.borderRadius}px`,
      boxShadow: isPrintLayout ? "none" : shadowMap[design.cardShadow] || shadowMap.elevated,
      padding: design.spacing === "compact" ? "18px 16px" : design.spacing === "spacious" ? "32px 28px" : "24px 20px",
      textAlign: design.textAlign,
      fontFamily: design.fontFamily,
      display: "flex",
      flexDirection: "column",
      alignItems: design.textAlign === "left" ? "flex-start" : design.textAlign === "right" ? "flex-end" : "center",
      gap: design.spacing === "compact" ? "10px" : design.spacing === "spacious" ? "18px" : "14px",
      color: design.textColor,
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden"
    };

    return (
      <div
        className={`qr-card-rendered ${design.cardVariant}`}
        style={cardStyle}
        id={!isPrintLayout ? "active-qr-card-rendered" : `print-qr-card-${tableItem.id}`}
        key={tableItem.id}
      >
        {/* Table Tent Fold Mark Indicator for Tent variant */}
        {design.cardVariant === "tent" && (
          <div
            style={{
              width: "100%",
              padding: "6px 0",
              borderBottom: "2px dashed #cbd5e1",
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#94a3b8",
              textAlign: "center",
              marginBottom: "8px"
            }}
          >
            ✂ Fold Here (Table Tent Top)
          </div>
        )}

        {/* Restaurant Header Branding */}
        {design.showRestaurantName && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: design.textAlign === "left" ? "flex-start" : design.textAlign === "right" ? "flex-end" : "center" }}>
            <img
              src={effectiveLogoUrl}
              alt="Restaurant Logo"
              style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span
              style={{
                fontSize: design.fontSizeScale === "sm" ? "0.95rem" : design.fontSizeScale === "lg" ? "1.25rem" : design.fontSizeScale === "xl" ? "1.4rem" : "1.1rem",
                fontWeight: "800",
                color: design.headingColor,
                letterSpacing: "-0.2px"
              }}
            >
              {effectiveRestaurantName}
            </span>
          </div>
        )}

        {/* Table Number Identifier Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: `${design.accentColor}15`,
            color: design.accentColor,
            border: `1.5px solid ${design.accentColor}40`,
            padding: "4px 14px",
            borderRadius: "20px",
            fontSize: "0.88rem",
            fontWeight: "800",
            letterSpacing: "0.5px",
            textTransform: "uppercase"
          }}
        >
          <span>{design.tablePrefix || "Table"} {tableItem.name}</span>
        </div>

        {/* Custom Heading */}
        {design.headingText && (
          <h3
            style={{
              fontSize: design.fontSizeScale === "sm" ? "1rem" : design.fontSizeScale === "lg" ? "1.3rem" : design.fontSizeScale === "xl" ? "1.45rem" : "1.15rem",
              fontWeight: "800",
              color: design.headingColor,
              margin: 0,
              lineHeight: "1.3"
            }}
          >
            {design.headingText}
          </h3>
        )}

        {/* QR CODE ENGINE CONTAINER */}
        <div
          style={{
            padding: `${design.qrMargin}px`,
            backgroundColor: design.qrBgColor,
            borderRadius: design.dotStyle === "rounded" ? "16px" : "10px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            display: "inline-block",
            margin: "4px 0"
          }}
        >
          <QRCodeSVG
            value={scanUrl}
            size={design.qrSize}
            fgColor={design.qrColor}
            bgColor={design.qrBgColor}
            level="H"
            imageSettings={
              design.showLogo && effectiveLogoUrl
                ? {
                    src: effectiveLogoUrl,
                    x: undefined,
                    y: undefined,
                    height: design.logoSize,
                    width: design.logoSize,
                    excavate: true
                  }
                : undefined
            }
          />
        </div>

        {/* Custom Subtitle */}
        {design.subtitleText && (
          <p
            style={{
              fontSize: design.fontSizeScale === "sm" ? "0.75rem" : design.fontSizeScale === "lg" ? "0.92rem" : "0.82rem",
              lineHeight: "1.4",
              margin: 0,
              color: design.textColor,
              opacity: 0.9
            }}
          >
            {design.subtitleText}
          </p>
        )}

        {/* "Scan to Order" CTA Pill / Badge */}
        {design.ctaBadgeText && (
          <div
            style={{
              backgroundColor: design.accentColor,
              color: "#ffffff",
              padding: "6px 18px",
              borderRadius: "24px",
              fontSize: "0.78rem",
              fontWeight: "800",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
            }}
          >
            {design.ctaBadgeText}
          </div>
        )}

        {/* Footer brand signature */}
        <span style={{ fontSize: "0.68rem", opacity: 0.6, letterSpacing: "0.3px", marginTop: "2px" }}>
          EasyOrder QR Dining
        </span>
      </div>
    );
  };

  return (
    <main className="admin-content-area" id="qr-designer-main-studio">
      {/* Header */}
      <div className="dashboard-header flex justify-between align-center flex-wrap gap-3" id="qr-designer-header">
        <div>
          <h1 style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <Palette size={26} style={{ color: "var(--primary-color)" }} />
            QR Designer Studio
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Design fully customized, brand-matched, scannable QR code stickers & table tents for your restaurant.
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
            className="btn btn-primary"
            onClick={handleSaveDesign}
            disabled={saving}
            style={{ gap: "6px", fontWeight: "700" }}
            id="qr-designer-save-btn"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save Design"}
          </button>
        </div>
      </div>

      {/* Main Studio Split Layout */}
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
        {/* LEFT PANEL: Design Controls & Customizer */}
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
              { id: "branding", label: "Logo", icon: <ImageIcon size={15} /> },
              { id: "typography", label: "Text", icon: <Type size={15} /> },
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

          {/* TAB 1: READY-MADE TEMPLATE PRESETS */}
          {activeTab === "presets" && (
            <div className="tab-panel" id="panel-presets">
              <h3 style={{ fontSize: "1rem", marginBottom: "8px", fontWeight: "700" }}>Choose Ready-Made Preset</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Select a pre-designed template as a starting point, then fine-tune any details.
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

          {/* TAB 2: QR CODE ENGINE & COLORS */}
          {activeTab === "qr" && (
            <div className="tab-panel flex flex-col gap-3" id="panel-qr-engine">
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>QR Code Colors & Geometry</h3>

              {/* Color Controls */}
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

              {/* Accent & Eye Color */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Brand Accent Color (Badges & Highlights)</label>
                <div className="flex align-center gap-2">
                  <input
                    type="color"
                    value={design.accentColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, accentColor: e.target.value, eyeOuterColor: e.target.value }))}
                    style={{ width: "36px", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    value={design.accentColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, accentColor: e.target.value, eyeOuterColor: e.target.value }))}
                    style={{ fontSize: "0.8rem", padding: "6px" }}
                  />
                </div>
              </div>

              {/* QR Size Slider */}
              <div className="input-group">
                <div className="flex justify-between align-center">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>QR Size</label>
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

              {/* QR Padding / Margin Slider */}
              <div className="input-group">
                <div className="flex justify-between align-center">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>QR Inner Margin</label>
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

              {/* Dot Style Selection */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>QR Dot Style</label>
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

          {/* TAB 3: LOGO & BRANDING */}
          {activeTab === "branding" && (
            <div className="tab-panel flex flex-col gap-3" id="panel-branding">
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Logo & Brand Emblem</h3>

              <div className="input-group">
                <label className="flex align-center gap-2 cursor-pointer" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={design.showLogo}
                    onChange={(e) => setDesign((prev) => ({ ...prev, showLogo: e.target.checked }))}
                  />
                  <span>Display Logo Inside QR Code Center</span>
                </label>
              </div>

              {design.showLogo && (
                <>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: "0.78rem" }}>Upload Custom Logo (or use Restaurant Logo)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="input-field"
                      style={{ fontSize: "0.8rem" }}
                    />
                  </div>

                  <div className="input-group">
                    <div className="flex justify-between align-center">
                      <label className="input-label" style={{ fontSize: "0.78rem" }}>Logo Size</label>
                      <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>{design.logoSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="60"
                      step="2"
                      value={design.logoSize}
                      onChange={(e) => setDesign((prev) => ({ ...prev, logoSize: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: "var(--primary-color)" }}
                    />
                  </div>
                </>
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

          {/* TAB 4: TYPOGRAPHY & LABELS */}
          {activeTab === "typography" && (
            <div className="tab-panel flex flex-col gap-3" id="panel-typography">
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Headings, Badges & Copy</h3>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Table Number Prefix</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Table or TABLE NO."
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
                  placeholder="e.g. Point your camera to order"
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
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Font Style Family</label>
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
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Card Frame & Dimensions</h3>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Card Design Variant</label>
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
                  min="260"
                  max="460"
                  step="10"
                  value={design.cardWidth}
                  onChange={(e) => setDesign((prev) => ({ ...prev, cardWidth: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "var(--primary-color)" }}
                />
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Card Background Color</label>
                  <input
                    type="color"
                    value={design.cardBgColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, cardBgColor: e.target.value }))}
                    style={{ width: "100%", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Border Color</label>
                  <input
                    type="color"
                    value={design.borderColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, borderColor: e.target.value }))}
                    style={{ width: "100%", height: "36px", borderRadius: "6px", cursor: "pointer", border: "none" }}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="flex justify-between align-center">
                  <label className="input-label" style={{ fontSize: "0.78rem" }}>Border Corner Radius</label>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>{design.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={design.borderRadius}
                  onChange={(e) => setDesign((prev) => ({ ...prev, borderRadius: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "var(--primary-color)" }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: "0.78rem" }}>Shadow Effect</label>
                <select
                  className="input-field"
                  value={design.cardShadow}
                  onChange={(e) => setDesign((prev) => ({ ...prev, cardShadow: e.target.value }))}
                  style={{ fontSize: "0.85rem" }}
                >
                  <option value="none">No Shadow</option>
                  <option value="soft">Soft Drop Shadow</option>
                  <option value="elevated">Elevated Floating Shadow</option>
                  <option value="glowing">Glowing Brand Shadow</option>
                  <option value="deep">Deep Contrast Shadow</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE INTERACTIVE PREVIEW & BATCH EXPORT STUDIO */}
        <div
          className="card studio-preview-card flex flex-col align-center"
          style={{ padding: "24px", position: "sticky", top: "84px", minHeight: "550px" }}
          id="qr-preview-studio-card"
        >
          {/* Table Selector & Studio Toolbar */}
          <div
            className="flex justify-between align-center flex-wrap gap-2"
            style={{ width: "100%", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "14px" }}
          >
            <div className="flex align-center gap-2">
              <TableIcon size={18} style={{ color: "var(--primary-color)" }} />
              <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>Preview Table:</span>
              <select
                className="input-field"
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                style={{ width: "auto", fontSize: "0.85rem", padding: "4px 10px" }}
                id="select-preview-table-dropdown"
              >
                <option value="all">All Tables (Batch View)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Zoom Controls */}
            <div className="flex align-center gap-1">
              <button
                className="btn-icon"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                title="Zoom Out"
                style={{ width: "30px", height: "30px" }}
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", minWidth: "40px", textAlign: "center" }}>
                {zoomLevel}%
              </span>
              <button
                className="btn-icon"
                onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                title="Zoom In"
                style={{ width: "30px", height: "30px" }}
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* CANVAS STAGE PREVIEW */}
          <div
            style={{
              width: "100%",
              minHeight: "380px",
              backgroundColor: "var(--surface-hover)",
              borderRadius: "16px",
              border: "1px dashed var(--border-color)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "24px",
              boxSizing: "border-box",
              overflowX: "auto",
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease"
            }}
            id="qr-stage-preview-wrapper"
          >
            {selectedTableId === "all" ? (
              /* BATCH GRID PREVIEW */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px",
                  width: "100%",
                  justifyItems: "center"
                }}
              >
                {(tables.length > 0 ? tables : [{ id: "mock-1", name: "Table 1" }, { id: "mock-2", name: "Table 2" }]).map((t) => (
                  renderQrCard(t)
                ))}
              </div>
            ) : (
              /* SINGLE TABLE PREVIEW */
              renderQrCard(activeTableForPreview)
            )}
          </div>

          {/* ACTION BUTTONS TOOLBAR */}
          <div
            className="flex flex-wrap justify-center gap-2"
            style={{ marginTop: "24px", width: "100%", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}
          >
            <button
              className="btn btn-primary"
              onClick={() => handlePrint(selectedTableId === "all")}
              style={{ gap: "6px", fontWeight: "700" }}
              id="action-print-qr-btn"
            >
              <Printer size={16} /> Print {selectedTableId === "all" ? "All Table QRs" : "Selected QR"}
            </button>

            <button
              className="btn btn-outline"
              onClick={handleDownloadPNG}
              style={{ gap: "6px" }}
              id="action-download-png-btn"
            >
              <Download size={16} /> PNG
            </button>

            <button
              className="btn btn-outline"
              onClick={handleDownloadSVG}
              style={{ gap: "6px" }}
              id="action-download-svg-btn"
            >
              <FileCode size={16} /> SVG
            </button>

            <button
              className="btn btn-outline"
              onClick={() => {
                const url = getTableScanUrl(activeTableForPreview.name);
                navigator.clipboard.writeText(url);
                showToast("Sticker URL copied to clipboard!", "success");
              }}
              style={{ gap: "6px" }}
              id="action-copy-url-btn"
            >
              <Copy size={16} /> Copy URL
            </button>
          </div>
        </div>
      </div>

      {/* HIDDEN PRINT LAYOUT CONTAINER */}
      <div className="print-only" ref={printContainerRef} id="printable-qr-sheet">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-qr-sheet, #printable-qr-sheet * {
              visibility: visible;
            }
            #printable-qr-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              box-sizing: border-box;
            }
            .print-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              page-break-inside: avoid;
            }
            .qr-card-rendered {
              page-break-inside: avoid;
              box-shadow: none !important;
            }
          }
        `}</style>

        <div className="print-grid">
          {(batchPrintMode || selectedTableId === "all" ? tables : [activeTableForPreview]).map((t) => (
            renderQrCard(t, true)
          ))}
        </div>
      </div>
    </main>
  );
}
