import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase.js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Lock, Mail, LogIn, Sparkles } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
          // expired or invalid
          localStorage.removeItem("adminLoginTimestamp");
          signOut(auth).catch(console.error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      // Set the timestamp FIRST to avoid race conditions with onAuthStateChanged / App.jsx guards
      localStorage.setItem("adminLoginTimestamp", Date.now().toString());
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast("Access Granted. Welcome back!", "success");
      navigate("/admin/dashboard");
    } catch (error) {
      localStorage.removeItem("adminLoginTimestamp");
      console.error("Login error:", error);
      let errMsg = "Invalid email or password. Please try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errMsg = "Incorrect credentials. If this is a new project, please enable Email/Password Auth in Firebase console.";
      }
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Set the timestamp FIRST to avoid race conditions with onAuthStateChanged / App.jsx guards
      localStorage.setItem("adminLoginTimestamp", Date.now().toString());
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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

  return (
    <div className="table-gate-screen" id="admin-login-page-container">
      <div className="card gate-card" style={{ maxWidth: "460px", padding: "48px" }}>
        <div className="gate-icon-wrapper" style={{ backgroundColor: "rgba(69, 123, 157, 0.1)", color: "var(--secondary-color)" }}>
          <Lock size={36} />
        </div>

        <div>
          <h1 className="gate-title" style={{ fontSize: "1.6rem" }}>{settings.restaurantName}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600", marginTop: "4px" }}>
            Staff Administration
          </p>
        </div>

        <form onSubmit={handleEmailLogin} style={{ width: "100%", textAlign: "left" }}>
          {/* Email input */}
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

          {/* Password Input */}
          <div className="input-group" style={{ marginBottom: "28px" }}>
            <label className="input-label" htmlFor="admin-password">Password</label>
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

          {/* Login Submit Button */}
          <button
            type="submit"
            className="btn btn-secondary"
            style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
            disabled={loading}
            id="admin-login-submit-btn"
          >
            <LogIn size={18} />
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>

        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", margin: "12px 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
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

        {/* Informative Help Alert */}
        <div
          style={{
            marginTop: "12px",
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
          Enable "Email/Password" or "Google" in your Firebase Project Console (Authentication Providers), and register your admin email.
        </div>
      </div>
    </div>
  );
}
