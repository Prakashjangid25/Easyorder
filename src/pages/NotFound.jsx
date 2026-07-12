import React from "react";
import { useNavigate } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="table-gate-screen" id="not-found-page-container">
      <div className="card gate-card" style={{ maxWidth: "480px", padding: "48px" }}>
        <div className="gate-icon-wrapper" style={{ backgroundColor: "rgba(230, 57, 70, 0.1)", color: "var(--primary-color)" }}>
          <Compass size={40} />
        </div>

        <div>
          <h1 className="gate-title">Page Not Found</h1>
          <p className="gate-desc" style={{ marginTop: "8px" }}>
            We searched high and low in our kitchens, but we couldn't find the page you are looking for. Let's get you back to the menu!
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/")}
          style={{ width: "100%", gap: "8px", padding: "14px", fontSize: "1rem" }}
          id="not-found-go-back-btn"
        >
          <ArrowLeft size={18} />
          Go to Food Menu
        </button>
      </div>
    </div>
  );
}
