import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SettingsProvider, useSettings } from "./context/SettingsContext.jsx";
import { CartProvider, useCart } from "./context/CartContext.jsx";
import { ToastProvider, useToast } from "./context/ToastContext.jsx";

// Common layout header
import Navbar from "./components/Navbar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Customer Views
import TableSelection from "./pages/customer/TableSelection.jsx";
import RestaurantMenu from "./pages/customer/RestaurantMenu.jsx";
import CartPage from "./pages/customer/CartPage.jsx";
import OrderSuccess from "./pages/customer/OrderSuccess.jsx";

// Admin Views
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminMenu from "./pages/admin/AdminMenu.jsx";
import AdminTables from "./pages/admin/AdminTables.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

// Super Admin Views
import SuperAdminLogin from "./pages/super-admin/SuperAdminLogin.jsx";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard.jsx";
import SuperAdminRestaurants from "./pages/super-admin/SuperAdminRestaurants.jsx";
import SuperAdminInspectRestaurant from "./pages/super-admin/SuperAdminInspectRestaurant.jsx";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings.jsx";

// Fallback 404 view
import NotFound from "./pages/NotFound.jsx";

// Authentication state checkers
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase/firebase.js";
import { getRestaurantByUidOrEmail } from "./firebase/multiRestaurant.js";

import AdminLayout from "./components/admin/AdminLayout.jsx";
import { doc, getDoc } from "firebase/firestore";

/* ==========================================================================
   ADMIN ROUTE PROTECTION COMPONENT
   ========================================================================== */
function AdminProtectedRoute({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(null);
  const { showToast } = useToast();
  const { setActiveRestaurantId } = useSettings();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const loginTime = parseInt(localStorage.getItem("adminLoginTimestamp") || "0", 10);
        const elapsed = Date.now() - loginTime;
        const SESSION_MAX_AGE = 12 * 60 * 60 * 1000;

        // Check if super admin session is active
        const superAdminSession = localStorage.getItem("superAdminSession");
        if (superAdminSession) {
          setCurrentUser(user);
          setAuthLoading(false);
          return;
        }

        if (loginTime > 0 && elapsed < SESSION_MAX_AGE) {
          const restaurant = await getRestaurantByUidOrEmail(user.uid, user.email);

          if (!restaurant) {
            localStorage.removeItem("adminLoginTimestamp");
            await signOut(auth).catch(() => {});
            setCurrentUser(null);
            setAccessDenied("Restaurant account could not be identified.");
            setAuthLoading(false);
            return;
          }

          if (restaurant.status === "inactive") {
            localStorage.removeItem("adminLoginTimestamp");
            await signOut(auth).catch(() => {});
            setCurrentUser(null);
            setAccessDenied("This restaurant account is currently inactive. Please contact the platform administrator.");
            setAuthLoading(false);
            return;
          }

          // Lock restaurant context strictly to assigned restaurant
          setActiveRestaurantId(restaurant.id);
          localStorage.setItem("activeAdminRestaurantId", restaurant.id);
          setCurrentUser(user);
          setAuthLoading(false);
        } else {
          localStorage.removeItem("adminLoginTimestamp");
          signOut(auth).catch(console.error);
          setCurrentUser(null);
          setAuthLoading(false);
        }
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [showToast, setActiveRestaurantId]);

  if (authLoading) {
    return (
      <div className="table-gate-screen">
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }}></div>
          <h3>Verifying Restaurant Admin Credentials...</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Connecting securely to EasyOrder Cloud Database.</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="table-gate-screen">
        <div className="card" style={{ padding: "40px", maxWidth: "440px", textAlign: "center" }}>
          <h3 style={{ color: "var(--status-cancelled)", marginBottom: "12px" }}>Access Restricted</h3>
          <p style={{ color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "20px" }}>{accessDenied}</p>
          <a href="/admin/login" className="btn btn-primary" style={{ display: "inline-block" }}>
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

/* ==========================================================================
   SUPER ADMIN ROUTE PROTECTION COMPONENT
   ========================================================================== */
function SuperAdminProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("superAdminSession");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.email) {
          setIsSuperAdmin(true);
        }
      } catch (e) {
        localStorage.removeItem("superAdminSession");
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="table-gate-screen">
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <h3>Authenticating Super Admin...</h3>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  return children;
}

