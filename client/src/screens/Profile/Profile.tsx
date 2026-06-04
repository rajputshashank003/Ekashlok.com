import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import OTPModal from "../../components/OTPModal/OTPModal";
import { shlokApi } from "../../utils/api_request/shlok";
import { waApi } from "../../utils/api_request/whatsapp";
import { useUser } from "../../hooks/useUser";
import { TOTAL_SHLOKS, DAILY_SEND_TIME, APP_NAME } from "../../utils/constants";

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateUser, logout } = useUser();
  const [showOTP, setShowOTP] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  if (!isLoading && !isAuthenticated) return <Navigate to="/" replace />;
  if (!user) return null;

  const progressPct = Math.round((user.shlok_count / TOTAL_SHLOKS) * 100);

  const handleReset = async () => {
    setResetting(true);
    try {
      await shlokApi.resetShlokCount();
      toast.success("Progress reset to Shlok 1 🌱");
      updateUser({ shlok_count: 1 });
      setShowResetConfirm(false);
    } finally {
      setResetting(false);
    }
  };

  const handleUnsubscribe = async () => {
    setUnsubscribing(true);
    try {
      await waApi.unsubscribe();
      toast.success("Unsubscribed from WhatsApp delivery");
      updateUser({ is_wa_subscribed: false });
    } finally {
      setUnsubscribing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <div className="container-app" style={{ maxWidth: "680px", padding: "2rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "2rem" }}>
          My Profile
        </h1>

        {/* ── User Info Card ── */}
        <div className="card" style={{ padding: "1.75rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
              />
            ) : (
              <div
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "var(--grad-hero)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", fontWeight: 800, color: "white",
                }}
              >
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>{user.name}</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{user.email}</p>
              {user.is_admin && <span className="badge badge-bhagwa" style={{ marginTop: "0.3rem" }}>Admin</span>}
            </div>
          </div>
          <button className="btn-ghost" style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#dc2626" }} onClick={logout}>
            Sign Out
          </button>
        </div>

        {/* ── Shlok Progress Card ── */}
        <div className="card" style={{ padding: "1.75rem", marginBottom: "1.25rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
            📖 Reading Progress
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Current Shlok</span>
            <span className="badge badge-bhagwa">{user.shlok_count} / {TOTAL_SHLOKS}</span>
          </div>
          <div className="progress-track" style={{ marginBottom: "0.5rem" }}>
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            {progressPct}% of Bhagavad Gita completed
          </p>
          <button
            className="btn-ghost"
            style={{ border: "1px solid var(--border)", borderRadius: "10px", width: "100%", justifyContent: "center", fontSize: "0.88rem" }}
            onClick={() => setShowResetConfirm(true)}
          >
            🔄 Reset to Shlok 1
          </button>
        </div>

        {/* ── WhatsApp Section ── */}
        <div className="card" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
            📲 WhatsApp Subscription
          </h3>

          {user.is_wa_subscribed ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.9rem 1rem", background: "rgba(34,197,94,0.08)", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.2)", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.3rem" }}>✅</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#15803d" }}>Subscribed</p>
                  <p style={{ fontSize: "0.8rem", color: "#166534" }}>
                    Receiving daily at {DAILY_SEND_TIME} · {user.phone}
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ width: "100%", justifyContent: "center", fontSize: "0.88rem", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626" }}
                onClick={handleUnsubscribe}
                disabled={unsubscribing}
              >
                {unsubscribing ? "Unsubscribing…" : "Unsubscribe from WhatsApp"}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
                Subscribe to receive a Bhagavad Gita shlok every morning at {DAILY_SEND_TIME} on your WhatsApp.
              </p>
              {user.is_phone_verified && user.phone ? (
                <div style={{ marginBottom: "0.75rem", padding: "0.75rem 1rem", background: "rgba(255,107,0,0.06)", borderRadius: "10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Verified number: <strong>{user.phone}</strong>
                </div>
              ) : null}
              <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowOTP(true)}>
                Connect WhatsApp →
              </button>
            </div>
          )}
        </div>

        {/* ── Member Since ── */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {APP_NAME} member since {new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(26,8,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
          onClick={e => e.target === e.currentTarget && setShowResetConfirm(false)}
        >
          <div className="card animate-fade-scale" style={{ maxWidth: "360px", width: "100%", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔄</div>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Reset Progress?</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Your progress (Shlok {user.shlok_count} / {TOTAL_SHLOKS}) will be reset to Shlok 1.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-ghost" style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "10px" }} onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, background: "#dc2626", boxShadow: "none" }} onClick={handleReset} disabled={resetting}>
                {resetting ? "Resetting…" : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOTP && (
        <OTPModal
          currentShlokCount={user.shlok_count}
          onSuccess={(count) => {
            updateUser({ is_wa_subscribed: true, is_phone_verified: true, shlok_count: count });
            setShowOTP(false);
          }}
          onClose={() => setShowOTP(false)}
        />
      )}
    </div>
  );
};

export default Profile;
