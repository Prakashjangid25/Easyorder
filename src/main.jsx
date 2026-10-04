import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initializeSuperAdmin } from "./firebase/initSuperAdmin.js";

// Auto-create super admin account on app startup
initializeSuperAdmin();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
