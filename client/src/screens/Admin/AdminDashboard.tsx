import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import { adminApi } from "../../utils/api_request/admin";
import { useUser } from "../../hooks/useUser";
import { SkeletonBase } from "../../components/Skeleton/Skeleton";
import { useMaintenance } from "../../context/MaintenanceContext";

interface Stats {
  total_users: number;
  wa_subscribers: number;
  msg_sent_today: number;
  wa_daily_count: number;
  wa_daily_limit: number;
  wa_daily_remaining: number;
}

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const { refresh: refreshMaintenance } = useMaintenance();
  const [stats, setStats] = useState<Stats | null>(null);

  // WhatsApp settings
  const [maxMsg, setMaxMsg] = useState("50");
  const [otpMaint, setOtpMaint] = useState(false);
  const [dispatchMaint, setDispatchMaint] = useState(false);
  const [savingWASettings, setSavingWASettings] = useState(false);

  // Email settings
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [fromEmail, setFromEmail] = useState("shlok@ekashlok.com");
  const [adminNotifyEmail, setAdminNotifyEmail] = useState("rajputshashank003@gmail.com");
  const [emailDay, setEmailDay] = useState("monday");
  const [emailTime, setEmailTime] = useState("06:00");
  const [userLimit, setUserLimit] = useState("ALL");
  const [batchSize, setBatchSize] = useState("10");
  const [batchDelay, setBatchDelay] = useState("2");
  const [emailShlokCount, setEmailShlokCount] = useState("1");
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);

  const [loading, setLoading] = useState(true);

  if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getSettings()])
      .then(([s, set]) => {
        setStats(s);
        const cfg = set.settings ?? {};

        // WA
        setMaxMsg(cfg.max_daily_wa_messages ?? "50");
        setOtpMaint(cfg.otp_maintenance === "true");
        setDispatchMaint(cfg.dispatch_maintenance === "true");

        // Email
        setEmailEnabled(cfg.email_shlok_enabled !== "false");
        setFromEmail(cfg.resend_from_email || "shlok@ekashlok.com");
        setAdminNotifyEmail(cfg.admin_notification_email || "rajputshashank003@gmail.com");
        setEmailDay(cfg.email_shlok_day || "monday");

        const rawTime = (cfg.email_shlok_time || "0600").trim();
        if (rawTime.length === 4 && !rawTime.includes(":")) {
          setEmailTime(`${rawTime.slice(0, 2)}:${rawTime.slice(2)}`);
        } else if (rawTime.includes(":")) {
          setEmailTime(rawTime);
        } else {
          setEmailTime("06:00");
        }

        setUserLimit(cfg.email_user_limit || "ALL");
        setBatchSize(cfg.email_batch_size || "10");
        setBatchDelay(cfg.email_batch_delay_seconds || "2");
        setEmailShlokCount(cfg.email_shlok_count || "1");

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveWASettings = async () => {
    setSavingWASettings(true);
    try {
      await adminApi.updateSettings({
        max_daily_wa_messages: maxMsg,
        otp_maintenance: otpMaint ? "true" : "false",
        dispatch_maintenance: dispatchMaint ? "true" : "false",
      });
      toast.success("WhatsApp settings saved ✅");
      refreshMaintenance();
    } catch {
      toast.error("Failed to save WhatsApp settings");
    } finally {
      setSavingWASettings(false);
    }
  };

  const saveEmailSettings = async () => {
    setSavingEmailSettings(true);
    try {
      const timeHHMM = emailTime.replace(":", "").trim();
      await adminApi.updateSettings({
        email_shlok_enabled: emailEnabled ? "true" : "false",
        resend_from_email: fromEmail.trim(),
        admin_notification_email: adminNotifyEmail.trim(),
        email_shlok_day: emailDay.toLowerCase().trim(),
        email_shlok_time: timeHHMM.length === 4 ? timeHHMM : "0600",
        email_user_limit: userLimit.trim().toUpperCase(),
        email_batch_size: batchSize.trim() || "10",
        email_batch_delay_seconds: batchDelay.trim() || "2",
        email_shlok_count: emailShlokCount.trim() || "1",
      });
      toast.success("Email settings saved ✅");
    } catch {
      toast.error("Failed to save email settings");
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const ToggleSwitch = ({
    id,
    checked,
    onChange,
    label,
    description,
    danger,
  }: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description: string;
    danger?: boolean;
  }) => (
    <div
      className={`admin-toggle-item ${checked ? (danger ? "is-danger-active" : "is-active") : ""}`}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.15rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
            {label}
          </span>
          {checked && (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: "4px",
                letterSpacing: "0.03em",
                background: danger ? "rgba(220,38,38,0.12)" : "rgba(255,107,0,0.12)",
                color: danger ? "#dc2626" : "var(--bhagwa)",
              }}
            >
              {danger ? "ACTIVE ⚠️" : "ENABLED"}
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.35 }}>
          {description}
        </div>
      </div>
      <button
        id={id}
        type="button"
        onClick={() => onChange(!checked)}
        className="admin-toggle-switch-btn"
        style={{
          background: checked ? (danger ? "#dc2626" : "var(--bhagwa)") : "rgba(255,107,0,0.18)",
        }}
        aria-checked={checked}
        role="switch"
      >
        <span className="admin-toggle-knob" />
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", overflowX: "hidden" }}>
      <Navbar />
      <div className="admin-dashboard-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <div className="admin-header-badge">
              <span className="admin-live-dot" />
              <span>Admin Console</span>
            </div>
            <h1 className="admin-header-title">⚙️ Admin Dashboard</h1>
            <p className="admin-header-desc">
              Manage system configurations, WhatsApp delivery engine, and scheduled email broadcasts.
            </p>
          </div>
          <div className="admin-actions-wrapper">
            <div className="admin-actions-grid">
              <Link to="/admin/users" className="admin-action-card">
                <div className="admin-action-card-info">
                  <div className="admin-action-card-icon">👥</div>
                  <div className="admin-action-card-text">
                    <div className="admin-action-card-title">Manage Users</div>
                    <div className="admin-action-card-sub">Directory & filters</div>
                  </div>
                </div>
                <span className="admin-action-card-arrow">→</span>
              </Link>
              <Link to="/admin/signup-attempts" className="admin-action-card">
                <div className="admin-action-card-info">
                  <div className="admin-action-card-icon" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
                    ❌
                  </div>
                  <div className="admin-action-card-text">
                    <div className="admin-action-card-title">Failures</div>
                    <div className="admin-action-card-sub">Signup audit log</div>
                  </div>
                </div>
                <span className="admin-action-card-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Bento Grid (2x2 on mobile, 4x1 on desktop) */}
        <div className="admin-stats-grid">
          {[
            {
              label: "Total Users",
              value: stats?.total_users ?? "—",
              emoji: "👥",
              color: "#FF6B00",
              bg: "rgba(255,107,0,0.08)",
            },
            {
              label: "WA Subscribers",
              value: stats?.wa_subscribers ?? "—",
              emoji: "📱",
              color: "#128C7E",
              bg: "rgba(18,140,126,0.08)",
            },
            {
              label: "Sent Today",
              value: stats?.msg_sent_today ?? "—",
              emoji: "📿",
              color: "#7C3AED",
              bg: "rgba(124,58,237,0.08)",
            },
            {
              label: "WA Daily Left",
              value: loading
                ? "—"
                : `${stats?.wa_daily_remaining ?? "—"} / ${stats?.wa_daily_limit ?? "—"}`,
              emoji: "📊",
              color:
                stats && stats.wa_daily_remaining < stats.wa_daily_limit * 0.2
                  ? "#DC2626"
                  : "#059669",
              bg:
                stats && stats.wa_daily_remaining < stats.wa_daily_limit * 0.2
                  ? "rgba(220,38,38,0.08)"
                  : "rgba(5,150,105,0.08)",
            },
          ].map((s) => (
            <div key={s.label} className="admin-stat-card">
              <div className="admin-stat-card-header">
                <div className="admin-stat-icon-pill" style={{ background: s.bg }}>
                  {s.emoji}
                </div>
              </div>
              <div className="admin-stat-value" style={{ color: s.color }}>
                {loading ? (
                  <SkeletonBase style={{ width: "70px", height: "24px", borderRadius: "6px" }} />
                ) : (
                  s.value
                )}
              </div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* WA Daily Usage Progress Bar */}
        {!loading && stats && (
          <div className="admin-quota-card">
            <div className="admin-quota-header">
              <div className="admin-quota-title">
                <span>📤</span>
                <span>Daily WhatsApp Quota</span>
              </div>
              <div className="admin-quota-badge">
                {stats.wa_daily_count} / {stats.wa_daily_limit} used ({Math.round(
                  Math.min(100, (stats.wa_daily_count / stats.wa_daily_limit) * 100)
                )}%)
              </div>
            </div>
            <div className="admin-quota-track">
              <div
                className="admin-quota-fill"
                style={{
                  width: `${Math.min(100, (stats.wa_daily_count / stats.wa_daily_limit) * 100)}%`,
                  background:
                    stats.wa_daily_count >= stats.wa_daily_limit
                      ? "#DC2626"
                      : stats.wa_daily_count >= stats.wa_daily_limit * 0.8
                      ? "#F59E0B"
                      : "var(--grad-hero)",
                }}
              />
            </div>
            {stats.wa_daily_count >= stats.wa_daily_limit && (
              <p style={{ fontSize: "0.74rem", color: "#DC2626", marginTop: "0.45rem", fontWeight: 700 }}>
                ⚠️ Daily quota reached — no more WA messages will dispatch today. Increase limit below.
              </p>
            )}
          </div>
        )}

        {/* ── WhatsApp Settings Card ── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-wrap">
              <h2 className="admin-card-title">
                <span>📱</span> WhatsApp Engine
              </h2>
              <p className="admin-card-subtitle">
                Dispatch thresholds, rate caps, and emergency maintenance toggles.
              </p>
            </div>
          </div>

          {/* Max messages */}
          <div style={{ marginBottom: "1rem" }}>
            <div className="admin-group-label">
              <span>⚙️ Delivery Capacity</span>
            </div>
            <div style={{ maxWidth: "340px" }}>
              <label className="admin-label">
                <span>Max Daily WA Messages</span>
                <span className="admin-label-unit">msgs / day</span>
              </label>
              <input
                id="admin-max-msg"
                className="admin-input-compact"
                type="number"
                min={1}
                max={10000}
                value={maxMsg}
                onChange={(e) => setMaxMsg(e.target.value)}
              />
              <div className="admin-hint">
                Total WA outbound dispatch limit across all subscribers.
              </div>
            </div>
          </div>

          {/* Maintenance toggles */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="admin-group-label">
              <span>🛡️ Maintenance & Failsafes</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <ToggleSwitch
                id="toggle-otp-maintenance"
                checked={otpMaint}
                onChange={setOtpMaint}
                label="OTP Maintenance Mode"
                description="Blocks all WhatsApp OTP sends. Users see maintenance notice & attempts are logged."
                danger
              />
              <ToggleSwitch
                id="toggle-dispatch-maintenance"
                checked={dispatchMaint}
                onChange={setDispatchMaint}
                label="Pause Daily WA Dispatch"
                description="Stops morning cron from sending shloks. Shlok sequences will NOT advance."
                danger
              />
            </div>
          </div>

          <button
            className="btn-primary admin-btn-save"
            onClick={saveWASettings}
            disabled={savingWASettings}
          >
            {savingWASettings ? "Saving WhatsApp Settings…" : "Save WhatsApp Settings"}
          </button>
        </div>

        {/* ── Email Settings Card (Redesigned Grid Format) ── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title-wrap">
              <h2 className="admin-card-title">
                <span>✉️</span> Email Broadcast Engine
              </h2>
              <p className="admin-card-subtitle">
                Automated Gita shlok broadcasts, audience limits, and rate throttling.
              </p>
            </div>
            <Link
              to="/template/email"
              target="_blank"
              className="admin-preview-btn"
            >
              Preview Template ↗
            </Link>
          </div>

          {/* Master Switch Status Banner */}
          <div className={`admin-master-switch ${emailEnabled ? "is-active" : ""}`}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="admin-master-switch-title">
                <span>🔔</span>
                <span>Scheduled Broadcast</span>
                <span className={`admin-status-pill ${emailEnabled ? "is-active" : "is-paused"}`}>
                  {emailEnabled ? "● ACTIVE" : "○ PAUSED"}
                </span>
              </div>
              <div className="admin-master-switch-desc">
                Subscribers receive their Gita shlok automatically according to the schedule below.
              </div>
            </div>
            <button
              id="toggle-email-broadcast"
              type="button"
              onClick={() => setEmailEnabled(!emailEnabled)}
              className="admin-toggle-switch-btn"
              style={{
                background: emailEnabled ? "var(--bhagwa)" : "rgba(255,107,0,0.18)",
              }}
              aria-checked={emailEnabled}
              role="switch"
            >
              <span className="admin-toggle-knob" />
            </button>
          </div>

          {/* Group 1: Sender Identity & Alerts */}
          <div className="admin-settings-section">
            <div className="admin-section-header">
              <div className="admin-section-icon">📨</div>
              <div>
                <div className="admin-section-title">Sender Identity & Alerts</div>
                <div className="admin-section-sub">Outbound sending address and milestone alert recipient</div>
              </div>
            </div>

            <div className="admin-form-stack">
              <div className="admin-field">
                <label className="admin-label">
                  <span>From Address</span>
                  <span className="admin-badge-verified">✓ Resend Verified</span>
                </label>
                <div className="admin-input-wrap">
                  <span className="admin-input-icon">✉️</span>
                  <input
                    className="admin-input-styled"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="shlok@ekashlok.com"
                  />
                </div>
                <div className="admin-hint">Sending domain for all automated Shlok broadcasts</div>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  <span>Admin Alert Email</span>
                  <span className="admin-label-unit">700th Milestone</span>
                </label>
                <input
                  className="admin-input-styled"
                  type="email"
                  value={adminNotifyEmail}
                  onChange={(e) => setAdminNotifyEmail(e.target.value)}
                  placeholder="admin@ekashlok.com"
                />
                <div className="admin-hint">Receives notification when any subscriber completes all 700 verses</div>
              </div>
            </div>
          </div>

          {/* Group 2: Schedule & Verse Pipeline */}
          <div className="admin-settings-section">
            <div className="admin-section-header">
              <div className="admin-section-icon">🗓️</div>
              <div>
                <div className="admin-section-title">Schedule & Verse Pipeline</div>
                <div className="admin-section-sub">Delivery frequency, dispatch timing, and audience target</div>
              </div>
            </div>

            <div className="admin-grid-responsive-2col">
              <div className="admin-field">
                <label className="admin-label">
                  <span>Frequency</span>
                  <span className="admin-label-unit">Cadence</span>
                </label>
                <select
                  className="admin-input-styled admin-select-styled"
                  value={emailDay}
                  onChange={(e) => setEmailDay(e.target.value)}
                >
                  <option value="monday">📅 Every Monday</option>
                  <option value="tuesday">📅 Every Tuesday</option>
                  <option value="wednesday">📅 Every Wednesday</option>
                  <option value="thursday">📅 Every Thursday</option>
                  <option value="friday">📅 Every Friday</option>
                  <option value="saturday">📅 Every Saturday</option>
                  <option value="sunday">📅 Every Sunday</option>
                  <option value="daily">⚡ Daily Morning</option>
                </select>
                <div className="admin-hint">Weekly or daily broadcast</div>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  <span>Send Time (IST)</span>
                  <span className="admin-label-unit">24-hr</span>
                </label>
                <input
                  className="admin-input-styled"
                  type="time"
                  value={emailTime}
                  onChange={(e) => setEmailTime(e.target.value)}
                />
                <div className="admin-hint">Dispatch time in IST</div>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  <span>Current Shlok</span>
                  <span className="admin-label-unit">#1 – 700</span>
                </label>
                <input
                  className="admin-input-styled"
                  type="number"
                  min={1}
                  max={700}
                  value={emailShlokCount}
                  onChange={(e) => setEmailShlokCount(e.target.value)}
                />
                <div className="admin-hint">Next verse in pipeline</div>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  <span>Audience Target</span>
                  <span className="admin-label-unit">ALL / Limit</span>
                </label>
                <input
                  className="admin-input-styled"
                  type="text"
                  value={userLimit}
                  onChange={(e) => setUserLimit(e.target.value)}
                  placeholder="ALL or 100"
                />
                <div className="admin-hint">ALL users or cap limit</div>
              </div>
            </div>
          </div>

          {/* Group 3: Rate Limiting & Safety */}
          <div className="admin-settings-section">
            <div className="admin-section-header">
              <div className="admin-section-icon">⚡</div>
              <div>
                <div className="admin-section-title">Rate Limiting & Throttling</div>
                <div className="admin-section-sub">Batch sizes and delay intervals to prevent mailbox throttling</div>
              </div>
            </div>

            <div className="admin-grid-responsive-2col">
              <div className="admin-field">
                <label className="admin-label">
                  <span>Batch Size</span>
                  <span className="admin-label-unit">emails / batch</span>
                </label>
                <input
                  className="admin-input-styled"
                  type="number"
                  min={1}
                  max={50}
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                />
                <div className="admin-hint">Emails per batch (default: 10)</div>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  <span>Batch Pause Delay</span>
                  <span className="admin-label-unit">seconds</span>
                </label>
                <input
                  className="admin-input-styled"
                  type="number"
                  min={0}
                  max={60}
                  value={batchDelay}
                  onChange={(e) => setBatchDelay(e.target.value)}
                />
                <div className="admin-hint">Pause interval (default: 2s)</div>
              </div>
            </div>
          </div>

          <button
            className="btn-primary admin-btn-save"
            onClick={saveEmailSettings}
            disabled={savingEmailSettings}
          >
            {savingEmailSettings ? "Saving Email Settings…" : "Save Email Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
