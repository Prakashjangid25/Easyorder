import React, { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Settings, Save, AlertCircle, ShoppingBag, Eye, HelpCircle } from "lucide-react";

export default function AdminSettings() {
  const { settings, updateSettings, activeRestaurantId } = useSettings();
  const { showToast } = useToast();

  // Local Form state
  const [formData, setFormData] = useState({
    restaurantName: settings.restaurantName || "",
    restaurantLogo: settings.restaurantLogo || "",
    restaurantBanner: settings.restaurantBanner || "",
    primaryColor: settings.primaryColor || "#e63946",
    secondaryColor: settings.secondaryColor || "#457b9d",
    darkModeLogo: settings.darkModeLogo || "",
    address: settings.address || "",
    phone: settings.phone || "",
    whatsapp: settings.whatsapp || "",
    instagram: settings.instagram || "",
    openingTime: settings.openingTime || "10:00",
    closingTime: settings.closingTime || "22:00",
    isOpen: settings.isOpen !== undefined ? settings.isOpen : true,
    footerText: settings.footerText || "",
    copyright: settings.copyright || ""
  });

  // Keep form in sync when active restaurant or settings context changes
  useEffect(() => {
    setFormData({
      restaurantName: settings.restaurantName || "",
      restaurantLogo: settings.restaurantLogo || "",
      restaurantBanner: settings.restaurantBanner || "",
      primaryColor: settings.primaryColor || "#e63946",
      secondaryColor: settings.secondaryColor || "#457b9d",
      darkModeLogo: settings.darkModeLogo || "",
      address: settings.address || "",
      phone: settings.phone || "",
      whatsapp: settings.whatsapp || "",
      instagram: settings.instagram || "",
      openingTime: settings.openingTime || "10:00",
      closingTime: settings.closingTime || "22:00",
      isOpen: settings.isOpen !== undefined ? settings.isOpen : true,
      footerText: settings.footerText || "",
      copyright: settings.copyright || ""
    });
  }, [settings, activeRestaurantId]);

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleLogoUpload = (e, targetField) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("File is too large. Max size is 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [targetField]: reader.result }));
      showToast("Logo processed successfully!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("File is too large. Max size is 3MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, restaurantBanner: reader.result }));
      showToast("Banner loaded successfully!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      showToast("Restaurant branding and settings updated successfully!", "success");
    } catch (err) {
      console.error("Settings update failed:", err);
      showToast("Failed to save settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-content-area" id="admin-settings-content">
        <div className="dashboard-header" id="admin-settings-header">
          <div>
            <h1 style={{ fontSize: "2rem" }}>
              {settings.restaurantName ? `${settings.restaurantName} - Settings` : "Branding & Settings"}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Configure your restaurant identity, custom color palette themes, hours of operation, and menu state.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} id="admin-settings-form">
          <div className="grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: "32px", alignItems: "start" }}>

            {/* Left side: branding inputs form fields */}
            <div className="flex flex-col gap-3">
              {/* Card 1: Identity */}
              <div className="card">
                <h2 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShoppingBag size={18} /> Restaurant Identity
                </h2>

                <div className="input-group">
                  <label className="input-label" htmlFor="restaurantName">Restaurant Name</label>
                  <input
                    id="restaurantName"
                    type="text"
                    name="restaurantName"
                    className="input-field"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="openingTime">Opening Time</label>
                    <input
                      id="openingTime"
                      type="time"
                      name="openingTime"
                      className="input-field"
                      value={formData.openingTime}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="closingTime">Closing Time</label>
                    <input
                      id="closingTime"
                      type="time"
                      name="closingTime"
                      className="input-field"
                      value={formData.closingTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="address">Physical Address</label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    className="input-field"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Card 2: Customize Visual Colors */}
              <div className="card">
                <h2 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Eye size={18} /> Visual Customization
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
                  Set your brand's unique color palette. These colors will apply instantly to the customer's portal.
                </p>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="primaryColor">Primary Theme Color (HEX)</label>
                    <div className="flex gap-2">
                      <input
                        id="primaryColor"
                        type="color"
                        name="primaryColor"
                        style={{ width: "48px", height: "48px", padding: 0, border: "none", cursor: "pointer", borderRadius: "8px" }}
                        value={formData.primaryColor}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="primaryColor"
                        className="input-field"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        maxLength="7"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="secondaryColor">Secondary Accent Color (HEX)</label>
                    <div className="flex gap-2">
                      <input
                        id="secondaryColor"
                        type="color"
                        name="secondaryColor"
                        style={{ width: "48px", height: "48px", padding: 0, border: "none", cursor: "pointer", borderRadius: "8px" }}
                        value={formData.secondaryColor}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="secondaryColor"
                        className="input-field"
                        value={formData.secondaryColor}
                        onChange={handleChange}
                        maxLength="7"
                      />
                    </div>
                  </div>
                </div>

                {/* File Uploads */}
                <div className="grid-2" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", marginTop: "12px" }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="logo-file-picker">Light Mode Logo File</label>
                    <input
                      id="logo-file-picker"
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => handleLogoUpload(e, "restaurantLogo")}
                      style={{ padding: "8px" }}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="dark-logo-file-picker">Dark Mode Logo File</label>
                    <input
                      id="dark-logo-file-picker"
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => handleLogoUpload(e, "darkModeLogo")}
                      style={{ padding: "8px" }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="banner-file-picker">Restaurant Hero Banner Cover Image</label>
                  <input
                    id="banner-file-picker"
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={handleBannerUpload}
                    style={{ padding: "8px" }}
                  />
                </div>
              </div>

              {/* Card 3: Contact Details */}
              <div className="card">
                <h2 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>Contact Channels & Links</h2>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="phone">Phone Hotline</label>
                    <input
                      id="phone"
                      type="text"
                      name="phone"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="whatsapp">WhatsApp Order Number</label>
                    <input
                      id="whatsapp"
                      type="text"
                      name="whatsapp"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={formData.whatsapp}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="instagram">Instagram Handle (without @)</label>
                  <input
                    id="instagram"
                    type="text"
                    name="instagram"
                    className="input-field"
                    placeholder="my_restaurant_bistro"
                    value={formData.instagram}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Card 4: Footer */}
              <div className="card">
                <h2 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>Page Footer & Copyright Texts</h2>

                <div className="input-group">
                  <label className="input-label" htmlFor="footerText">Footer Tagline/Message</label>
                  <input
                    id="footerText"
                    type="text"
                    name="footerText"
                    className="input-field"
                    value={formData.footerText}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="copyright">Copyright Notice</label>
                  <input
                    id="copyright"
                    type="text"
                    name="copyright"
                    className="input-field"
                    value={formData.copyright}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Right side: quick status widgets, preview details, and save button */}
            <div style={{ position: "sticky", top: "96px" }} className="flex flex-col gap-3">

              {/* Quick status control Card */}
              <div className="card" style={{ borderLeft: "5px solid var(--primary-color)" }}>
                <h3 style={{ fontSize: "1.1rem" }}>Restaurant Open Status</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px", marginBottom: "16px" }}>
                  Quickly open or close the digital ordering system for scanning customers.
                </p>

                <div className="flex align-center gap-3">
                  <input
                    id="isOpen-toggle-checkbox"
                    type="checkbox"
                    name="isOpen"
                    checked={formData.isOpen}
                    onChange={handleChange}
                    style={{ transform: "scale(1.4)", cursor: "pointer" }}
                  />
                  <label htmlFor="isOpen-toggle-checkbox" style={{ fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" }}>
                    {formData.isOpen ? (
                      <span style={{ color: "var(--status-completed)" }}>● STORE IS CURRENTLY OPEN</span>
                    ) : (
                      <span style={{ color: "var(--status-cancelled)" }}>● STORE IS CURRENTLY CLOSED</span>
                    )}
                  </label>
                </div>
              </div>

              {/* Dynamic Live Preview widget */}
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Live Branding Preview</h3>
                <div style={{ border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", backgroundColor: "var(--surface-hover)" }}>
                  <div className="flex align-center gap-2">
                    {formData.restaurantLogo && (
                      <img
                        src={formData.restaurantLogo}
                        alt="Preview Logo"
                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    )}
                    <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{formData.restaurantName || "My Restaurant"}</span>
                  </div>

                  <div style={{ marginTop: "12px", height: "80px", borderRadius: "4px", backgroundImage: `url(${formData.restaurantBanner})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>

                  {/* Test button styled with Primary Hex directly */}
                  <button
                    className="btn"
                    type="button"
                    style={{ backgroundColor: formData.primaryColor, color: "#ffffff", width: "100%", marginTop: "16px", padding: "10px", fontSize: "0.85rem", borderRadius: "20px", fontWeight: "700" }}
                  >
                    Primary Button Preview
                  </button>
                </div>
              </div>

              {/* Submit Save Floating Bar */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", padding: "16px", fontSize: "1.1rem", gap: "10px", fontWeight: "700" }}
                disabled={saving}
                id="save-settings-submit-btn"
              >
                <Save size={18} />
                {saving ? "Saving Changes..." : "Save Brand Settings"}
              </button>

              <div className="flex align-center gap-1 justify-center" style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "4px" }}>
                <HelpCircle size={12} />
                <span>Changes will sync immediately to customers.</span>
              </div>
            </div>
          </div>
        </form>
      </main>
  );
}
