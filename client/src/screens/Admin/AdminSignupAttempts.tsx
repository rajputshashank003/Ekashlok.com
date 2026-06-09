import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { adminApi } from "../../utils/api_request/admin";
import { useUser } from "../../hooks/useUser";
import { SkeletonUsers } from "../../components/Skeleton/Skeleton";

interface Attempt {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url: string;
  } | null;
  phone: string;
  stage: string;       // "send_otp" | "verify_otp" | "subscribe"
  fail_reason: string; // "maintenance" | "twilio_error" | "invalid_phone" | "invalid_otp" | "phone_not_verified" | "db_error" | "invalid_choice"
  error_detail: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const REASON_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  maintenance:       { label: "Maintenance",      bg: "rgba(180,83,9,0.1)",   color: "#92400e" },
  twilio_error:      { label: "Twilio Error",     bg: "rgba(220,38,38,0.1)",  color: "#dc2626" },
  invalid_phone:     { label: "Invalid Phone",    bg: "rgba(107,114,128,0.1)", color: "#374151" },
  invalid_otp:       { label: "Invalid OTP",      bg: "rgba(99,102,241,0.1)", color: "#4338ca" },
  phone_not_verified:{ label: "Not Verified",     bg: "rgba(245,158,11,0.1)", color: "#92400e" },
  db_error:          { label: "DB Error",         bg: "rgba(220,38,38,0.1)",  color: "#dc2626" },
  invalid_choice:    { label: "Invalid Choice",   bg: "rgba(107,114,128,0.1)", color: "#374151" },
};

const STAGE_LABEL: Record<string, string> = {
  send_otp:   "1. Send OTP",
  verify_otp: "2. Verify OTP",
  subscribe:  "3. Subscribe",
};

const AdminSignupAttempts: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
    return <Navigate to="/" replace />;
  }

  const fetchAttempts = (p = page) => {
    setLoading(true);
    adminApi.getSignupAttempts(p).then((d) => {
      setAttempts(d.attempts || []);
      setPagination(d.pagination || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAttempts(page); }, [page]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <div className="container-app" style={{ maxWidth: "1100px", padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <Link to="/admin" style={{ color: "var(--bhagwa)", fontSize: "0.85rem", textDecoration: "none" }}>
              ← Dashboard
            </Link>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              ❌ WA Signup Failures {pagination ? `(${pagination.total})` : ""}
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              All failed WhatsApp OTP & subscription attempts
            </p>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          {loading ? (
            <SkeletonUsers />
          ) : attempts.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
              <p style={{ fontWeight: 600 }}>No failures logged yet</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "rgba(255,107,0,0.04)", borderBottom: "1px solid var(--border)" }}>
                    {["User", "Phone", "Stage", "Reason", "Error Detail", "Time"].map(h => (
                      <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a, i) => {
                    const reasonStyle = REASON_STYLES[a.fail_reason] ?? { label: a.fail_reason, bg: "rgba(107,114,128,0.1)", color: "#374151" };
                    return (
                      <tr
                        key={a.id}
                        style={{
                          borderBottom: i < attempts.length - 1 ? "1px solid rgba(255,107,0,0.08)" : "none",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* User */}
                        <td style={{ padding: "0.9rem 1rem" }}>
                          {a.user ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              {a.user.avatar_url ? (
                                <img src={a.user.avatar_url} alt={a.user.name} style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--grad-hero)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.75rem", fontWeight: 700 }}>
                                  {a.user.name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{a.user.name || "—"}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{a.user.email}</div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>User #{a.user_id}</span>
                          )}
                        </td>
                        {/* Phone */}
                        <td style={{ padding: "0.9rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {a.phone || "—"}
                        </td>
                        {/* Stage */}
                        <td style={{ padding: "0.9rem 1rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                            {STAGE_LABEL[a.stage] ?? a.stage}
                          </span>
                        </td>
                        {/* Reason badge */}
                        <td style={{ padding: "0.9rem 1rem" }}>
                          <span style={{
                            display: "inline-block", padding: "0.2rem 0.6rem",
                            borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                            background: reasonStyle.bg, color: reasonStyle.color,
                          }}>
                            {reasonStyle.label}
                          </span>
                        </td>
                        {/* Error detail */}
                        <td style={{ padding: "0.9rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: "240px", wordBreak: "break-word" }}>
                          {a.error_detail || "—"}
                        </td>
                        {/* Time */}
                        <td style={{ padding: "0.9rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {fmt(a.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "1rem", borderTop: "1px solid var(--border)" }}>
              <button className="btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ border: "1px solid var(--border)", borderRadius: "8px" }}>←</button>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button className="btn-ghost" onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))} disabled={page >= pagination.total_pages} style={{ border: "1px solid var(--border)", borderRadius: "8px" }}>→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSignupAttempts;
