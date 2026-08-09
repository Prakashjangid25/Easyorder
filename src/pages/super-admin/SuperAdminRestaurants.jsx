import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Plus, 
  Store, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Key, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  RefreshCw,
  Eye,
  Power
} from "lucide-react";
import SuperAdminSidebar from "../../components/super-admin/SuperAdminSidebar.jsx";
import { getAllRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, DEFAULT_SETTINGS } from "../../firebase/multiRestaurant.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [resetPassModal, setResetPassModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const { setActiveRestaurantId } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form state for creation / edit
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    adminEmail: "",
    adminPassword: "admin123",
    phone: "+91 98765 43210",
    address: "Food Court, City Mall",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
    status: "active",
    primaryColor: "#e63946",
    secondaryColor: "#457b9d"
  });

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const list = await getAllRestaurants();
      setRestaurants(list);
    } catch (e) {
      console.error(e);
      showToast("Error loading restaurants", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.adminEmail.trim()) {
      showToast("Restaurant name and admin email are required", "error");
      return;
    }

    try {
      await createRestaurant(formData);
      showToast(`Restaurant "${formData.name}" created successfully!`, "success");
      setShowCreateModal(false);
      resetForm();
      loadRestaurants();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to create restaurant", "error");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRestaurant) return;

    try {
      await updateRestaurant(editingRestaurant.id, {
        name: formData.name,
        adminEmail: formData.adminEmail,
        phone: formData.phone,
        address: formData.address,
        logo: formData.logo,
        banner: formData.banner,
        status: formData.status,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor
      });
      showToast(`Updated "${formData.name}" details`, "success");
      setEditingRestaurant(null);
      resetForm();
      loadRestaurants();
    } catch (error) {
      console.error(error);
      showToast("Failed to update restaurant", "error");
    }
  };

  const handleToggleStatus = async (restaurant) => {
    const newStatus = restaurant.status === "active" ? "inactive" : "active";
    try {
      await updateRestaurant(restaurant.id, { status: newStatus });
      showToast(`Set "${restaurant.name}" status to ${newStatus.toUpperCase()}`, "info");
      loadRestaurants();
    } catch (error) {
      showToast("Could not update status", "error");
    }
  };

  const handleDelete = async (restaurant) => {
    if (restaurant.id === "default") {
      showToast("Cannot delete the default platform restaurant", "error");
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${restaurant.name}"? All associated data will be removed. This action cannot be undone.`)) {
      try {
        await deleteRestaurant(restaurant.id);
        showToast(`Deleted restaurant "${restaurant.name}"`, "info");
        loadRestaurants();
      } catch (error) {
        showToast("Error deleting restaurant", "error");
      }
    }
  };

  const handleOpenAdmin = (restaurant) => {
    setActiveRestaurantId(restaurant.id);
    localStorage.setItem("activeAdminRestaurantId", restaurant.id);
    showToast(`Switched context to ${restaurant.name}`, "info");
    navigate("/admin/dashboard");
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPassModal || !newPassword.trim()) return;

    try {
      await updateRestaurant(resetPassModal.id, { adminPassword: newPassword });
      showToast(`Admin password reset for ${resetPassModal.name}`, "success");
      setResetPassModal(null);
      setNewPassword("");
      loadRestaurants();
    } catch (e) {
      showToast("Failed to reset password", "error");
    }
  };

  const openEditModal = (res) => {
    setEditingRestaurant(res);
    setFormData({
      name: res.name || "",
      slug: res.slug || res.id,
      adminEmail: res.adminEmail || "",
      adminPassword: res.adminPassword || "admin123",
      phone: res.phone || "",
      address: res.address || "",
      logo: res.logo || "",
      banner: res.banner || "",
      status: res.status || "active",
      primaryColor: res.primaryColor || "#e63946",
      secondaryColor: res.secondaryColor || "#457b9d"
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      adminEmail: "",
      adminPassword: "admin123",
      phone: "+91 98765 43210",
      address: "Food Court, City Mall",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
      banner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
      status: "active",
      primaryColor: "#e63946",
      secondaryColor: "#457b9d"
    });
  };

  const filtered = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <SuperAdminSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>
              Restaurants Directory
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Manage registered restaurants, toggle statuses, and configure SaaS tenant accounts.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={loadRestaurants}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
              title="Refresh Directory"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}
            >
              <Plus size={18} />
              <span>Create Restaurant</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(230, 57, 70, 0.1)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Store size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>{restaurants.length}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Total Restaurants</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(42, 157, 143, 0.1)", color: "#2a9d8f", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>
                {restaurants.filter(r => r.status === "active").length}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Active Restaurants</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(230, 57, 70, 0.1)", color: "#e63946", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>
                {restaurants.filter(r => r.status === "inactive").length}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Inactive / Suspended</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card" style={{ padding: "16px", marginBottom: "24px" }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search restaurants by name, ID, or admin email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "42px", width: "100%", height: "44px", borderRadius: "8px" }}
            />
          </div>
        </div>

        {/* Restaurants Cards Grid */}
        {loading ? (
          <div className="card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>Loading restaurant directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>No restaurants found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {filtered.map((r) => {
              const isActive = r.status === "active";
              return (
                <div key={r.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    {/* Header with Logo & Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={r.logo || DEFAULT_SETTINGS.restaurantLogo}
                          alt={r.name}
                          style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", border: "1px solid var(--border-color)" }}
                        />
                        <div>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>{r.name}</h3>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {r.id}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(r)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: isActive ? "rgba(42, 157, 143, 0.15)" : "rgba(230, 57, 70, 0.15)",
                          color: isActive ? "#2a9d8f" : "#e63946"
                        }}
                        title="Click to Activate/Deactivate"
                      >
                        {isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>

                    {/* Details List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Mail size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{r.adminEmail || "admin@easyorder.com"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck size={14} style={{ color: "var(--secondary-color)" }} />
                        <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }} title={r.adminUid || "No UID"}>
                          UID: {r.adminUid ? `${r.adminUid.slice(0, 14)}...` : "Not Linked"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Phone size={14} style={{ color: "var(--text-muted)" }} />
                        <span>{r.phone || "+91 98765 43210"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.address || "Main Street"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "space-between" }}>
                    <Link
                      to={`/superadmin/restaurants/${r.id}`}
                      className="btn btn-outline"
                      style={{ fontSize: "0.8rem", padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      title="Open / Inspect Restaurant"
                    >
                      <Eye size={14} />
                      <span>Open</span>
                    </Link>

                    <button
                      onClick={() => handleOpenAdmin(r)}
                      className="btn btn-primary"
                      style={{ flex: "1 1 auto", fontSize: "0.8rem", padding: "8px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      title="Launch Restaurant Admin Panel"
                    >
                      <ExternalLink size={14} />
                      <span>Admin Panel</span>
                    </button>

                    <button
                      onClick={() => openEditModal(r)}
                      className="btn btn-secondary"
                      style={{ padding: "8px", borderRadius: "6px" }}
                      title="Edit Restaurant Details"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(r)}
                      className="btn btn-secondary"
                      style={{ padding: "8px", borderRadius: "6px", color: isActive ? "#e63946" : "#2a9d8f" }}
                      title={isActive ? "Deactivate Restaurant" : "Activate Restaurant"}
                    >
                      <Power size={14} />
                    </button>

                    <button
                      onClick={() => setResetPassModal(r)}
                      className="btn btn-secondary"
                      style={{ padding: "8px", borderRadius: "6px" }}
                      title="Reset Admin Password"
                    >
                      <Key size={14} />
                    </button>

                    {r.id !== "default" && (
                      <button
                        onClick={() => handleDelete(r)}
                        className="btn btn-secondary"
                        style={{ padding: "8px", borderRadius: "6px", color: "var(--status-cancelled, #e63946)" }}
                        title="Delete Restaurant"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE RESTAURANT MODAL */}
        {showCreateModal && (
          <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="card" style={{ maxWidth: "540px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "32px", borderRadius: "16px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "20px" }}>Create New Restaurant</h2>
              
              <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="input-label">Restaurant Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Spice Garden Bistro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="input-label">Restaurant ID / Slug (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. spice-garden (Auto-generated if blank)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="input-label">Admin Email *</label>
                    <input
                      type="email"
                      className="input-field"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Admin Password *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="input-label">Restaurant Phone</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="input-label">Restaurant Status</label>
                    <select
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Restaurant Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Restaurant Logo URL</label>
                  <input
                    type="url"
                    className="input-field"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: "700" }}>
                    Create Restaurant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT RESTAURANT MODAL */}
        {editingRestaurant && (
          <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="card" style={{ maxWidth: "540px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "32px", borderRadius: "16px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "20px" }}>Edit Restaurant Details</h2>
              
              <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="input-label">Restaurant Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="input-label">Admin Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Status</label>
                    <select
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Phone</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Logo URL</label>
                  <input
                    type="url"
                    className="input-field"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingRestaurant(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: "700" }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESET PASSWORD MODAL */}
        {resetPassModal && (
          <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="card" style={{ maxWidth: "420px", width: "100%", padding: "32px", borderRadius: "16px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "12px" }}>Reset Admin Password</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Set a new access password for <strong>{resetPassModal.name}</strong> ({resetPassModal.adminEmail}).
              </p>

              <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter new admin password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setResetPassModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: "700" }}>
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