/* ==========================================================================
   CUSTOMER MAIN CONTROLLER (Multi-Tenant Table & Menu Validation)
   ========================================================================== */
function CustomerController() {
  const { tableNumber, setTableNumber, isTableConfirmed, setIsTableConfirmed, clearTableNumber, setRestaurantId } = useCart();
  const { setActiveRestaurantId } = useSettings();
  const location = useLocation();
  const { restaurantId: paramResId, tableId: paramTableId } = useParams();
  const { showToast } = useToast();
  const welcomeToastShownRef = useRef(false);

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState(null);
  const [isTableValid, setIsTableValid] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const queryResId = searchParams.get("restaurantId") || searchParams.get("r");
  const queryTableId = searchParams.get("table") || searchParams.get("t");

  const resolvedResId = paramResId || queryResId || sessionStorage.getItem("easyorder-restaurant-id");
  const resolvedTableId = paramTableId || queryTableId || tableNumber;

  useEffect(() => {
    const validateTenantAndTable = async () => {
      if (!resolvedResId) {
        setValidationError("Restaurant account could not be identified. Please scan the QR code at your table.");
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      setValidationError(null);

      try {
        // 1. Verify Restaurant Document
        const resSnap = await getDoc(doc(db, "restaurants", resolvedResId));
        if (!resSnap.exists()) {
          setValidationError("Restaurant account could not be identified.");
          setIsValidating(false);
          return;
        }

        const resData = resSnap.data();
        if (resData.status === "inactive") {
          setValidationError("This restaurant is currently inactive.");
          setIsValidating(false);
          return;
        }

        // Lock Contexts to verified restaurant
        setActiveRestaurantId(resolvedResId);
        setRestaurantId(resolvedResId);

        // 2. Verify Table Document if table ID is present
        if (!resolvedTableId) {
          setIsTableValid(false);
          setIsValidating(false);
          return;
        }

        const querySnapshot = await getDocs(collection(db, `restaurants/${resolvedResId}/tables`));
        const tableList = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          tableList.push({
            id: docSnap.id,
            name: data.name ? data.name.toString().trim() : ""
          });
        });

        const target = resolvedTableId.toString().trim().toLowerCase();
        const foundTable = tableList.find(
          (t) =>
            t.id.toLowerCase() === target ||
            t.name.toLowerCase() === target ||
            t.name.toLowerCase() === `table ${target}` ||
            target === `table ${t.name.toLowerCase()}`
        );

        if (foundTable) {
          setIsTableValid(true);
          setTableNumber(foundTable.name);
          setIsTableConfirmed(true);

          if (!welcomeToastShownRef.current) {
            showToast(`Welcome to ${resData.name || "our restaurant"}!`, "success");
            welcomeToastShownRef.current = true;
          }
        } else {
          // Fallback if no specific table document matches but table number was provided
          if (resolvedTableId) {
            setIsTableValid(true);
            setTableNumber(resolvedTableId);
            setIsTableConfirmed(true);
          } else {
            setIsTableValid(false);
            setValidationError(`Table "${resolvedTableId}" is invalid or not registered for this restaurant.`);
          }
        }
      } catch (error) {
        console.error("Error validating tenant & table:", error);
        setValidationError("Could not connect to database. Please check your connection.");
      } finally {
        setIsValidating(false);
      }
    };

    validateTenantAndTable();
  }, [resolvedResId, resolvedTableId, setActiveRestaurantId, setRestaurantId, setTableNumber, setIsTableConfirmed, showToast]);

  if (isValidating) {
    return (
      <div className="table-gate-screen" id="table-validation-loading-screen">
        <div className="card gate-card" style={{ maxWidth: "480px", padding: "48px", textAlign: "center" }}>
          <div className="skeleton" style={{ margin: "0 auto 16px", width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "rgba(230, 57, 70, 0.1)" }}></div>
          <h2>Loading Digital Menu...</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "8px" }}>
            Verifying restaurant details and table session. Please wait.
          </p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="table-gate-screen" id="table-validation-invalid-screen">
        <div className="card gate-card" style={{ maxWidth: "480px", padding: "48px", textAlign: "center" }}>
          <div style={{ color: "var(--primary-color)", marginBottom: "16px", display: "flex", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ color: "var(--primary-color)", fontSize: "1.4rem" }}>Unable to Load Menu</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "0.95rem" }}>
            {validationError}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
            <a href="/admin/login" className="btn btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
              Restaurant Admin Login &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isTableConfirmed || !isTableValid || !tableNumber) {
    return (
      <TableSelection
        onValidTable={() => {
          setIsTableConfirmed(true);
          setIsTableValid(true);
        }}
      />
    );
  }

  return <RestaurantMenu />;
}

