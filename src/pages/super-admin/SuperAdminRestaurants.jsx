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
  Power,
  AlertTriangle
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { setActiveRestaurantId } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

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

    setDeleteConfirm(restaurant);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRestaurant(deleteConfirm.id);
      showToast(`Deleted restaurant "${deleteConfirm.name}"`, "info");
      setDeleteConfirm(null);
      loadRestaurants();
    } catch (error) {
      showToast("Error deleting restaurant", "error");
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

  const activeCount = restaurants.filter(r => r.status === "active").length;
  const inactiveCount = restaurants.filter(r => r.status === "inactive").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background-color)" }}>
      <SuperAdminSidebar />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }} className="sa-scroll">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
              Restaurants Directory
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>
              Manage registered restaurants, toggle statuses, and configure SaaS tenant accounts.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={loadRestaurants}
              className="sa-btn-ghost"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="sa-btn-premium"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Plus size={18} />
              <span>Create Restaurant</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <div className="sa-stat-card sa-red" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "rgba(230, 57, 70, 0.1)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Store size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>{restaurants.length}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Restaurants</div>
            </div>
          </div>

          <div className="sa-stat-card sa-green" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "rgba(42, 157, 143, 0.1)", color: "#2a9d8f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>{activeCount}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Active Restaurants</div>
            </div>
          </div>

          <div className="sa-stat-card sa-orange" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "rgba(230, 57, 70, 0.1)", color: "#e63946", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <XCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>{inactiveCount}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Inactive / Suspended</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sa-glass-card" style={{ padding: "16px", marginBottom: "24px" }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="sa-input"
              placeholder="Search restaurants by name, ID, or admin email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "44px" }}
            />
          </div>
        </div>

        {/* Restaurants Cards Grid */}
        {loading ? (
          <div className="sa-glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "3px solid var(--border-color)",
              borderTopColor: "var(--primary-color)",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }} />
            <p style={{ color: "var(--text-muted)" }}>Loading restaurant directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sa-glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <Store size={48} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>No restaurants found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
            {filtered.map((r) => {
              const isActive = r.status === "active";
              return (
                <div key={r.id} className="sa-glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                  {/* Header with Logo & Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <img
                        src={r.logo || DEFAULT_SETTINGS.restaurantLogo}
                        alt={r.name}
                        style={{ width: "52px", height: "52px", borderRadius: "14px", objectFit: "cover", border: "2px solid var(--border-color)" }}
                      />
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>{r.name}</h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {r.id}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(r)}
                      className={`sa-badge ${isActive ? "sa-badge-success" : "sa-badge-danger"}`}
                      style={{ cursor: "pointer", border: "none" }}
                      title="Click to Activate/Deactivate"
                    >
                      {isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>

                  {/* Details List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Mail size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.adminEmail || "admin@easyorder.com"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <ShieldCheck size={14} style={{ color: "var(--secondary-color)", flexShrink: 0 }} />
                      <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }} title={r.adminUid || "No UID"}>
                        UID: {r.adminUid ? `${r.adminUid.slice(0, 14)}...` : "Not Linked"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Phone size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span>{r.phone || "+91 98765 43210"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <MapPin size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.address || "Main Street"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    <Link
                      to={`/superadmin/restaurants/${r.id}`}
                      className="sa-icon-btn"
                      title="Inspect Restaurant"
                      style={{ flex: "1 1 auto", width: "auto", borderRadius: "10px", padding: "0 12px", gap: "6px", textDecoration: "none", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      <Eye size={14} />
                      <span>Open</span>
                    </Link>

                    <button
                      onClick={() => handleOpenAdmin(r)}
                      className="sa-icon-btn"
                      title="Launch Admin Panel"
                      style={{ flex: "1 1 auto", width: "auto", borderRadius: "10px", padding: "0 12px", gap: "6px", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      <ExternalLink size={14} />
                      <span>Admin Panel</span>
                    </button>

                    <button
                      onClick={() => openEditModal(r)}
                      className="sa-icon-btn"
                      title="Edit Restaurant"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(r)}
                      className="sa-icon-btn"
                      title={isActive ? "Deactivate" : "Activate"}
                      style={{ color: isActive ? "#e63946" : "#2a9d8f" }}
                    >
                      <Power size={14} />
                    </button>

                    <button
                      onClick={() => setResetPassModal(r)}
                      className="sa-icon-btn"
                      title="Reset Password"
                    >
                      <Key size={14} />
                    </button>

                    {r.id !== "default" && (
                      <button
                        onClick={() => handleDelete(r)}
                        className="sa-icon-btn"
                        title="Delete Restaurant"
                        style={{ color: "#e63946" }}
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
          <div className="sa-modal-backdrop" onClick={() => setShowCreateModal(false)}>
            <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Plus size={22} style={{ color: "var(--primary-color)" }} />
                Create New Restaurant
              </h2>

              <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="sa-label">Restaurant Name *</label>
                  <input
                    type="text"
                    className="sa-input"
                    placeholder="e.g. Spice Garden Bistro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="sa-label">Restaurant ID / Slug (Optional)</label>
                  <input
                    type="text"
                    className="sa-input"
                    placeholder="e.g. spice-garden (Auto-generated if blank)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="sa-label">Admin Email *</label>
                    <input
                      type="email"
                      className="sa-input"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="sa-label">Admin Password *</label>
                    <input
                      type="text"
                      className="sa-input"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="sa-label">Restaurant Phone</label>
                    <input
                      type="text"
                      className="sa-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="sa-label">Restaurant Status</label>
                    <select
                      className="sa-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="sa-label">Restaurant Address</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="sa-label">Restaurant Logo URL</label>
                  <input
                    type="url"
                    className="sa-input"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="sa-btn-ghost"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="sa-btn-premium">
                    Create Restaurant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT RESTAURANT MODAL */}
        {editingRestaurant && (
          <div className="sa-modal-backdrop" onClick={() => setEditingRestaurant(null)}>
            <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Edit2 size={22} style={{ color: "var(--primary-color)" }} />
                Edit Restaurant Details
              </h2>

              <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="sa-label">Restaurant Name</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="sa-label">Admin Email</label>
                    <input
                      type="email"
                      className="sa-input"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="sa-label">Status</label>
                    <select
                      className="sa-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="sa-label">Phone</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="sa-label">Address</label>
                  <input
                    type="text"
                    className="sa-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="sa-label">Logo URL</label>
                  <input
                    type="url"
                    className="sa-input"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="sa-btn-ghost"
                    onClick={() => setEditingRestaurant(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="sa-btn-premium">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESET PASSWORD MODAL */}
        {resetPassModal && (
          <div className="sa-modal-backdrop" onClick={() => setResetPassModal(null)}>
            <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Key size={20} style={{ color: "var(--primary-color)" }} />
                Reset Admin Password
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Set a new access password for <strong>{resetPassModal.name}</strong> ({resetPassModal.adminEmail}).
              </p>

              <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="sa-label">New Password</label>
                  <input
                    type="password"
                    className="sa-input"
                    placeholder="Enter new admin password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="sa-btn-ghost"
                    onClick={() => setResetPassModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="sa-btn-premium">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirm && (
          <div className="sa-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
            <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(230, 57, 70, 0.1)",
                  color: "#e63946",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}>
                  <AlertTriangle size={28} />
                </div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "8px" }}>Delete Restaurant?</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? All associated data will be removed. This action cannot be undone.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  className="sa-btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sa-btn-premium"
                  style={{ flex: 1 }}
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
