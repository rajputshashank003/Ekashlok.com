import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import ShlokCard from "../../components/ShlokCard/ShlokCard";
import OTPModal from "../../components/OTPModal/OTPModal";
import { shlokApi } from "../../utils/api_request/shlok";
import { waApi } from "../../utils/api_request/whatsapp";
import { useUser } from "../../hooks/useUser";
import { TOTAL_SHLOKS, DAILY_SEND_TIME } from "../../utils/constants";
import { SkeletonShlok } from "../../components/Skeleton/Skeleton";

interface TodayShlok {
  shlok_count: number;
  total_verses: number;
  verse: any;
}

const Home: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateUser } = useUser();
  const [todayShlok, setTodayShlok] = useState<TodayShlok | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  if (!isLoading && !isAuthenticated) return <Navigate to="/" replace />;

  useEffect(() => {
    if (isAuthenticated) fetchTodayShlok();
  }, [isAuthenticated]);

  const fetchTodayShlok = async () => {
    setFetching(true);
    try {
      const data = await shlokApi.getTodayShlok();
      setTodayShlok(data);
      updateUser({ shlok_count: data.shlok_count });
    } catch {
      // handled globally
    } finally {
      setFetching(false);
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

  const progressPct = todayShlok
    ? Math.round((todayShlok.shlok_count / TOTAL_SHLOKS) * 100)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <div className="container-app" style={{ padding: "2rem 1.5rem", maxWidth: "820px" }}>
        {/* Greeting */}
        <div className="animate-fade-in" style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
            🙏 Namaste{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.2rem" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Progress bar */}
        {todayShlok && (
          <div className="animate-fade-in card-warm" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", borderRadius: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Your Progress
              </span>
              <span className="badge badge-bhagwa">
                {todayShlok.shlok_count} / {TOTAL_SHLOKS}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              {progressPct}% of Bhagavad Gita completed
            </p>
          </div>
        )}

        {/* Today's Shlok */}
        {fetching ? (
          <SkeletonShlok />
        ) : todayShlok ? (
          <ShlokCard
            verse={todayShlok.verse}
            shlokCount={todayShlok.shlok_count}
            totalVerses={todayShlok.total_verses}
            className="animate-fade-in"
          />
        ) : null}

        {/* WhatsApp CTA / Status */}
        <div className="animate-fade-in" style={{ marginTop: "1.5rem" }}>
          {user?.is_wa_subscribed ? (
            <div
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "14px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.3rem" }}>✅</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#15803d" }}>
                    WhatsApp subscribed
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#166534" }}>
                    Daily shlok at {DAILY_SEND_TIME} → {user.phone}
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: "0.82rem", color: "#dc2626" }}
                onClick={handleUnsubscribe}
                disabled={unsubscribing}
              >
                {unsubscribing ? "…" : "Unsubscribe"}
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "var(--grad-hero)",
                borderRadius: "14px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>
                  📲 Get this on WhatsApp daily
                </p>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  Receive your shlok at {DAILY_SEND_TIME}, every morning
                </p>
              </div>
              <button
                style={{
                  background: "white",
                  color: "var(--bhagwa)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.6rem 1.25rem",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setShowOTP(true)}
              >
                Subscribe Free →
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          <Link to="/shloks" className="btn-outline" style={{ flex: 1, minWidth: "160px", justifyContent: "center" }}>
            Browse All Shloks
          </Link>
          <Link to="/profile" className="btn-ghost" style={{ flex: 1, minWidth: "160px", justifyContent: "center", border: "1px solid var(--border)", borderRadius: "12px", textDecoration: "none", display: "flex", alignItems: "center" }}>
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTP && user && (
        <OTPModal
          currentShlokCount={user.shlok_count}
          onSuccess={(count) => {
            updateUser({ is_wa_subscribed: true, shlok_count: count });
            setShowOTP(false);
          }}
          onClose={() => setShowOTP(false)}
        />
      )}
    </div>
  );
};

export default Home;
