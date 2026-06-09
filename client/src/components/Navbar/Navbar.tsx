import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { APP_NAME } from "../../utils/constants";
import OTPModal from "../OTPModal/OTPModal";
import { useMaintenance } from "../../context/MaintenanceContext";

interface NavbarProps {
    transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
    const { user, isAuthenticated, logout, updateUser } = useUser();
    const { dispatchMaintenance } = useMaintenance();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showOTP, setShowOTP] = useState(false);

    const handleLinkClick = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    const handleWhatsAppCTA = () => {
        setIsOpen(false);
        if (isAuthenticated) {
            setShowOTP(true);
        } else {
            navigate("/login");
        }
    };

    return (
        <>
            {/* ── Dispatch Maintenance Banner ────────────────────────────── */}
            {dispatchMaintenance && (
                <div
                    style={{
                        background: "linear-gradient(90deg, #92400e, #b45309)",
                        color: "#fef3c7",
                        textAlign: "center",
                        padding: "0.5rem 1rem",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        letterSpacing: "0.01em",
                        zIndex: 200,
                        position: "relative",
                    }}
                >
                    🔧 WhatsApp delivery is currently under maintenance — daily shloks are paused. We'll be back soon!
                </div>
            )}
            <nav
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    background: transparent
                        ? "rgba(255, 248, 240, 0.75)"
                        : "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    borderBottom: "1px solid var(--border)",
                    padding: "0 1.5rem",
                    height: "64px",
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
                        fontSize: "1.15rem",
                        color: "var(--bhagwa)",
                        letterSpacing: "-0.01em",
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Noto Serif Devanagari', serif",
                            fontSize: "2rem",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                            marginTop: '10px'
                        }}
                    >
                        ॐ
                    </span>
                    {APP_NAME}
                </Link>

                {/* Desktop Nav Links */}
                <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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

                    {/* WhatsApp USP in Desktop Menu */}
                    {isAuthenticated && user ? (
                        <>
                            {user.is_wa_subscribed ? (
                                <span className="badge badge-green" style={{ gap: "0.25rem", fontSize: "0.78rem" }}>
                                    <span>✅</span> WhatsApp Active
                                </span>
                            ) : (
                                <button
                                    className="btn-primary wa-pulse-btn"
                                    onClick={handleWhatsAppCTA}
                                    style={{
                                        padding: "0.4rem 1rem",
                                        fontSize: "0.82rem",
                                        borderRadius: "8px",
                                        boxShadow: "none",
                                    }}
                                >
                                    📲 Subscribe WhatsApp
                                </button>
                            )}

                            <Link to="/home" className="btn-ghost" style={{ fontSize: "0.88rem", fontWeight: 500 }}>
                                Today's Shlok
                            </Link>

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
                                        style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: "50%",
                                            background: "var(--grad-hero)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {user.name?.[0]?.toUpperCase() ?? "U"}
                                    </div>
                                )}
                                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                    {user.name?.split(" ")[0]}
                                </span>
                            </button>

                            {user.is_admin && (
                                <Link to="/admin" className="badge badge-bhagwa" style={{ textDecoration: "none", fontSize: "0.75rem" }}>
                                    Admin
                                </Link>
                            )}

                            <button onClick={logout} className="btn-ghost" style={{ fontSize: "0.85rem" }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn-outline"
                                onClick={handleWhatsAppCTA}
                                style={{
                                    padding: "0.4rem 1rem",
                                    fontSize: "0.85rem",
                                    borderRadius: "8px",
                                    borderWidth: "1px",
                                }}
                            >
                                📲 Get Daily WhatsApp
                            </button>
                            <button
                                className="btn-primary"
                                style={{ padding: "0.4rem 1.2rem", fontSize: "0.88rem", borderRadius: "8px" }}
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger Toggle */}
                <button
                    className={`hamburger-btn ${isOpen ? "active" : ""}`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <span className="hamburger-icon" />
                </button>
            </nav>

            {/* Mobile Drawer Overlay */}
            <div
                className={`nav-mobile-overlay ${isOpen ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Navigation Drawer */}
            <div className={`nav-mobile-drawer ${isOpen ? "active" : ""}`}>
                {/* Drawer Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--bhagwa)", fontSize: "1.1rem" }}>Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{ background: "transparent", border: "none", fontSize: "1.5rem", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1 }}
                    >
                        &times;
                    </button>
                </div>

                {/* User Profile Summary */}
                <div style={{ padding: "0.5rem 0" }}>
                    {isAuthenticated && user ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.name}
                                    style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        background: "var(--grad-hero)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "1.1rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {user.name?.[0]?.toUpperCase() ?? "U"}
                                </div>
                            )}
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{user.name}</h4>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                                Sign in to customize your Gita journey.
                            </p>
                            <button
                                className="btn-primary"
                                style={{ width: "100%", borderRadius: "10px", padding: "0.6rem 1rem", fontSize: "0.88rem" }}
                                onClick={() => handleLinkClick("/login")}
                            >
                                Login with Google
                            </button>
                        </div>
                    )}
                </div>

                {/* Drawer Links */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button
                        className="btn-ghost"
                        style={{ width: "100%", justifyContent: "flex-start", padding: "0.75rem 1rem", fontSize: "0.95rem" }}
                        onClick={() => handleLinkClick("/shloks")}
                    >
                        📖 Browse All Shloks
                    </button>

                    {isAuthenticated && user && (
                        <>
                            <button
                                className="btn-ghost"
                                style={{ width: "100%", justifyContent: "flex-start", padding: "0.75rem 1rem", fontSize: "0.95rem" }}
                                onClick={() => handleLinkClick("/home")}
                            >
                                🌅 Today's Shlok
                            </button>

                            <button
                                className="btn-ghost"
                                style={{ width: "100%", justifyContent: "flex-start", padding: "0.75rem 1rem", fontSize: "0.95rem" }}
                                onClick={() => handleLinkClick("/profile")}
                            >
                                👤 My Profile
                            </button>

                            {user.is_admin && (
                                <button
                                    className="btn-ghost"
                                    style={{ width: "100%", justifyContent: "flex-start", padding: "0.75rem 1rem", fontSize: "0.95rem", color: "var(--bhagwa)" }}
                                    onClick={() => handleLinkClick("/admin")}
                                >
                                    ⚙️ Admin Dashboard
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* WhatsApp USP Prominent Placement inside Drawer */}
                <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                    {isAuthenticated && user && user.is_wa_subscribed ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 1rem",
                                background: "rgba(34,197,94,0.08)",
                                borderRadius: "10px",
                                border: "1px solid rgba(34,197,94,0.2)",
                            }}
                        >
                            <span style={{ fontSize: "1.2rem" }}>✅</span>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#15803d" }}>WhatsApp Active</p>
                                <p style={{ fontSize: "0.72rem", color: "#166534" }}>Receiving daily shloks</p>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="btn-primary wa-pulse-btn"
                            onClick={handleWhatsAppCTA}
                            style={{
                                width: "100%",
                                padding: "0.8rem 1rem",
                                borderRadius: "12px",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                            }}
                        >
                            <span>📲</span> Subscribe to WhatsApp
                        </button>
                    )}
                </div>

                {/* Logout at bottom */}
                {isAuthenticated && user && (
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            logout();
                        }}
                        className="btn-ghost"
                        style={{ justifyContent: "center", fontSize: "0.85rem", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)", borderRadius: "10px", marginTop: "1rem" }}
                    >
                        Logout
                    </button>
                )}
            </div>

            {/* OTP Subscription Modal */}
            {showOTP && user && (
                <OTPModal
                    currentShlokCount={user.shlok_count}
                    onSuccess={(count) => {
                        updateUser({ is_wa_subscribed: true, is_phone_verified: true, shlok_count: count });
                        setShowOTP(false);
                    }}
                    onClose={() => setShowOTP(false)}
                />
            )}
        </>
    );
};

export default Navbar;
