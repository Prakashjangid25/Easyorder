import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useCart } from "../../context/CartContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Search, ShoppingBag, Leaf, Flame, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MenuCardSkeleton } from "../../components/SkeletonLoader.jsx";
import { formatCurrency } from "../../utils/format.js";

export default function RestaurantMenu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const { settings, activeRestaurantId } = useSettings();
  const { theme } = useTheme();
  const { cart, addToCart, removeFromCart, getCartCount, getCartTotal, clearTableNumber } = useCart();
  const navigate = useNavigate();

  const catsColPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/categories`
    : "categories";

  const prodsColPath = activeRestaurantId && activeRestaurantId !== "default"
    ? `restaurants/${activeRestaurantId}/products`
    : "products";

  // Listen to Categories and Products in real-time
  useEffect(() => {
    setLoading(true);

    const categoriesQuery = query(collection(db, catsColPath), orderBy("sortOrder", "asc"));
    const unsubscribeCats = onSnapshot(categoriesQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCategories(list);
    }, (err) => {
      console.error("Categories read error:", err);
    });

    const productsQuery = query(collection(db, prodsColPath), orderBy("sortOrder", "asc"));
    const unsubscribeProds = onSnapshot(productsQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setProducts(list);
      setLoading(false);
    }, (err) => {
      console.error("Products read error:", err);
      setLoading(false);
    });

    return () => {
      unsubscribeCats();
      unsubscribeProds();
    };
  }, [activeRestaurantId, catsColPath, prodsColPath]);

  // Filter products based on search and selected category
  const filteredProducts = products.filter((p) => {
    if (p.isAvailable === false) return false;

    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getProductQuantityInCart = (id) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  return (
    <div className="container" id="restaurant-menu-page-container" style={{ paddingBottom: "100px", width: "100%", maxWidth: "1200px", boxSizing: "border-box" }}>
      {/* Back to landing page button */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px", marginTop: "12px", width: "100%", maxWidth: "100%", minWidth: 0 }} id="back-to-landing-btn-container">
        <button
          className="btn btn-outline"
          onClick={() => {
            clearTableNumber();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.82rem",
            fontWeight: "600",
            padding: "6px 14px",
            borderRadius: "20px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--surface-color)",
            color: "var(--text-primary)",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease"
          }}
          id="back-to-landing-btn"
        >
          <ArrowLeft size={14} style={{ color: "var(--primary-color)" }} />
          <span>Change Table</span>
        </button>
      </div>

      {/* Premium Hero Restaurant Banner */}
      <div
        className="hero-banner"
        style={{
          backgroundImage: `url(${settings.restaurantBanner || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop"})`,
        }}
        id="menu-hero-banner"
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{settings.restaurantName || "Our Restaurant"}</h1>
          <p className="hero-subtitle">
            {settings.isOpen ? (
              <span style={{ color: "#10b981", fontWeight: "600" }}>● We are Open • Serving Fresh</span>
            ) : (
              <span style={{ color: "#ef4444", fontWeight: "600" }}>● Temporarily Closed • Pre-orders only</span>
            )}
            {` • Hours: ${settings.openingTime || "10:00"} - ${settings.closingTime || "22:00"}`}
          </p>
        </div>
      </div>

      {/* Modern Search */}
      <div className="search-bar-wrapper" id="menu-search-wrapper">
        <div className="search-input-container">
          <Search className="search-icon-left" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search delicious food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Sticky Scrollable Category Tab Bar */}
      <div className="category-tabs-container" id="menu-categories-navbar">
        <div className="category-tabs">
          <button
            className={`category-tab ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid Cards */}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <MenuCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="product-grid" id="menu-products-grid">
          {filteredProducts.map((p) => {
            const qty = getProductQuantityInCart(p.id);
            return (
              <div className="product-card" key={p.id} id={`product-card-${p.id}`}>
                {/* Product Image */}
                <div className="product-image-wrapper">
                  <img
                    className="product-img"
                    src={p.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop"}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop";
                    }}
                  />
                </div>

                {/* Product Info details */}
                <div className="product-card-info">
                  <div>
                    {/* Diet Badges */}
                    <div className="product-badges">
                      {p.isVeg ? (
                        <span className="badge veg-badge" style={{ gap: "4px" }}>
                          <Leaf size={10} fill="var(--status-veg)" /> Veg
                        </span>
                      ) : (
                        <span className="badge nonveg-badge">Non-Veg</span>
                      )}
                      {p.isBestSeller && (
                        <span className="badge bestseller-badge" style={{ gap: "4px" }}>
                          <Flame size={10} fill="#d97706" /> Bestseller
                        </span>
                      )}
                      {p.isPopular && (
                        <span className="badge popular-badge" style={{ gap: "4px" }}>
                          <Sparkles size={10} fill="#3b82f6" /> Popular
                        </span>
                      )}
                    </div>

                    <h3 className="product-card-title">{p.name}</h3>
                    {p.description && <p className="product-card-desc">{p.description}</p>}
                  </div>

                  {/* Pricing and Tap targets Action */}
                  <div className="product-price-action">
                    <span className="product-price">{formatCurrency(p.price)}</span>

                    {qty > 0 ? (
                      <div className="quantity-selector">
                        <button
                          className="qty-btn"
                          onClick={() => removeFromCart(p.id)}
                          aria-label="Decrease"
                        >
                          -
                        </button>
                        <span className="qty-val">{qty}</span>
                        <button
                          className="qty-btn"
                          onClick={() => addToCart(p)}
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700" }}
                        onClick={() => addToCart(p)}
                        id={`add-to-cart-btn-${p.id}`}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" id="menu-empty-state">
          <AlertCircle size={48} style={{ color: "var(--text-muted)" }} />
          <div className="empty-state-title">No items found</div>
          <div className="empty-state-desc">
            We couldn't find any delicious match for your current filters. Please try another selection.
          </div>
        </div>
      )}

      {/* Sticky Floating Cart Checkout Bar */}
      {getCartCount() > 0 && (
        <button
          className="floating-cart-trigger"
          onClick={() => navigate("/cart")}
          id="floating-cart-bar-btn"
        >
          <ShoppingBag size={20} />
          <span>View Cart</span>
          <span className="cart-badge-count">{getCartCount()}</span>
          <span style={{ marginLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: "12px" }}>
            {formatCurrency(getCartTotal())}
          </span>
        </button>
      )}
    </div>
  );
}
