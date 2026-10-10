import React, { useEffect, useState, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { adminApi, SignupFilters } from "../../utils/api_request/admin";
import { useUser } from "../../hooks/useUser";
import { SkeletonUsers } from "../../components/Skeleton/Skeleton";
import {
  SignupFilterBar,
  SignupFilterState,
  defaultSignupFilter,
} from "../../components/AdminFilters/AdminFilters";

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
  stage: string;        // "send_otp" | "verify_otp" | "subscribe"
  fail_reason: string;  // "maintenance" | "twilio_error" | "invalid_phone" | ...
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
  maintenance:        { label: "Maintenance",    bg: "rgba(180,83,9,0.1)",    color: "#92400e" },
  twilio_error:       { label: "Twilio Error",   bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  invalid_phone:      { label: "Invalid Phone",  bg: "rgba(107,114,128,0.1)", color: "#374151" },
  invalid_otp:        { label: "Invalid OTP",    bg: "rgba(99,102,241,0.1)",  color: "#4338ca" },
  phone_not_verified: { label: "Not Verified",   bg: "rgba(245,158,11,0.1)",  color: "#92400e" },
  db_error:           { label: "DB Error",       bg: "rgba(220,38,38,0.1)",   color: "#dc2626" },
  invalid_choice:     { label: "Invalid Choice", bg: "rgba(107,114,128,0.1)", color: "#374151" },
};

const STAGE_LABEL: Record<string, string> = {
  send_otp:   "1. Send OTP",
  verify_otp: "2. Verify OTP",
  subscribe:  "3. Subscribe",
};

function buildFilters(f: SignupFilterState): SignupFilters {
  const out: SignupFilters = {};
  if (f.dateRange.from) out.created_from = f.dateRange.from;
  if (f.dateRange.to)   out.created_to   = f.dateRange.to;
  return out;
}

const AdminSignupAttempts: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const [attempts, setAttempts]     = useState<Attempt[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState<SignupFilterState>(defaultSignupFilter());
  const [isMobile, setIsMobile]     = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
    return <Navigate to="/" replace />;
  }

  const fetchAttempts = useCallback((p: number, f: SignupFilterState) => {
    setLoading(true);
    adminApi.getSignupAttempts(p, 20, buildFilters(f)).then((d) => {
      setAttempts(d.attempts || []);
      setPagination(d.pagination || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAttempts(page, filters); }, [page, filters]);

  const handleFilterChange = (f: SignupFilterState) => {
    setFilters(f);
    setPage(1);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const hasFilter = !!(filters.dateRange.from || filters.dateRange.to);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <div
        className="container-app"
        style={{
          maxWidth: "1100px",
          padding: isMobile ? "1.25rem 1rem 2rem" : "2rem 1.5rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <Link to="/admin" style={{ color: "var(--bhagwa)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 }}>
              ← Dashboard
            </Link>
            <h1 style={{ fontSize: isMobile ? "1.35rem" : "1.6rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              ❌ WA Signup Failures {pagination ? `(${pagination.total})` : ""}
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              All failed WhatsApp OTP &amp; subscription attempts
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: isMobile ? "0.6rem 0.75rem" : "0.75rem 1rem",
            marginBottom: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <SignupFilterBar value={filters} onChange={handleFilterChange} />
        </div>

        {/* Content */}
        {loading ? (
          <div className="card" style={{ padding: "1rem" }}>
            <SkeletonUsers />
          </div>
        ) : attempts.length === 0 ? (
          <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{hasFilter ? "🔍" : "✅"}</div>
            <p style={{ fontWeight: 600 }}>
              {hasFilter ? "No failures match the current filters" : "No failures logged yet"}
            </p>
            {hasFilter && (
              <button
                style={{ marginTop: "0.75rem", padding: "0.45rem 1.1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--bhagwa)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                onClick={() => handleFilterChange(defaultSignupFilter())}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : isMobile ? (
          /* Mobile Failure Cards */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {attempts.map(a => {
              const reasonStyle = REASON_STYLES[a.fail_reason] ?? { label: a.fail_reason, bg: "rgba(107,114,128,0.1)", color: "#374151" };
              return (
                <div
                  key={a.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    padding: "1rem",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                  }}
                >
                  {/* Row 1: User & Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0, flex: 1 }}>
                      {a.user ? (
                        <>
                          {a.user.avatar_url ? (
                            <img src={a.user.avatar_url} alt={a.user.name} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--grad-hero)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
                              {a.user.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.user.name || "—"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.user.email}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                          User #{a.user_id}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        background: reasonStyle.bg,
                        color: reasonStyle.color,
                        flexShrink: 0,
                      }}
                    >
                      {reasonStyle.label}
                    </span>
                  </div>

                  {/* Row 2: Phone & Stage */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", fontFamily: "monospace", fontWeight: 600, color: "var(--text-secondary)", background: "rgba(0,0,0,0.04)", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                      📱 {a.phone || "—"}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", background: "rgba(255,107,0,0.08)", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                      {STAGE_LABEL[a.stage] ?? a.stage}
                    </span>
                  </div>

                  {/* Row 3: Error detail */}
                  {a.error_detail && (
                    <div style={{ fontSize: "0.75rem", color: "#dc2626", background: "rgba(220,38,38,0.05)", padding: "0.45rem 0.65rem", borderRadius: "8px", wordBreak: "break-word" }}>
                      {a.error_detail}
                    </div>
                  )}

                  {/* Row 4: Time */}
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right", paddingTop: "0.3rem", borderTop: "1px dashed var(--border)" }}>
                    🕒 {fmt(a.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop Table */
          <div className="card" style={{ overflow: "hidden", background: "#FFFFFF" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "rgba(255,107,0,0.04)", borderBottom: "1px solid var(--border)" }}>
                    {["User", "Phone", "Stage", "Reason", "Error Detail", "Time"].map(h => (
                      <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
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
                                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{a.user.name || "—"}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{a.user.email}</div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>User #{a.user_id}</span>
                          )}
                        </td>

                        {/* Phone */}
                        <td style={{ padding: "0.9rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                          {a.phone || "—"}
                        </td>

                        {/* Stage */}
                        <td style={{ padding: "0.9rem 1rem", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                            {STAGE_LABEL[a.stage] ?? a.stage}
                          </span>
                        </td>

                        {/* Reason badge */}
                        <td style={{ padding: "0.9rem 1rem", whiteSpace: "nowrap" }}>
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
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "1.25rem 1rem", marginTop: "0.75rem" }}>
            <button className="btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ border: "1px solid var(--border)", borderRadius: "8px", background: "#FFFFFF" }}>← Prev</button>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button className="btn-ghost" onClick={() => setPage(p => Math.min(pagination!.total_pages, p + 1))} disabled={page >= pagination.total_pages} style={{ border: "1px solid var(--border)", borderRadius: "8px", background: "#FFFFFF" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSignupAttempts;
