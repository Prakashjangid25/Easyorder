import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="table-gate-screen" style={{ padding: "20px", textAlign: "center" }} id="error-boundary-screen">
          <div className="card" style={{ maxWidth: "500px", margin: "40px auto", padding: "32px", borderRadius: "12px", boxShadow: "var(--shadow-lg)" }} id="error-boundary-card">
            <div style={{ color: "var(--primary-color)", marginBottom: "16px", display: "flex", justifyContent: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", fontWeight: "700" }}>Something Went Wrong</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              An unexpected error occurred while loading this page.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: "left",
                backgroundColor: "var(--surface-hover)",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                overflowX: "auto",
                marginBottom: "20px",
                color: "var(--status-cancelled)",
                maxHeight: "150px"
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                sessionStorage.clear();
                window.location.href = "/";
              }}
              style={{ width: "100%" }}
              id="error-boundary-back-btn"
            >
              Back to Landing Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
