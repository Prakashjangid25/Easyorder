import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title, type = "info", desc = "") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, title, type, desc }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Dynamic Toast Portal */}
      <div className="toast-container" id="easyorder-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} id={`toast-${t.id}`}>
            <div className="flex gap-2">
              <div className="toast-icon">
                {t.type === "success" && <CheckCircle size={20} color="var(--status-completed)" />}
                {t.type === "error" && <AlertTriangle size={20} color="var(--status-cancelled)" />}
                {t.type === "info" && <Info size={20} color="var(--status-preparing)" />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{t.title}</div>
                {t.desc && <div className="toast-desc">{t.desc}</div>}
              </div>
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
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
