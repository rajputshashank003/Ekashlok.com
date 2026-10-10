import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { APP_NAME } from "../../utils/constants";
import OTPModal from "../OTPModal/OTPModal";
import { useMaintenance } from "../../context/MaintenanceContext";

interface NavbarProps {
    transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
    const { user, isAuthenticated, logout, updateUser, currentStreak } = useUser();
    const { dispatchMaintenance } = useMaintenance();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showOTP, setShowOTP] = useState(false);

    const navRef = useRef<HTMLElement>(null);
    const [navTop, setNavTop] = useState(0);

    const updateNavTop = useCallback(() => {
        if (navRef.current) {
            const rect = navRef.current.getBoundingClientRect();
            setNavTop(Math.max(0, Math.round(rect.top)));
        }
    }, []);

    useEffect(() => {
        updateNavTop();
        window.addEventListener("resize", updateNavTop, { passive: true });
        return () => {
            window.removeEventListener("resize", updateNavTop);
        };
    }, [dispatchMaintenance, updateNavTop]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    const closeDrawer = (callback?: () => void) => {
        if (!isOpen) return;
        setIsOpen(false);
        if (callback) {
            setTimeout(callback, 140);
        }
    };

    const toggleDrawer = () => {
        if (isOpen) {
            closeDrawer();
        } else {
            updateNavTop();
            setIsOpen(true);
        }
    };

    const handleLinkClick = (path: string) => {
        closeDrawer(() => {
            navigate(path);
        });
    };

    const handleWhatsAppCTA = () => {
        closeDrawer(() => {
            if (isAuthenticated) {
                setShowOTP(true);
            } else {
                navigate("/login");
            }
        });
    };

    // Close drawer on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                closeDrawer();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);


    return (
        <>
            {/* ── Dispatch Maintenance Banner ────────────────────────────── */}
            {dispatchMaintenance && (
                <div
                    style={{
                        background: "linear-gradient(90deg, #92400e, #b45309)",
                        color: "#fef3c7",
                        padding: "0.38rem 0.85rem",
                        fontSize: "0.76rem",
                        lineHeight: 1.4,
                        zIndex: 200,
                        position: "relative",
                        textAlign: "center",
                        borderBottom: "1px solid rgba(254, 243, 199, 0.15)",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "1100px",
                            margin: "0 auto",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            gap: "0.25rem 0.5rem",
                        }}
                    >
                        <span>
                            <strong>WhatsApp notifications paused due to maintenance</strong> — Read daily on web to build streaks & track in Activity Tracker! 🔥
                        </span>
                    </div>
                </div>
            )}
            <nav
                ref={navRef}
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

                            {/* Streak flame badge — shows when user has an active streak */}
                            {currentStreak > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        padding: "0.28rem 0.65rem",
                                        borderRadius: "99px",
                                        background: "rgba(255,107,0,0.1)",
                                        border: "1px solid rgba(255,107,0,0.2)",
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                        <path
                                            d="M12 2C12 2 7 8 7 13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13C17 10 14 7 14 7C14 7 13.5 10 12 10C10.5 10 10 8 10 8C10 8 8 10 8 12.5C8 11 9 9 9 9C9 9 12 11 12 14C12 12 13 10 13 10C13 10 17 12 17 15C17 12 12 2 12 2Z"
                                            fill="#FF6B00"
                                        />
                                    </svg>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--bhagwa)", lineHeight: 1 }}>
                                        {currentStreak}
                                    </span>
                                </div>
                            )}

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

                {/* Mobile Right Controls (Streak & Hamburger) */}
                <div className="nav-mobile-controls">
                    {currentStreak > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "0.28rem 0.65rem",
                                borderRadius: "99px",
                                background: "rgba(255,107,0,0.1)",
                                border: "1px solid rgba(255,107,0,0.2)",
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                <path
                                    d="M12 2C12 2 7 8 7 13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13C17 10 14 7 14 7C14 7 13.5 10 12 10C10.5 10 10 8 10 8C10 8 8 10 8 12.5C8 11 9 9 9 9C9 9 12 11 12 14C12 12 13 10 13 10C13 10 17 12 17 15C17 12 12 2 12 2Z"
                                    fill="#FF6B00"
                                />
                            </svg>
                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--bhagwa)", lineHeight: 1 }}>
                                {currentStreak}
                            </span>
                        </div>
                    )}
                    <button
                        className="hamburger-btn"
                        onClick={toggleDrawer}
                        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={isOpen}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <line x1="4.5" y1="7" x2="19.5" y2="7" />
                            <line x1="4.5" y1="12" x2="19.5" y2="12" />
                            <line x1="4.5" y1="17" x2="19.5" y2="17" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            <div
                className={`nav-mobile-overlay ${isOpen ? "active" : ""}`}
                style={{
                    top: `${navTop}px`,
                    height: `calc(100dvh - ${navTop}px)`,
                }}
                onClick={() => closeDrawer()}
                aria-hidden="true"
            />

            {/* Mobile Navigation Drawer */}
            <div
                className={`nav-mobile-drawer ${isOpen ? "active" : ""}`}
                style={{
                    top: `${navTop}px`,
                    height: `calc(100dvh - ${navTop}px)`,
                    bottom: "auto",
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation Menu"
            >
                {/* Sticky Drawer Header - NEVER hides on scroll, permanently visible */}
                <div className="nav-drawer-header">
                    <div className="nav-drawer-header-left">
                        <span className="nav-drawer-om-badge">ॐ</span>
                        <span className="nav-drawer-title">{APP_NAME}</span>
                    </div>
                    <button
                        className="nav-drawer-close-btn"
                        onClick={() => closeDrawer()}
                        aria-label="Close navigation menu"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>


                    {/* Scrollable Drawer Body */}
                    <div className="nav-drawer-body">
                        {/* User Profile Summary Card */}
                        <div className="nav-drawer-profile-card">
                            {isAuthenticated && user ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name}
                                            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,107,0,0.25)", flexShrink: 0 }}
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
                                                flexShrink: 0,
                                                boxShadow: "0 2px 8px rgba(255,107,0,0.2)",
                                            }}
                                        >
                                            {user.name?.[0]?.toUpperCase() ?? "U"}
                                        </div>
                                    )}
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <h4 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {user.name}
                                        </h4>
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {user.email}
                                        </p>
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
                        <div className="nav-drawer-nav-group">
                            <button
                                className="nav-drawer-link-btn"
                                onClick={() => handleLinkClick("/shloks")}
                            >
                                <span style={{ fontSize: "1.1rem" }}>📖</span>
                                <span>Browse All Shloks</span>
                            </button>

                            {isAuthenticated && user && (
                                <>
                                    <button
                                        className="nav-drawer-link-btn"
                                        onClick={() => handleLinkClick("/home")}
                                    >
                                        <span style={{ fontSize: "1.1rem" }}>🌅</span>
                                        <span>Today's Shlok</span>
                                    </button>

                                    <button
                                        className="nav-drawer-link-btn"
                                        onClick={() => handleLinkClick("/profile")}
                                    >
                                        <span style={{ fontSize: "1.1rem" }}>👤</span>
                                        <span>My Profile</span>
                                    </button>

                                    {user.is_admin && (
                                        <button
                                            className="nav-drawer-link-btn"
                                            style={{ color: "var(--bhagwa)" }}
                                            onClick={() => handleLinkClick("/admin")}
                                        >
                                            <span style={{ fontSize: "1.1rem" }}>⚙️</span>
                                            <span>Admin Dashboard</span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* WhatsApp USP Section */}
                        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,107,0,0.12)", paddingTop: "1.25rem" }}>
                            {isAuthenticated && user && user.is_wa_subscribed ? (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                        padding: "0.75rem 1rem",
                                        background: "rgba(34,197,94,0.08)",
                                        borderRadius: "12px",
                                        border: "1px solid rgba(34,197,94,0.22)",
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
                                    closeDrawer(() => logout());
                                }}
                                className="nav-drawer-link-btn"
                                style={{
                                    justifyContent: "center",
                                    fontSize: "0.88rem",
                                    color: "#dc2626",
                                    border: "1px solid rgba(220,38,38,0.2)",
                                    background: "rgba(220,38,38,0.04)",
                                    borderRadius: "11px",
                                    marginTop: "0.25rem",
                                }}
                            >
                                Logout
                            </button>
                        )}
                    </div>
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
