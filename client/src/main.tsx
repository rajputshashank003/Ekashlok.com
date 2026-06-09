import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { MaintenanceProvider } from "./context/MaintenanceContext";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
    <BrowserRouter>
      <AuthProvider>
        <MaintenanceProvider>
          <App />
          <Analytics />
        </MaintenanceProvider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
