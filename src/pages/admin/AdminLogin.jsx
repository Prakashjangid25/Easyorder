import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
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
import { Lock, Mail, LogIn, KeyRound, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        errMsg = "Incorrect email or password.";
        setLoginError("Invalid email or password. Please verify your admin credentials.");
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
      <div className="card gate-card" style={{ maxWidth: "440px", padding: "40px 32px" }}>
        <div className="gate-icon-wrapper" style={{ backgroundColor: "rgba(69, 123, 157, 0.1)", color: "var(--secondary-color)" }}>
          <Lock size={36} />
        </div>

        <div>
          <h1 className="gate-title" style={{ fontSize: "1.6rem" }}>{settings.restaurantName || "EasyOrder"}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600", marginTop: "4px" }}>
            Restaurant Admin Login
          </p>
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
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} style={{ width: "100%", textAlign: "left", marginTop: "20px" }}>
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
            style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: "16px", fontWeight: "700" }}
            disabled={loading}
            id="admin-login-submit-btn"
          >
            <LogIn size={18} />
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 16px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
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
