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

// Fallback 404 view
import NotFound from "./pages/NotFound.jsx";

// Authentication state checkers
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase/firebase.js";

/* ==========================================================================
   ADMIN ROUTE PROTECTION COMPONENT
   ========================================================================== */
function AdminProtectedRoute({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="table-gate-screen">
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 16px" }}></div>
          <h3>Verifying Security Credentials...</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Connecting securely to EasyOrder Cloud Database.</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

/* ==========================================================================
   CUSTOMER MAIN CONTROLLER (Handles table validation vs menu rendering)
   ========================================================================== */
function CustomerController() {
  const { tableNumber, setTableNumber, isTableConfirmed, setIsTableConfirmed, clearTableNumber } = useCart();
  const location = useLocation();
  const { tableId } = useParams();
  const { showToast } = useToast();
  const welcomeToastShownRef = useRef(false);

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isTableValid, setIsTableValid] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const tableParam = searchParams.get("table") || tableId;

  // Track the table number we are validating or using
  const activeTableNum = tableParam || tableNumber;

  useEffect(() => {
    const validateTable = async () => {
      if (!activeTableNum) {
        setIsTableValid(false);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      setValidationError(null);

      try {
        const querySnapshot = await getDocs(collection(db, "tables"));
        const tableList = [];
        querySnapshot.forEach((doc) => {
          const name = doc.data().name;
          if (name) {
            tableList.push(name.toString().trim().toLowerCase());
          }
        });

        const target = activeTableNum.toString().trim().toLowerCase();
        const exists = tableList.some(
          (name) =>
            name === target ||
            name === `table ${target}` ||
            target === `table ${name}`
        );

        if (exists) {
          setIsTableValid(true);
          // If table came from params/url, auto-seat the customer
          if (tableParam) {
            setTableNumber(tableParam);
            setIsTableConfirmed(true);
            if (!welcomeToastShownRef.current) {
              showToast("Welcome", "success");
              welcomeToastShownRef.current = true;
            }
            // Clean query parameters/route elegantly without refreshing
            if (searchParams.get("table")) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } else {
          setIsTableValid(false);
          setValidationError(`Table "${activeTableNum}" is invalid or not registered in our database.`);
        }
      } catch (error) {
        console.error("Error validating table in CustomerController:", error);
        setValidationError("Could not connect to database. Please check your connection.");
      } finally {
        setIsValidating(false);
      }
    };

    validateTable();
  }, [tableParam, activeTableNum, setTableNumber, setIsTableConfirmed, showToast]);

  if (isValidating) {
    return (
      <div className="table-gate-screen" id="table-validation-loading-screen">
        <div className="card gate-card" style={{ maxWidth: "480px", padding: "48px", textAlign: "center" }}>
          <div className="skeleton" style={{ margin: "0 auto 16px", width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "rgba(230, 57, 70, 0.1)" }}></div>
          <h2>Verifying Table...</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "8px" }}>
            Connecting securely and checking table status. Please wait.
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
          <h2 style={{ color: "var(--primary-color)", fontSize: "1.5rem" }}>Invalid Table</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "12px", fontSize: "0.95rem" }}>
            {validationError}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
            <button className="btn btn-primary" onClick={() => {
              clearTableNumber();
              setValidationError(null);
              // Clean search param
              if (searchParams.get("table")) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }} style={{ width: "100%" }} id="btn-select-valid-table">
              Select or Enter a Valid Table
            </button>
            <a href="/admin/login" style={{ fontSize: "0.85rem", color: "var(--secondary-color)", fontWeight: "600", textDecoration: "none" }}>
              Go to Admin Panel &rarr;
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

  // Hide footer inside active admin interfaces
  const isAdminActive = location.pathname.startsWith("/admin");
  if (isAdminActive) return null;

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
                    {/* Customer Paths wrapped in ErrorBoundary */}
                    <Route
                      path="/"
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

                    {/* Admin Access Panel Paths */}
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