/* ==========================================================================
   SHARED FOOTER MODULE
   ========================================================================== */
function FootBranding() {
  const { settings } = useSettings();
  const location = useLocation();

  // Hide footer on home login page, admin interface, or super admin interface
  const isHideFooter =
    location.pathname === "/" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/superadmin") ||
    location.pathname.startsWith("/super-admin");

  if (isHideFooter) return null;

  return (
    <footer
      style={{
        textAlign: "center",
        padding: "48px 24px",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "var(--surface-color)",
        color: "var(--text-secondary)",
        fontSize: "0.85rem",
        marginTop: "auto"
      }}
      id="easyorder-page-footer"
    >
      <p style={{ fontWeight: "500" }}>{settings.footerText}</p>
      <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>{settings.copyright}</p>
    </footer>
  );
}

/* ==========================================================================
   APP SHELL
   ========================================================================== */
export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <CartProvider>
          <ToastProvider>
            <Router>
              <div
                className="easyorder-app"
                style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
              >
                {/* Global Sticky Header */}
                <Navbar />

                {/* Main Content Router */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <Routes>
                    {/* Main Homepage is the Restaurant Admin Login Page */}
                    <Route path="/" element={<AdminLogin />} />

                    {/* Customer Paths */}
                    <Route
                      path="/menu/:restaurantId/:tableId"
                      element={
                        <ErrorBoundary>
                          <CustomerController />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/menu/:restaurantId"
                      element={
                        <ErrorBoundary>
                          <CustomerController />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/customer/:restaurantId/:tableId"
                      element={
                        <ErrorBoundary>
                          <CustomerController />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/customer"
                      element={
                        <ErrorBoundary>
                          <CustomerController />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/customer/:tableId"
                      element={
                        <ErrorBoundary>
                          <CustomerController />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <ErrorBoundary>
                          <CartPage />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/order-success/:orderId"
                      element={
                        <ErrorBoundary>
                          <OrderSuccess />
                        </ErrorBoundary>
                      }
                    />

                    {/* Restaurant Admin Access Panel Paths */}
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    
                    <Route
                      path="/admin/dashboard"
                      element={
                        <AdminProtectedRoute>
                          <AdminDashboard />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <AdminProtectedRoute>
                          <AdminOrders />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/menu"
                      element={
                        <AdminProtectedRoute>
                          <AdminMenu />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/tables"
                      element={
                        <AdminProtectedRoute>
                          <AdminTables />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <AdminProtectedRoute>
                          <AdminSettings />
                        </AdminProtectedRoute>
                      }
                    />

                    {/* Super Admin Access Paths */}
                    <Route path="/superadmin" element={<SuperAdminLogin />} />
                    <Route path="/super-admin" element={<Navigate to="/superadmin" replace />} />
                    
                    <Route
                      path="/superadmin/dashboard"
                      element={
                        <SuperAdminProtectedRoute>
                          <SuperAdminDashboard />
                        </SuperAdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/superadmin/restaurants"
                      element={
                        <SuperAdminProtectedRoute>
                          <SuperAdminRestaurants />
                        </SuperAdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/superadmin/restaurants/:restaurantId"
                      element={
                        <SuperAdminProtectedRoute>
                          <SuperAdminInspectRestaurant />
                        </SuperAdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/superadmin/settings"
                      element={
                        <SuperAdminProtectedRoute>
                          <SuperAdminSettings />
                        </SuperAdminProtectedRoute>
                      }
                    />

                    {/* 404 Fallback routing */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>

                {/* Common brand footer */}
                <FootBranding />
              </div>
            </Router>
          </ToastProvider>
        </CartProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
