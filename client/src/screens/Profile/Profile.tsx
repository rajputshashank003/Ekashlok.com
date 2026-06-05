import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import OTPModal from "../../components/OTPModal/OTPModal";
import { shlokApi } from "../../utils/api_request/shlok";
import { waApi } from "../../utils/api_request/whatsapp";
import { useUser } from "../../hooks/useUser";
import { TOTAL_SHLOKS, DAILY_SEND_TIME, APP_NAME } from "../../utils/constants";

type ResetModal = "closed" | "confirm_reset" | "custom";

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateUser, logout } = useUser();
  const [showOTP, setShowOTP] = useState(false);
  const [resetModal, setResetModal] = useState<ResetModal>("closed");
  const [saving, setSaving] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [unsubscribing, setUnsubscribing] = useState(false);

  if (!isLoading && !isAuthenticated) return <Navigate to="/" replace />;
  if (!user) return null;

  const progressPct = Math.round(((user.shlok_count || 0) / TOTAL_SHLOKS) * 100);

  /** Reset to beginning: sets count to 0 → tomorrow will deliver shlok #1 */
  const handleReset = async () => {
    setSaving(true);
    try {
      await shlokApi.resetShlokCount();
      toast.success("Progress reset — Shlok #1 coming tomorrow morning 🌱");
      updateUser({ shlok_count: 0 });
      setResetModal("closed");
    } finally {
      setSaving(false);
    }
  };

  /** Set to a specific shlok number */
  const handleSetCustom = async () => {
    const n = parseInt(customInput, 10);
    if (!n || n < 1 || n > TOTAL_SHLOKS) {
      toast.error(`Please enter a number between 1 and ${TOTAL_SHLOKS}`);
      return;
    }
    setSaving(true);
    try {
      await shlokApi.setShlokCount(n);
      toast.success(`Progress set to Shlok #${n} 📖`);
      updateUser({ shlok_count: n });
      setCustomInput("");
      setResetModal("closed");
    } finally {
      setSaving(false);
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

        {/* ── Shlok Progress + Settings Card ── */}
        <div className="card" style={{ padding: "1.75rem", marginBottom: "1.25rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.35rem", color: "var(--text-primary)" }}>
            📖 Reading Progress
          </h3>

          {/* Explainer note */}
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
            This number tracks how many shloks you've <strong>completed or read</strong>.
            Each morning you receive the <em>next</em> shlok in the sequence.
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Completed</span>
            <span className="badge badge-bhagwa">{user.shlok_count || 0} / {TOTAL_SHLOKS}</span>
          </div>
          <div className="progress-track" style={{ marginBottom: "0.5rem" }}>
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            {progressPct}% of Bhagavad Gita completed
          </p>

          {/* Two action buttons */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn-ghost"
              style={{ flex: 1, minWidth: "140px", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "0.88rem", color: "#dc2626", justifyContent: "center" }}
              onClick={() => setResetModal("confirm_reset")}
            >
              🔄 Reset to Beginning
            </button>
            <button
              className="btn-ghost"
              style={{ flex: 1, minWidth: "140px", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "0.88rem", justifyContent: "center" }}
              onClick={() => { setCustomInput(String(user.shlok_count || 0)); setResetModal("custom"); }}
            >
              ✏️ Jump to Shlok
            </button>
          </div>
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

      {/* ── Reset to Beginning Modal ── */}
      {resetModal === "confirm_reset" && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(26,8,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
          onClick={e => e.target === e.currentTarget && setResetModal("closed")}
        >
          <div className="card animate-fade-scale" style={{ maxWidth: "380px", width: "100%", padding: "2rem" }}>
            <div style={{ fontSize: "2.5rem", textAlign: "center", marginBottom: "0.75rem" }}>🔄</div>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", textAlign: "center" }}>Reset to Beginning?</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "0.75rem", lineHeight: 1.7, textAlign: "center" }}>
              Your completed count ({user.shlok_count || 0} shloks) will be cleared.
              Tomorrow morning you'll receive <strong>Shlok #1</strong> — the very first verse of the Bhagavad Gita.
            </p>
            <div style={{ background: "rgba(255,107,0,0.07)", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              💡 <strong>Note:</strong> Your shlok number = the number of shloks you've <em>completed</em>, not the one you'll receive next.
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-ghost" style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "10px" }} onClick={() => setResetModal("closed")}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, background: "#dc2626", boxShadow: "none" }} onClick={handleReset} disabled={saving}>
                {saving ? "Resetting…" : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Jump to Custom Shlok Modal ── */}
      {resetModal === "custom" && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(26,8,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
          onClick={e => e.target === e.currentTarget && setResetModal("closed")}
        >
          <div className="card animate-fade-scale" style={{ maxWidth: "380px", width: "100%", padding: "2rem" }}>
            <div style={{ fontSize: "2.5rem", textAlign: "center", marginBottom: "0.75rem" }}>✏️</div>
            <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", textAlign: "center" }}>Jump to a Shlok</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1rem", textAlign: "center", lineHeight: 1.6 }}>
              Enter the shlok number you've <strong>already read</strong>.
              Tomorrow you'll receive the <em>next</em> one in sequence.
            </p>
            <div style={{ background: "rgba(255,107,0,0.07)", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              💡 Example: enter <strong>50</strong> if you've already read the first 50 shloks — tomorrow you'll get Shlok #51.
            </div>
            <input
              type="number"
              min={1}
              max={TOTAL_SHLOKS}
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder={`1 – ${TOTAL_SHLOKS}`}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.75rem 1rem", borderRadius: "10px",
                border: "1.5px solid var(--border)", fontSize: "1rem",
                background: "var(--cream)", color: "var(--text-primary)",
                marginBottom: "1.25rem", outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--bhagwa)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
              onKeyDown={e => e.key === "Enter" && handleSetCustom()}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-ghost" style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "10px" }} onClick={() => setResetModal("closed")}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, boxShadow: "none" }} onClick={handleSetCustom} disabled={saving}>
                {saving ? "Saving…" : "Set Progress"}
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
