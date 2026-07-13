import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info, X, Bell } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title, type = "info", desc = "", duration) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, title, type, desc }]);
    
    const timeToDismiss = duration || (type === "new-order" ? 5500 : 4000);
    setTimeout(() => {
      removeToast(id);
    }, timeToDismiss);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Dynamic Toast Portal */}
      <div className="toast-container" id="easyorder-toast-container">
        {toasts.map((t) => {
          const isNewOrderType = t.type === "new-order";
          return (
            <div 
              key={t.id} 
              className={`toast ${t.type}`} 
              id={`toast-${t.id}`}
              style={isNewOrderType ? {
                backgroundColor: "var(--status-completed, #10b981)",
                color: "#ffffff",
                borderLeft: "none",
                borderRadius: "12px",
                padding: "16px 20px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                animation: "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              } : {}}
            >
              <div className="flex gap-2" style={{ display: "flex", gap: "12px", width: "100%" }}>
                <div className="toast-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {t.type === "success" && <CheckCircle size={20} color="var(--status-completed)" />}
                  {t.type === "error" && <AlertTriangle size={20} color="var(--status-cancelled)" />}
                  {t.type === "info" && <Info size={20} color="var(--status-preparing)" />}
                  {isNewOrderType && (
                    <div style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "50%",
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Bell size={20} color="#ffffff" className="animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="toast-content" style={isNewOrderType ? { color: "#ffffff", flex: 1 } : { flex: 1 }}>
                  <div className="toast-title" style={isNewOrderType ? { fontSize: "1rem", fontWeight: "700", color: "#ffffff", marginBottom: "4px" } : {}}>
                    {t.title}
                  </div>
                  {t.desc && (
                    <div className="toast-desc" style={isNewOrderType ? { color: "rgba(255, 255, 255, 0.95)", fontSize: "0.85rem", fontWeight: "500", whiteSpace: "pre-line", lineHeight: "1.4" } : { whiteSpace: "pre-line" }}>
                      {t.desc}
                    </div>
                  )}
                </div>
              </div>
              <button 
                className="toast-close" 
                onClick={() => removeToast(t.id)}
                style={isNewOrderType ? { 
                  color: "#ffffff", 
                  opacity: 0.8, 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer",
                  padding: "4px",
                  marginLeft: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                } : {}}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
