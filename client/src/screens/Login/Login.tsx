import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import toast from "react-hot-toast";
import { authApi } from "../../utils/api_request/auth";
import { useUser } from "../../hooks/useUser";
import { APP_NAME } from "../../utils/constants";

const Login: React.FC = () => {
  const { login, isAuthenticated } = useUser();
  const [loggingIn, setLoggingIn] = useState(false);

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoggingIn(true);
    try {
      const data = await authApi.verifyGoogleToken(credentialResponse.credential);
      login(data.token, data.user);
    } catch {
      // handled globally
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--grad-hero)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating Om background */}
      {["10% 5%", "85% 80%", "70% 10%"].map((pos, i) => (
        <div
          key={i}
          className={i % 2 === 0 ? "animate-float" : "animate-float-rev"}
          style={{
            position: "absolute",
            top: pos.split(" ")[0],
            left: pos.split(" ")[1],
            fontFamily: "'Noto Serif Devanagari', serif",
            fontSize: `${4 + i}rem`,
            color: "rgba(255,255,255,0.07)",
            userSelect: "none", pointerEvents: "none",
            animationDelay: `${i * 0.7}s`,
          }}
        >ॐ</div>
      ))}

      <div
        className="card animate-fade-scale"
        style={{
          width: "100%",
          maxWidth: "380px",
          padding: "2.5rem",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              width: "72px", height: "72px",
              borderRadius: "20px",
              background: "var(--grad-hero)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "var(--shadow-glow)",
              fontSize: "2rem",
              fontFamily: "'Noto Serif Devanagari', serif",
              color: "white",
            }}
          >ॐ</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
            {APP_NAME}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Sign in to begin your daily journey
          </p>
        </div>

        {loggingIn ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}>
            <div className="spinner" />
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Signing you in…</span>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed. Try again.")}
              shape="pill"
              size="large"
              text="continue_with"
            />
          </div>
        )}

        <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          By continuing, you agree to receive daily Bhagavad Gita shloks on WhatsApp (after subscribing). 🙏
        </p>
      </div>
    </div>
  );
};

export default Login;
