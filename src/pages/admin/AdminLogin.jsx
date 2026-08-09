import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase.js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Lock, Mail, LogIn, UserPlus, KeyRound, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loginError, setLoginError] = useState("");

  const { showToast } = useToast();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const loginTime = parseInt(localStorage.getItem("adminLoginTimestamp") || "0", 10);
        const elapsed = Date.now() - loginTime;
        const SESSION_MAX_AGE = 12 * 60 * 60 * 1000;
        if (loginTime > 0 && elapsed < SESSION_MAX_AGE) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          localStorage.removeItem("adminLoginTimestamp");
          signOut(auth).catch(console.error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const saveAdminRoleAndLogin = async (user) => {
    localStorage.setItem("adminLoginTimestamp", Date.now().toString());
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: "admin",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Could not save admin role to Firestore:", err);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await saveAdminRoleAndLogin(userCredential.user);
      showToast("Access Granted. Welcome back!", "success");
      navigate("/admin/dashboard");
    } catch (error) {
      localStorage.removeItem("adminLoginTimestamp");
      console.error("Login error:", error);
      let errMsg = "Invalid email or password. Please check your credentials.";
      
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errMsg = "Incorrect credentials or account not found.";
        setLoginError("Invalid email or password. If you don't have an admin account yet, click 'Create Admin Account' tab above to register.");
      } else if (error.code === "auth/too-many-requests") {
        errMsg = "Too many failed attempts. Please reset your password or try again later.";
        setLoginError(errMsg);
      } else {
        setLoginError(error.message || errMsg);
      }
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    setLoginError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await saveAdminRoleAndLogin(userCredential.user);
      showToast("Admin account created successfully!", "success");
      navigate("/admin/dashboard");
    } catch (error) {
      localStorage.removeItem("adminLoginTimestamp");
      console.error("Registration error:", error);
      let errMsg = "Failed to create account.";
      if (error.code === "auth/email-already-in-use") {
        errMsg = "An account with this email already exists. Try signing in or reset password.";
        setMode("login");
      } else if (error.code === "auth/weak-password") {
        errMsg = "Password is too weak. Please use at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errMsg = "Invalid email format.";
      }
      setLoginError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveAdminRoleAndLogin(result.user);
      showToast("Access Granted via Google Login!", "success");
      navigate("/admin/dashboard");
    } catch (error) {
      localStorage.removeItem("adminLoginTimestamp");
      console.error("Google Auth error:", error);
      showToast("Google login failed. Please ensure Google Sign-In is enabled.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      showToast("Please enter your email address to reset password", "error");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      showToast(`Password reset link sent to ${targetEmail}!`, "success");
      setShowResetModal(false);
    } catch (error) {
      console.error("Reset error:", error);
      showToast(error.message || "Failed to send reset email.", "error");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="table-gate-screen" id="admin-login-page-container">
      <div className="card gate-card" style={{ maxWidth: "480px", padding: "40px 32px" }}>
        <div className="gate-icon-wrapper" style={{ backgroundColor: "rgba(69, 123, 157, 0.1)", color: "var(--secondary-color)" }}>
          <Lock size={36} />
        </div>

        <div>
          <h1 className="gate-title" style={{ fontSize: "1.6rem" }}>{settings.restaurantName || "EasyOrder Admin"}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600", marginTop: "4px" }}>
            Staff & Restaurant Management Portal
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="admin-filters" style={{ width: "100%", marginTop: "16px", display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`filter-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setLoginError(""); }}
            style={{ flex: 1, textAlign: "center", justifyContent: "center" }}
            id="tab-sign-in"
          >
            <LogIn size={14} style={{ marginRight: "6px" }} /> Sign In
          </button>
          <button
            type="button"
            className={`filter-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setLoginError(""); }}
            style={{ flex: 1, textAlign: "center", justifyContent: "center" }}
            id="tab-register"
          >
            <UserPlus size={14} style={{ marginRight: "6px" }} /> Create Admin
          </button>
        </div>

        {/* Actionable Error Banner if credentials fail */}
        {loginError && (
          <div
            style={{
              width: "100%",
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--status-cancelled)",
              fontSize: "0.85rem",
              textAlign: "left"
            }}
          >
            <div className="flex align-center gap-2" style={{ fontWeight: "600", marginBottom: "4px" }}>
              <AlertCircle size={16} />
              <span>Authentication Error</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-primary)" }}>{loginError}</p>

            {mode === "login" && (
              <div className="flex gap-2" style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "12px" }}
                  onClick={() => { setMode("register"); setLoginError(""); }}
                >
                  Switch to Create Account
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "12px" }}
                  onClick={() => { setResetEmail(email); setShowResetModal(true); }}
                >
                  Reset Password
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        {mode === "login" ? (
          <form onSubmit={handleEmailLogin} style={{ width: "100%", textAlign: "left", marginTop: "16px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="admin-email">Email Address</label>
              <div className="input-with-icon-wrapper">
                <Mail size={16} className="input-with-icon-left" />
                <input
                  id="admin-email"
                  type="email"
                  className="input-field input-field-with-icon"
                  placeholder="admin@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: "12px" }}>
              <div className="flex justify-between align-center">
                <label className="input-label" htmlFor="admin-password">Password</label>
                <button
                  type="button"
                  onClick={() => { setResetEmail(email); setShowResetModal(true); }}
                  style={{ background: "none", border: "none", color: "var(--secondary-color)", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="input-with-icon-left" />
                <input
                  id="admin-password"
                  type="password"
                  className="input-field input-field-with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: "12px" }}
              disabled={loading}
              id="admin-login-submit-btn"
            >
              <LogIn size={18} />
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} style={{ width: "100%", textAlign: "left", marginTop: "16px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="register-email">Admin Email Address</label>
              <div className="input-with-icon-wrapper">
                <Mail size={16} className="input-with-icon-left" />
                <input
                  id="register-email"
                  type="email"
                  className="input-field input-field-with-icon"
                  placeholder="admin@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-password">Password (min 6 chars)</label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="input-with-icon-left" />
                <input
                  id="register-password"
                  type="password"
                  className="input-field input-field-with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: "16px" }}>
              <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="input-with-icon-left" />
                <input
                  id="confirm-password"
                  type="password"
                  className="input-field input-field-with-icon"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
              disabled={loading}
              id="admin-register-submit-btn"
            >
              <UserPlus size={18} />
              {loading ? "Creating Account..." : "Create Admin Account & Log In"}
            </button>
          </form>
        )}

        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", margin: "16px 0 12px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
          <span>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
        </div>

        {/* Google Authentication */}
        <button
          className="btn btn-outline"
          onClick={handleGoogleLogin}
          style={{ width: "100%", gap: "10px", padding: "12px" }}
          disabled={loading}
          id="admin-google-login-btn"
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
            alt="Google Logo"
            style={{ width: "18px", height: "18px" }}
          />
          <span>Sign In with Google</span>
        </button>

        {/* Help Info Box */}
        <div
          style={{
            marginTop: "16px",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            lineHeight: "1.4",
            backgroundColor: "var(--surface-hover)",
            padding: "12px",
            borderRadius: "8px",
            width: "100%",
            textAlign: "left"
          }}
        >
          <span style={{ fontWeight: "600", display: "block", marginBottom: "2px" }}>💡 First-time Admin setup?</span>
          You can create a new Admin account using the <strong>Create Admin</strong> tab above or sign in with Google.
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="modal-overlay" id="password-reset-modal">
          <div className="modal-content" style={{ maxWidth: "420px", padding: "28px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <KeyRound size={20} color="var(--secondary-color)" /> Reset Admin Password
              </h3>
              <button
                className="btn-icon"
                style={{ width: "28px", height: "28px" }}
                onClick={() => setShowResetModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "12px 0 16px" }}>
              Enter your registered admin email address below to receive a password reset link.
            </p>

            <form onSubmit={handlePasswordReset}>
              <div className="input-group">
                <label className="input-label" htmlFor="reset-email-input">Email Address</label>
                <input
                  id="reset-email-input"
                  type="email"
                  className="input-field"
                  placeholder="admin@restaurant.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2" style={{ marginTop: "20px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: "700" }}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
