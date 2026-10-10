import React, { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import { adminApi, UserFilters } from "../../utils/api_request/admin";
import { useUser } from "../../hooks/useUser";
import { SkeletonUsers } from "../../components/Skeleton/Skeleton";
import {
  UsersFilterBar,
  UsersFilterState,
  defaultUsersFilter,
} from "../../components/AdminFilters/AdminFilters";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
  is_admin: boolean;
  is_wa_subscribed: boolean;
  is_phone_verified: boolean;
  phone: string;
  shlok_count: number;
  logged_count: number;
  email_unsubscribed: boolean;
  last_active_at: string | null;
  last_shlok_advanced: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/** Build API filter params from filter state */
function buildFilters(f: UsersFilterState): UserFilters {
  const out: UserFilters = {};
  const sc = f.shlokCount;
  if (sc.mode === "gte" && sc.min) out.shlok_count_gte = sc.min;
  if (sc.mode === "lte" && sc.max) out.shlok_count_lte = sc.max;
  if (sc.mode === "between") {
    if (sc.min) out.shlok_count_gte = sc.min;
    if (sc.max) out.shlok_count_lte = sc.max;
  }

  const lc = f.loggedCount;
  if (lc.mode === "gte" && lc.min) out.logged_count_gte = lc.min;
  if (lc.mode === "lte" && lc.max) out.logged_count_lte = lc.max;
  if (lc.mode === "between") {
    if (lc.min) out.logged_count_gte = lc.min;
    if (lc.max) out.logged_count_lte = lc.max;
  }

  if (f.emailStatus !== "all") {
    out.email_status = f.emailStatus;
  }

  if (f.lastLogin.from) out.last_login_from = f.lastLogin.from;
  if (f.lastLogin.to)   out.last_login_to   = f.lastLogin.to;
  if (f.signedUp.from)  out.created_from    = f.signedUp.from;
  if (f.signedUp.to)    out.created_to      = f.signedUp.to;
  return out;
}

/** Count how many filter "groups" are active */
function countActiveFilters(f: UsersFilterState): number {
  let n = 0;
  if (f.shlokCount.mode !== "any") n++;
  if (f.loggedCount.mode !== "any") n++;
  if (f.emailStatus !== "all") n++;
  if (f.lastLogin.from || f.lastLogin.to) n++;
  if (f.signedUp.from  || f.signedUp.to)  n++;
  return n;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const fmtFullDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

interface UserDetailsModalProps {
  user: AdminUser | null;
  onClose: () => void;
  isMobile: boolean;
  onToggleAdmin: (id: number) => void;
  togglingId: number | null;
  currentUserId?: number;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user: initialUser,
  onClose,
  isMobile,
  onToggleAdmin,
  togglingId,
  currentUserId,
}) => {
  const [user, setUser] = useState<AdminUser | null>(initialUser);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialUser) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setUser(initialUser);
      setIsClosing(false);
    }
  }, [initialUser]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const triggerClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setUser(null);
      setIsClosing(false);
      onClose();
    }, 260);
  }, [isClosing, onClose]);

  // Escape key closes
  useEffect(() => {
    if (!user || isClosing) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") triggerClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [user, isClosing, triggerClose]);

  if (!user) return null;

  const copyEmail = () => {
    navigator.clipboard.writeText(user.email);
    toast.success("Email copied to clipboard!");
  };

  const copyPhone = () => {
    if (user.phone) {
      navigator.clipboard.writeText(user.phone);
      toast.success("Phone number copied!");
    }
  };

  const shlokPct = Math.min(100, Math.round(((user.shlok_count || 0) / 700) * 100));

  return createPortal(
    <div
      className={`premium-modal-backdrop ${isClosing ? "premium-modal-backdrop-exit" : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: isMobile ? "flex-end" : "center",
        alignItems: "center",
        padding: isMobile ? 0 : "1.5rem",
      }}
      onClick={triggerClose}
    >
      <div
        className={`${isMobile ? "premium-bottom-sheet" : "premium-desktop-modal"} ${
          isClosing ? (isMobile ? "premium-bottom-sheet-exit" : "premium-desktop-modal-exit") : ""
        }`}
        style={{
          width: "100%",
          maxWidth: isMobile ? "480px" : "540px",
          maxHeight: isMobile ? "88vh" : "90vh",
          background: "#FFFFFF",
          borderRadius: isMobile ? "24px 24px 0 0" : "20px",
          boxShadow: isMobile ? "0 -10px 40px rgba(0,0,0,0.25)" : "0 20px 60px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div
            style={{
              width: "36px",
              height: "4px",
              background: "#E4D5C5",
              borderRadius: "2px",
              margin: "0.75rem auto 0.25rem",
            }}
          />
        )}

        {/* Header */}
        <div
          style={{
            padding: isMobile ? "1rem 1.25rem 0.85rem" : "1.25rem 1.5rem 1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.85rem",
          }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,107,0,0.2)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--grad-hero)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.3rem",
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  wordBreak: "break-word",
                }}
              >
                {user.name || "Nameless User"}
              </h2>
              {user.is_admin ? (
                <span className="badge badge-bhagwa" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
                  Admin
                </span>
              ) : (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  Member
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.84rem",
                  color: "var(--text-secondary)",
                  wordBreak: "break-all",
                }}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={copyEmail}
                title="Copy Email"
                style={{
                  background: "rgba(255,107,0,0.08)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.2rem 0.45rem",
                  fontSize: "0.72rem",
                  color: "var(--bhagwa)",
                  cursor: "pointer",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerClose}
            aria-label="Close modal"
            title="Close modal"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "linear-gradient(145deg, #FFFDF8 0%, #FFF5EB 100%)",
              border: "1.5px solid rgba(255, 107, 0, 0.3)",
              color: "var(--bhagwa)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              boxShadow: "0 2px 6px rgba(255, 107, 0, 0.1)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: isMobile ? "1.1rem 1.25rem" : "1.25rem 1.5rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
          }}
        >
          {/* Section 1: Progress & Journey */}
          <div>
            <h4
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 0.55rem",
              }}
            >
              🕉️ Spiritual Progress & Consistency
            </h4>
            <div
              style={{
                background: "#FFFBF5",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "0.95rem 1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  📿 Shloks Completed
                </span>
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--bhagwa)" }}>
                  {user.shlok_count} / 700
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "#E5E7EB",
                  overflow: "hidden",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${shlokPct}%`,
                    background: "var(--grad-hero)",
                    borderRadius: "4px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  paddingTop: "0.6rem",
                  borderTop: "1px dashed var(--border)",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
                    Total Daily Logins
                  </span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    #{user.logged_count || 0} Days
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
                    Completion Rate
                  </span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--bhagwa)" }}>
                    {shlokPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Communication & Subscriptions */}
          <div>
            <h4
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 0.55rem",
              }}
            >
              📬 Communication Channels
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.6rem" }}>
              {/* Email Broadcast Card */}
              <div
                style={{
                  padding: "0.85rem 0.95rem",
                  borderRadius: "12px",
                  border: user.email_unsubscribed ? "1px solid #fecaca" : "1px solid rgba(34,197,94,0.25)",
                  background: user.email_unsubscribed ? "#fff5f5" : "rgba(34,197,94,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    ✉️ Email Broadcast
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "6px",
                      background: user.email_unsubscribed ? "#fee2e2" : "rgba(34,197,94,0.15)",
                      color: user.email_unsubscribed ? "#dc2626" : "#15803d",
                    }}
                  >
                    {user.email_unsubscribed ? "Opted Out 🚫" : "Subscribed ✅"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.35 }}>
                  {user.email_unsubscribed
                    ? "User unsubscribed from weekly/daily shlok emails."
                    : "Receives common scheduled broadcast to their email."}
                </p>
              </div>

              {/* WhatsApp Card */}
              <div
                style={{
                  padding: "0.85rem 0.95rem",
                  borderRadius: "12px",
                  border: user.is_wa_subscribed ? "1px solid rgba(34,197,94,0.25)" : "1px solid var(--border)",
                  background: user.is_wa_subscribed ? "rgba(34,197,94,0.05)" : "#F9F6F0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    📲 WhatsApp Delivery
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "6px",
                      background: user.is_wa_subscribed ? "rgba(34,197,94,0.15)" : "#E5E7EB",
                      color: user.is_wa_subscribed ? "#15803d" : "#6B7280",
                    }}
                  >
                    {user.is_wa_subscribed ? "Active ✅" : "Inactive"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {user.phone || "No phone linked"}
                  </span>
                  {user.phone && (
                    <button
                      type="button"
                      onClick={copyPhone}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "0.7rem",
                        color: "var(--bhagwa)",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Account Details & Timestamps */}
          <div>
            <h4
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 0.55rem",
              }}
            >
              ℹ️ Account Details & Timestamps
            </h4>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
                fontSize: "0.78rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>User ID:</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>#{user.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Joined (Registered):</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{fmtFullDate(user.created_at)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Last Activity / Login:</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {fmtFullDate(user.last_active_at || user.last_shlok_advanced)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)" }}>Phone Verification:</span>
                <span style={{ fontWeight: 700, color: user.is_phone_verified ? "#15803d" : "#6B7280" }}>
                  {user.is_phone_verified ? "Verified ✅" : "Unverified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "0.85rem 1.25rem 1.15rem",
            borderTop: "1px solid var(--border)",
            background: "#FFFBF5",
            display: "flex",
            gap: "0.6rem",
          }}
        >
          {user.id !== currentUserId && (
            <button
              type="button"
              onClick={() => onToggleAdmin(user.id)}
              disabled={togglingId === user.id}
              style={{
                padding: "0.7rem 1.1rem",
                borderRadius: "12px",
                border: user.is_admin ? "1px solid #fecaca" : "1.5px solid var(--bhagwa)",
                background: user.is_admin ? "#fff5f5" : "rgba(255,107,0,0.1)",
                color: user.is_admin ? "#dc2626" : "var(--bhagwa)",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {togglingId === user.id ? "Updating…" : user.is_admin ? "Revoke Admin Role" : "+ Make Admin"}
            </button>
          )}
          <button
            type="button"
            onClick={triggerClose}
            style={{
              flex: 1,
              padding: "0.7rem",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--bhagwa)",
              color: "#FFFFFF",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255,107,0,0.2)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const AdminUsers: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [filters, setFilters]       = useState<UsersFilterState>(defaultUsersFilter());
  const [isMobile, setIsMobile]     = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
    return <Navigate to="/" replace />;
  }

  const fetchUsers = useCallback((p: number, f: UsersFilterState) => {
    setLoading(true);
    setFetchError(false);
    adminApi.getUsers(p, 20, buildFilters(f)).then((d) => {
      setUsers(d.users || []);
      setPagination(d.pagination || null);
      setLoading(false);
    }).catch(() => {
      setFetchError(true);
      setUsers([]);
      setLoading(false);
    });
  }, []);

  // Re-fetch when page or filters change
  useEffect(() => { fetchUsers(page, filters); }, [page, filters]);

  // When filters change reset to page 1
  const handleFilterChange = (f: UsersFilterState) => {
    setFilters(f);
    setPage(1);
  };

  const toggleAdmin = async (userId: number) => {
    setTogglingId(userId);
    try {
      const res = await adminApi.toggleAdmin(userId);
      toast.success(`Admin status ${res.is_admin ? "granted" : "revoked"}`);
      setSelectedUser(prev => prev && prev.id === userId ? { ...prev, is_admin: res.is_admin } : prev);
      fetchUsers(page, filters);
    } finally {
      setTogglingId(null);
    }
  };

  const activeFilters = countActiveFilters(filters);

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <Link to="/admin" style={{ color: "var(--bhagwa)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 }}>
              ← Dashboard
            </Link>
            <h1 style={{ fontSize: isMobile ? "1.35rem" : "1.6rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              Users {pagination ? `(${pagination.total})` : ""}
            </h1>
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: isMobile ? "0.6rem 0.75rem" : "0.75rem 0.85rem",
            marginBottom: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            maxWidth: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <UsersFilterBar
            value={filters}
            onChange={handleFilterChange}
            activeCount={activeFilters}
          />
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="card" style={{ padding: "1rem" }}>
            <SkeletonUsers />
          </div>
        ) : fetchError ? (
          /* Error State */
          <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚠️</div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Failed to load users</p>
            <p style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>Check your connection or try again.</p>
            <button
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--bhagwa)",
                color: "white",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
              onClick={() => fetchUsers(page, filters)}
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          /* Empty State */
          <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
            <p style={{ fontWeight: 600 }}>No users match the current filters</p>
            {activeFilters > 0 && (
              <button
                style={{
                  marginTop: "0.75rem",
                  padding: "0.45rem 1.1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--bhagwa)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
                onClick={() => handleFilterChange(defaultUsersFilter())}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : isMobile ? (
          /* ─────────────────────────────────────────────────────────────
             Mobile User Cards List (Market App Inspiration: Stripe/Clerk)
             ───────────────────────────────────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "1rem 1.1rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Row 1: Avatar, Name, Email, Role & Action */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.name}
                        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "var(--grad-hero)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {u.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.name || "Nameless User"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.email}
                      </div>
                    </div>
                  </div>

                  {/* Role pill & Toggle action */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                    {u.is_admin ? (
                      <span className="badge badge-bhagwa" style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem" }}>
                        Admin
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        User
                      </span>
                    )}
                    {u.id !== user?.id && (
                      <button
                        className="btn-ghost"
                        style={{
                          fontSize: "0.72rem",
                          padding: "0.25rem 0.55rem",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          fontWeight: 600,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAdmin(u.id);
                        }}
                        disabled={togglingId === u.id}
                      >
                        {togglingId === u.id ? "…" : u.is_admin ? "Revoke" : "+Admin"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Stats Chips Grid (Auto-managing, uniform royal grid) */}
                <div className="user-card-chips-grid">
                  {/* Shlok Count */}
                  <div className="royal-chip royal-chip-shlok" title={`${u.shlok_count} Shloks Completed`}>
                    <span className="royal-chip-icon">📿</span>
                    <span className="royal-chip-text">{u.shlok_count} Shloks</span>
                  </div>

                  {/* Logins Count */}
                  <div className="royal-chip royal-chip-login" title={`Logged in #${u.logged_count || 0} times out of 700`}>
                    <span className="royal-chip-icon">🔢</span>
                    <span className="royal-chip-text">#{u.logged_count || 0} / 700</span>
                  </div>

                  {/* WhatsApp Delivery */}
                  {u.is_wa_subscribed && u.phone ? (
                    <div className="royal-chip royal-chip-wa-active" title={`WhatsApp: ${u.phone}`}>
                      <span className="royal-chip-icon">✅</span>
                      <span className="royal-chip-text">{u.phone}</span>
                    </div>
                  ) : (
                    <div className="royal-chip royal-chip-wa-inactive" title="No WhatsApp linked">
                      <span className="royal-chip-icon">📱</span>
                      <span className="royal-chip-text">No WA</span>
                    </div>
                  )}

                  {/* Email Broadcast */}
                  {u.email_unsubscribed ? (
                    <div className="royal-chip royal-chip-email-inactive" title="Email Broadcast: Unsubscribed">
                      <span className="royal-chip-icon">🚫</span>
                      <span className="royal-chip-text">Email Off</span>
                    </div>
                  ) : (
                    <div className="royal-chip royal-chip-email-active" title="Email Broadcast: Subscribed">
                      <span className="royal-chip-icon">📧</span>
                      <span className="royal-chip-text">Subscribed</span>
                    </div>
                  )}
                </div>

                {/* Row 3: Timestamps — Always 1 line, shrinks with screen */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "clamp(0.58rem, 2.65vw, 0.72rem)",
                    color: "var(--text-muted)",
                    paddingTop: "0.45rem",
                    borderTop: "1px dashed var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                    🕒 Login: {fmtDate(u.last_active_at || u.last_shlok_advanced)}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                    <span>📅 Joined: {fmtDate(u.created_at)}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--bhagwa)", fontWeight: 800 }}>›</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
             Desktop Data Table
             ───────────────────────────────────────────────────────────── */
          <div className="card" style={{ overflow: "hidden", background: "#FFFFFF" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
                <thead>
                  <tr style={{ background: "rgba(255,107,0,0.04)", borderBottom: "1px solid var(--border)" }}>
                    {["User", "Email", "Shlok", "Logins", "Email Status", "Last Login", "Joined", "WhatsApp", "Admin", "Actions"].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: "0.85rem 1rem",
                          textAlign: "left",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      style={{
                        borderBottom: i < users.length - 1 ? "1px solid rgba(255,107,0,0.08)" : "none",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* User */}
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--grad-hero)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                              {u.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                            {u.name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "0.9rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {u.email}
                      </td>

                      {/* Shlok count */}
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <span className="badge badge-bhagwa" style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {u.shlok_count}
                        </span>
                      </td>

                      {/* Logins count — STRICTLY ONE LINE */}
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: "0.75rem",
                            background: "rgba(255,107,0,0.1)",
                            color: "var(--bhagwa)",
                            whiteSpace: "nowrap",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          #{u.logged_count || 0} / 700
                        </span>
                      </td>

                      {/* Email Status */}
                      <td style={{ padding: "0.9rem 1rem" }}>
                        {u.email_unsubscribed ? (
                          <span className="badge" style={{ fontSize: "0.72rem", background: "#fee2e2", color: "#dc2626", whiteSpace: "nowrap" }}>
                            🚫 Unsubscribed
                          </span>
                        ) : (
                          <span className="badge badge-green" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                            ✅ Subscribed
                          </span>
                        )}
                      </td>

                      {/* Last login */}
                      <td style={{ padding: "0.9rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {fmtDate(u.last_active_at || u.last_shlok_advanced)}
                      </td>

                      {/* Joined */}
                      <td style={{ padding: "0.9rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {fmtDate(u.created_at)}
                      </td>

                      {/* WhatsApp — STRICTLY ONE LINE */}
                      <td style={{ padding: "0.9rem 1rem" }}>
                        {u.is_wa_subscribed ? (
                          <span
                            className="badge badge-green"
                            style={{
                              fontSize: "0.72rem",
                              whiteSpace: "nowrap",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <span>✅</span>
                            <span>{u.phone}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>—</span>
                        )}
                      </td>

                      {/* Admin badge */}
                      <td style={{ padding: "0.9rem 1rem" }}>
                        {u.is_admin ? (
                          <span className="badge badge-bhagwa" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                            Admin
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            User
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.9rem 1rem" }}>
                        {u.id !== user?.id && (
                          <button
                            className="btn-ghost"
                            style={{
                              fontSize: "0.78rem",
                              padding: "0.3rem 0.7rem",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              whiteSpace: "nowrap",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAdmin(u.id);
                            }}
                            disabled={togglingId === u.id}
                          >
                            {togglingId === u.id ? "…" : u.is_admin ? "Revoke Admin" : "Make Admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1.25rem 1rem",
              marginTop: "0.75rem",
            }}
          >
            <button
              className="btn-ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.4rem 0.8rem",
                background: "#FFFFFF",
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              className="btn-ghost"
              onClick={() => setPage(p => Math.min(pagination!.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.4rem 0.8rem",
                background: "#FFFFFF",
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* User Details Modal (Mobile Bottom Sheet & Desktop Dialog) */}
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          isMobile={isMobile}
          onToggleAdmin={toggleAdmin}
          togglingId={togglingId}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
