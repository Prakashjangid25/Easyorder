import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Utensils, HelpCircle } from "lucide-react";
import { handleFirestoreError, OperationType } from "../../firebase/errorHandler.js";

export default function TableSelection({ onValidTable }) {
  const { tableNumber, setTableNumber } = useCart();
  const [tableInput, setTableInput] = useState(tableNumber || "");
  const [verifying, setVerifying] = useState(false);
  const [activeTables, setActiveTables] = useState([]);
  const { showToast } = useToast();
  const { settings } = useSettings();

  // Load valid tables from Firestore on mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "tables"));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setActiveTables(list);
      } catch (error) {
        console.error("Error pre-fetching tables list:", error);
      }
    };
    fetchTables();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanInput = tableInput.trim().toLowerCase();
    if (!cleanInput) {
      showToast("Please enter your table number", "error");
      return;
    }

    setVerifying(true);
    try {
      // Re-fetch list to verify freshest data
      const querySnapshot = await getDocs(collection(db, "tables"));
      const latestTables = [];
      querySnapshot.forEach((doc) => {
        latestTables.push({ id: doc.id, ...doc.data() });
      });

      // Check if input matches any table name (case insensitive)
      const matchedTable = latestTables.find(
        (t) =>
          t.name.trim().toLowerCase() === cleanInput ||
          t.name.trim().toLowerCase() === `table ${cleanInput}` ||
          cleanInput === `table ${t.name.trim().toLowerCase()}`
      );

      if (matchedTable) {
        // Save the canonical name (e.g. "Table 5" or "5")
        setTableNumber(matchedTable.name);
        showToast(`Welcome! You are seated at ${matchedTable.name}`, "success");
        onValidTable();
      } else {
        showToast("This table is not available. Please enter a valid table number or contact the restaurant staff.", "error");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "tables");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="table-gate-screen" id="table-gatekeeper-container">
      <div className="card gate-card" id="gatekeeper-card-inner">
        <div className="gate-icon-wrapper">
          <Utensils size={40} />
        </div>
        
        <div>
          <h1 className="gate-title">Welcome to {settings.restaurantName}</h1>
          <p className="gate-desc">
            Please enter the table number shown on the QR code sticker to browse our menu and place order.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div className="input-group">
            <label className="input-label" htmlFor="table-number-input">Table Number</label>
            <input
              id="table-number-input"
              type="text"
              className="input-field"
              placeholder="e.g. 5"
              autocomplete="off"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              disabled={verifying}
              style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "600" }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px", fontSize: "1.1rem" }}
            disabled={verifying}
            id="table-gatekeeper-submit-btn"
          >
            {verifying ? "Verifying Table..." : "Enter Restaurant Menu"}
          </button>
        </form>



        {/* Active Tables List / Badges */}
        {activeTables.length > 0 ? (
          <div style={{ width: "100%", marginTop: "24px", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "10px", fontWeight: "600" }}>
              Or quick select a registered table:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              {activeTables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="btn-pill"
                  onClick={() => {
                    setTableInput(t.name);
                    setTableNumber(t.name);
                    showToast(`Welcome! Seated at ${t.name}`, "success");
                    onValidTable();
                  }}
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    borderRadius: "20px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--surface-color)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          !verifying && (
            <div style={{ width: "100%", marginTop: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <p>No active tables found in the database.</p>
              <p style={{ fontSize: "0.75rem", marginTop: "4px" }}>Please contact the restaurant staff to register tables.</p>
            </div>
          )
        )}

        {/* Direct Link to Admin Panel for convenience */}
        <div style={{ borderTop: "1px solid var(--border-color)", width: "100%", marginTop: "24px", paddingTop: "16px", textAlign: "center" }}>
          <a
            href="/admin/login"
            style={{ fontSize: "0.8rem", color: "var(--secondary-color)", fontWeight: "600", textDecoration: "none" }}
          >
            Go to Admin Dashboard &rarr;
          </a>
        </div>

        <div className="flex align-center gap-1" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "12px" }}>
          <HelpCircle size={14} />
          <span>Need help? Please call our dining room staff.</span>
        </div>
      </div>
    </div>
  );
}
