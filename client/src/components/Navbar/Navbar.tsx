import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { APP_NAME } from "../../utils/constants";

interface NavbarProps {
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const { user, isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: transparent
          ? "rgba(255, 248, 240, 0.7)"
          : "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          textDecoration: "none",
          fontWeight: 800,
          fontSize: "1.1rem",
          color: "var(--bhagwa)",
          letterSpacing: "-0.01em",
        }}
      >
        <span style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: "1.4rem" }}>ॐ</span>
        {APP_NAME}
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link
          to="/shloks"
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.background = "rgba(255,107,0,0.08)";
            (e.target as HTMLElement).style.color = "var(--bhagwa)";
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.background = "transparent";
            (e.target as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          Browse Shloks
        </Link>

        {isAuthenticated && user ? (
          <>
            <Link to="/home" className="btn-ghost" style={{ fontSize: "0.88rem" }}>
              Today's Shlok
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => navigate("/profile")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(255,107,0,0.08)",
                  border: "1px solid var(--border)",
                  borderRadius: "99px",
                  padding: "0.3rem 0.75rem 0.3rem 0.3rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--grad-hero)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {user.name?.split(" ")[0]}
                </span>
              </button>
              <button onClick={logout} className="btn-ghost" style={{ fontSize: "0.8rem" }}>
                Logout
              </button>
            </div>
            {user.is_admin && (
              <Link to="/admin" className="badge badge-bhagwa" style={{ textDecoration: "none", fontSize: "0.75rem" }}>
                Admin
              </Link>
            )}
          </>
        ) : (
          <button className="btn-primary" style={{ padding: "0.5rem 1.2rem", fontSize: "0.9rem" }} onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
