import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import { adminApi } from "../../utils/api_request/admin";
import { useUser } from "../../hooks/useUser";
import { SkeletonUsers } from "../../components/Skeleton/Skeleton";

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
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const AdminUsers: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
    return <Navigate to="/" replace />;
  }

  const fetchUsers = (p = page) => {
    setLoading(true);
    adminApi.getUsers(p).then((d) => {
      setUsers(d.users || []);
      setPagination(d.pagination || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const toggleAdmin = async (userId: number) => {
    setTogglingId(userId);
    try {
      const res = await adminApi.toggleAdmin(userId);
      toast.success(`Admin status ${res.is_admin ? "granted" : "revoked"}`);
      fetchUsers(page);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <div className="container-app" style={{ maxWidth: "1000px", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <Link to="/admin" style={{ color: "var(--bhagwa)", fontSize: "0.85rem", textDecoration: "none" }}>← Dashboard</Link>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              Users {pagination ? `(${pagination.total})` : ""}
            </h1>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          {loading ? (
            <SkeletonUsers />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "rgba(255,107,0,0.04)", borderBottom: "1px solid var(--border)" }}>
                    {["User", "Email", "Shlok", "WhatsApp", "Admin", "Actions"].map(h => (
                      <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: i < users.length - 1 ? "1px solid rgba(255,107,0,0.08)" : "none",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--grad-hero)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                              {u.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{u.name || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.9rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>{u.email}</td>
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <span className="badge badge-bhagwa" style={{ fontSize: "0.75rem" }}>{u.shlok_count}</span>
                      </td>
                      <td style={{ padding: "0.9rem 1rem" }}>
                        {u.is_wa_subscribed ? (
                          <span className="badge badge-green" style={{ fontSize: "0.72rem" }}>✅ {u.phone}</span>
                        ) : (
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0.9rem 1rem" }}>
                        {u.is_admin ? (
                          <span className="badge badge-bhagwa" style={{ fontSize: "0.72rem" }}>Admin</span>
                        ) : (
                          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>User</span>
                        )}
                      </td>
                      <td style={{ padding: "0.9rem 1rem" }}>
                        {u.id !== user?.id && (
                          <button
                            className="btn-ghost"
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem", border: "1px solid var(--border)", borderRadius: "8px" }}
                            onClick={() => toggleAdmin(u.id)}
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

export default AdminUsers;
