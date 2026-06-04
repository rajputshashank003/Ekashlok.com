import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import { adminApi } from "../../utils/api_request/admin";
import { useUser } from "../../hooks/useUser";

interface Stats {
  total_users: number;
  wa_subscribers: number;
  msg_sent_today: number;      // shlok dispatches only
  wa_daily_count: number;      // ALL WA messages today
  wa_daily_limit: number;      // configured cap
  wa_daily_remaining: number;  // cap - count
}

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [maxMsg, setMaxMsg] = useState("200");
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getSettings()]).then(([s, set]) => {
      setStats(s);
      setMaxMsg(set.settings?.max_daily_wa_messages ?? "200");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await adminApi.updateSettings({ max_daily_wa_messages: maxMsg });
      toast.success("Settings saved ✅");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <div className="container-app" style={{ maxWidth: "900px", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)" }}>
            ⚙️ Admin Dashboard
          </h1>
          <Link to="/admin/users" className="btn-outline" style={{ padding: "0.5rem 1.1rem", fontSize: "0.88rem" }}>
            Manage Users →
          </Link>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Users", value: stats?.total_users ?? "—", emoji: "👥", color: "#FF6B00" },
            { label: "WA Subscribers", value: stats?.wa_subscribers ?? "—", emoji: "📱", color: "#128C7E" },
            { label: "Shloks Sent Today", value: stats?.msg_sent_today ?? "—", emoji: "📿", color: "#7C3AED" },
            { label: "WA Msgs Remaining", value: loading ? "—" : `${stats?.wa_daily_remaining ?? "—"} / ${stats?.wa_daily_limit ?? "—"}`, emoji: "📊", color: stats && stats.wa_daily_remaining < stats.wa_daily_limit * 0.2 ? "#DC2626" : "#059669" },
          ].map((s) => (
            <div
              key={s.label}
              className="card"
              style={{ padding: "1.5rem", textAlign: "center" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>{s.emoji}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>
                {loading ? "—" : s.value}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* WA Daily Usage Progress Bar */}
        {!loading && stats && (
          <div className="card" style={{ padding: "1.25rem 1.75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                📤 Daily WA Usage
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {stats.wa_daily_count} of {stats.wa_daily_limit} messages used today
              </span>
            </div>
            <div style={{ background: "var(--border)", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                borderRadius: "999px",
                width: `${Math.min(100, (stats.wa_daily_count / stats.wa_daily_limit) * 100)}%`,
                background: stats.wa_daily_count >= stats.wa_daily_limit
                  ? "#DC2626"
                  : stats.wa_daily_count >= stats.wa_daily_limit * 0.8
                  ? "#F59E0B"
                  : "var(--saffron)",
                transition: "width 0.4s ease",
              }} />
            </div>
            {stats.wa_daily_count >= stats.wa_daily_limit && (
              <p style={{ fontSize: "0.78rem", color: "#DC2626", marginTop: "0.5rem", fontWeight: 600 }}>
                ⚠️ Daily limit reached — no more WA messages will be sent today. Raise the limit below.
              </p>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="card" style={{ padding: "1.75rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "1.25rem", color: "var(--text-primary)" }}>
            ⚙️ Settings
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                Max Daily WhatsApp Messages
              </label>
              <input
                id="admin-max-msg"
                className="input"
                type="number"
                min={1}
                max={10000}
                value={maxMsg}
                onChange={e => setMaxMsg(e.target.value)}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                Limits the number of WA messages sent per day by the cron job
              </p>
            </div>
            <button className="btn-primary" onClick={saveSettings} disabled={savingSettings} style={{ whiteSpace: "nowrap" }}>
              {savingSettings ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
