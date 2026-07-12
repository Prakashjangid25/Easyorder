import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useToast } from "../../context/ToastContext.jsx";
import { Plus, Edit, Trash2, Tag, Utensils, ToggleLeft, ToggleRight, Search, Upload, Check, AlertCircle } from "lucide-react";
import { handleFirestoreError, OperationType } from "../../firebase/errorHandler.js";

export default function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [categoryName, setCategoryName] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);

  const [productCategoryId, setProductCategoryId] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImgUrl, setProductImgUrl] = useState("");
  const [productSortOrder, setProductSortOrder] = useState(0);
  const [productIsVeg, setProductIsVeg] = useState(true);
  const [productIsAvailable, setProductIsAvailable] = useState(true);
  const [productIsBestSeller, setProductIsBestSeller] = useState(false);
  const [productIsPopular, setProductIsPopular] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("all");

  const { showToast } = useToast();

  // Listen to Categories and Products
  useEffect(() => {
    const catsQuery = query(collection(db, "categories"), orderBy("sortOrder", "asc"));
    const unsubscribeCats = onSnapshot(catsQuery, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCategories(list);
    }, (err) => console.error(err));

    const prodsQuery = query(collection(db, "products"), orderBy("sortOrder", "asc"));
    const unsubscribeProds = onSnapshot(prodsQuery, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setProducts(list);
      setLoading(false);
    }, (err) => console.error(err));

    return () => {
      unsubscribeCats();
      unsubscribeProds();
    };
  }, []);

  // Helper to convert uploaded files to base64 string
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("File is too large. Max size is 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImgUrl(reader.result);
      showToast("Image loaded successfully!", "success");
    };
    reader.readAsDataURL(file);
  };

  // --- CATEGORY CRUD HANDLERS ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast("Category name is required", "error");
      return;
    }

    try {
      if (editingCategory) {
        // Edit Mode
        const catRef = doc(db, "categories", editingCategory.id);
        await updateDoc(catRef, {
          name: categoryName.trim(),
          sortOrder: Number(categorySortOrder)
        });
        showToast("Category updated successfully", "success");
        setEditingCategory(null);
      } else {
        // Add Mode
        await addDoc(collection(db, "categories"), {
          name: categoryName.trim(),
          sortOrder: Number(categorySortOrder),
          createdAt: new Date().toISOString()
        });
        showToast("Category created successfully", "success");
      }
      setCategoryName("");
      setCategorySortOrder(0);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "categories");
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySortOrder(cat.sortOrder);
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure? This will delete the category but not the products associated. You should re-assign them.")) {
      try {
        await deleteDoc(doc(db, "categories", id));
        showToast("Category deleted", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      }
    }
  };

  // --- PRODUCT CRUD HANDLERS ---
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !productCategoryId || !productPrice) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const payload = {
      categoryId: productCategoryId,
      name: productName.trim(),
      description: productDesc.trim(),
      price: Number(productPrice),
      imageUrl: productImgUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop",
      sortOrder: Number(productSortOrder),
      isVeg: productIsVeg,
      isAvailable: productIsAvailable,
      isBestSeller: productIsBestSeller,
      isPopular: productIsPopular
    };

    try {
      if (editingProduct) {
        const prodRef = doc(db, "products", editingProduct.id);
        await updateDoc(prodRef, payload);
        showToast("Product updated successfully", "success");
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        showToast("Product created successfully", "success");
      }
      resetProductForm();
      setShowProductModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "products");
    }
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductCategoryId(prod.categoryId);
    setProductName(prod.name);
    setProductDesc(prod.description || "");
    setProductPrice(prod.price);
    setProductImgUrl(prod.imageUrl || "");
    setProductSortOrder(prod.sortOrder || 0);
    setProductIsVeg(prod.isVeg !== undefined ? prod.isVeg : true);
    setProductIsAvailable(prod.isAvailable !== undefined ? prod.isAvailable : true);
    setProductIsBestSeller(prod.isBestSeller || false);
    setProductIsPopular(prod.isPopular || false);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        showToast("Product deleted successfully", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const toggleAvailability = async (prod) => {
    try {
      const prodRef = doc(db, "products", prod.id);
      await updateDoc(prodRef, { isAvailable: !prod.isAvailable });
      showToast(`${prod.name} is now ${!prod.isAvailable ? "Available" : "Unavailable"}`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${prod.id}`);
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductCategoryId("");
    setProductName("");
    setProductDesc("");
    setProductPrice("");
    setProductImgUrl("");
    setProductSortOrder(0);
    setProductIsVeg(true);
    setProductIsAvailable(true);
    setProductIsBestSeller(false);
    setProductIsPopular(false);
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : "Uncategorized";
  };

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCatFilter === "all" || p.categoryId === selectedCatFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="admin-shell" id="admin-menu-page-container">
      <AdminSidebar />

      <main className="admin-content-area" id="admin-menu-content">
        <div className="dashboard-header" id="admin-menu-header">
          <div>
            <h1 style={{ fontSize: "2rem" }}>Menu Manager</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Define categories, edit pricing, toggle availability, and structure your food menu.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              resetProductForm();
              setShowProductModal(true);
            }}
            style={{ gap: "8px" }}
            id="add-new-product-btn"
          >
            <Plus size={16} /> Add Menu Item
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 2.5fr", gap: "32px", alignItems: "start" }}>
          
          {/* LEFT PANEL: Category CRUD Form and List */}
          <div className="card" id="categories-crud-panel">
            <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignCenter: "center", gap: "8px" }}>
              <Tag size={18} /> Categories
            </h2>

            <form onSubmit={handleSaveCategory} style={{ marginBottom: "24px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="category-name-input">Category Name</label>
                <input
                  id="category-name-input"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Starters, Mains"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="category-sort-input">Sort Order</label>
                <input
                  id="category-sort-input"
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={categorySortOrder}
                  onChange={(e) => setCategorySortOrder(e.target.value)}
                />
              </div>

              <div className="flex gap-1" style={{ width: "100%" }}>
                <button type="submit" className="btn btn-secondary" style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}>
                  {editingCategory ? "Update" : "Add Category"}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryName("");
                      setCategorySortOrder(0);
                    }}
                    style={{ padding: "10px" }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex justify-between align-center"
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "var(--surface-hover)",
                    borderRadius: "8px"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{cat.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                      Sort: {cat.sortOrder}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <button className="btn-icon" onClick={() => handleEditCategory(cat)} style={{ width: "28px", height: "28px" }} title="Edit">
                      <Edit size={12} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDeleteCategory(cat.id)} style={{ width: "28px", height: "28px", color: "var(--status-cancelled)" }} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: Product Filter and Listing Grid */}
          <div>
            {/* Filters Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
                flexWrap: "wrap"
              }}
            >
              <div className="admin-filters">
                <button
                  className={`filter-btn ${selectedCatFilter === "all" ? "active" : ""}`}
                  onClick={() => setSelectedCatFilter("all")}
                >
                  All Food
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`filter-btn ${selectedCatFilter === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCatFilter(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div style={{ position: "relative", maxWidth: "260px", width: "100%" }}>
                <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "8px 12px 8px 36px", borderRadius: "30px", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="admin-table-container">
              <table className="admin-table" id="admin-products-dashboard-table">
                <thead>
                  <tr>
                    <th>Dish Details</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Available</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <tr key={p.id} id={`product-row-${p.id}`}>
                        <td style={{ display: "flex", alignCenter: "center", gap: "16px" }}>
                          <img
                            src={p.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop"}
                            alt={p.name}
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop";
                            }}
                            style={{ width: "44px", height: "44px", borderRadius: "4px", objectFit: "cover" }}
                          />
                          <div>
                            <div style={{ fontWeight: "600", display: "flex", alignCenter: "center", gap: "6px" }}>
                              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: p.isVeg ? "var(--status-veg)" : "var(--status-nonveg)" }}></span>
                              {p.name}
                            </div>
                            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                              {p.isBestSeller && <span className="badge bestseller-badge" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>Best</span>}
                              {p.isPopular && <span className="badge popular-badge" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>Popular</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                          {getCategoryName(p.categoryId)}
                        </td>
                        <td style={{ fontWeight: "700", fontFamily: "var(--font-display)" }}>
                          ${Number(p.price).toFixed(2)}
                        </td>
                        <td>
                          <button onClick={() => toggleAvailability(p)} style={{ color: p.isAvailable ? "var(--status-completed)" : "var(--text-muted)" }}>
                            {p.isAvailable ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                        </td>
                        <td>
                          <div className="flex gap-1 justify-center" style={{ width: "100%" }}>
                            <button className="btn-icon" onClick={() => handleEditProduct(p)} style={{ width: "32px", height: "32px" }}>
                              <Edit size={14} />
                            </button>
                            <button className="btn-icon" onClick={() => handleDeleteProduct(p.id)} style={{ width: "32px", height: "32px", color: "var(--status-cancelled)" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "48px 0" }}>
                        <div className="empty-state">
                          <AlertCircle size={36} style={{ color: "var(--text-muted)" }} />
                          <div className="empty-state-title">No dishes found</div>
                          <p className="empty-state-desc">Create categories first, then click "Add Menu Item" above to construct your food card.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- PRODUCT EDIT/ADD MODAL OVERLAY --- */}
        {showProductModal && (
          <div className="modal-overlay" id="product-crud-modal">
            <div className="modal-content" style={{ maxWidth: "600px" }}>
              <div className="modal-header">
                <h2>{editingProduct ? "Edit Menu Dish" : "Create New Menu Dish"}</h2>
                <button
                  className="btn-icon"
                  style={{ width: "32px", height: "32px" }}
                  onClick={() => setShowProductModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex flex-col gap-2">
                
                {/* Categorization */}
                <div className="input-group">
                  <label className="input-label" htmlFor="prod-category-select">Category (Required)</label>
                  <select
                    id="prod-category-select"
                    className="input-field"
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  {/* Name */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-name">Dish Name (Required)</label>
                    <input
                      id="prod-name"
                      type="text"
                      className="input-field"
                      placeholder="e.g. Garlic Naan"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-price">Price ($ USD) (Required)</label>
                    <input
                      id="prod-price"
                      type="number"
                      step="0.01"
                      className="input-field"
                      placeholder="9.99"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="input-group">
                  <label className="input-label" htmlFor="prod-desc">Dish Description</label>
                  <textarea
                    id="prod-desc"
                    className="input-field"
                    placeholder="Brief ingredients / details of the dish"
                    rows="2"
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    style={{ resize: "none" }}
                  ></textarea>
                </div>

                {/* Image upload file converter */}
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-image-url">Image URL (Optional)</label>
                    <input
                      id="prod-image-url"
                      type="text"
                      className="input-field"
                      placeholder="https://..."
                      value={productImgUrl}
                      onChange={(e) => setProductImgUrl(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-image-file">Or Upload Image File</label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="prod-image-file"
                        type="file"
                        accept="image/*"
                        className="input-field"
                        onChange={handleImageUpload}
                        style={{ padding: "8px 12px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Preview */}
                {productImgUrl && (
                  <div className="flex align-center gap-2" style={{ backgroundColor: "var(--surface-hover)", padding: "8px", borderRadius: "8px", margin: "4px 0" }}>
                    <img
                      src={productImgUrl}
                      alt="Preview"
                      style={{ width: "50px", height: "50px", borderRadius: "4px", objectFit: "cover" }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Image selected successfully</span>
                  </div>
                )}

                <div className="grid-2">
                  {/* Sort order */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="prod-sort">Sort Position</label>
                    <input
                      id="prod-sort"
                      type="number"
                      className="input-field"
                      value={productSortOrder}
                      onChange={(e) => setProductSortOrder(e.target.value)}
                    />
                  </div>

                  {/* Veg / Non-Veg Toggle */}
                  <div className="input-group">
                    <label className="input-label">Diet Classification</label>
                    <div className="flex gap-2" style={{ marginTop: "4px" }}>
                      <button
                        type="button"
                        className={`btn ${productIsVeg ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setProductIsVeg(true)}
                        style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem", borderRadius: "20px", backgroundColor: productIsVeg ? "var(--status-veg)" : "" }}
                      >
                        Vegetarian
                      </button>
                      <button
                        type="button"
                        className={`btn ${!productIsVeg ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setProductIsVeg(false)}
                        style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem", borderRadius: "20px", backgroundColor: !productIsVeg ? "var(--status-nonveg)" : "" }}
                      >
                        Non Veg
                      </button>
                    </div>
                  </div>
                </div>

                {/* Best Seller / Popular Badges Toggle */}
                <div className="flex gap-3" style={{ margin: "10px 0", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                  <label className="flex align-center gap-2" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={productIsBestSeller}
                      onChange={(e) => setProductIsBestSeller(e.target.checked)}
                      style={{ transform: "scale(1.2)" }}
                    />
                    <span>Mark as Best Seller</span>
                  </label>

                  <label className="flex align-center gap-2" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={productIsPopular}
                      onChange={(e) => setProductIsPopular(e.target.checked)}
                      style={{ transform: "scale(1.2)" }}
                    />
                    <span>Mark as Popular Item</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-2" style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                  <button type="submit" className="btn btn-secondary" style={{ flex: 1 }}>
                    {editingProduct ? "Save Changes" : "Create Food Dish"}
                  </button>
                  <button type="button" className="btn btn-outline" style={{ flex: 0.5 }} onClick={() => setShowProductModal(false)}>
                    Close
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
