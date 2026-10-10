import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { emailApi } from "../../utils/api_request/email";
import { APP_NAME } from "../../utils/constants";

const Unsubscribe: React.FC = () => {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [resubscribing, setResubscribing] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [resubscribed, setResubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnsubscribe = async () => {
    if (!email || !token) {
      setError("Invalid or expired unsubscribe link.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await emailApi.unsubscribeByToken(email, token, "unsubscribe");
      setUnsubscribed(true);
      setResubscribed(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to unsubscribe. Please try again or log in to manage preferences.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!email || !token) {
      setError("Invalid or expired link.");
      return;
    }
    setResubscribing(true);
    setError(null);
    try {
      await emailApi.unsubscribeByToken(email, token, "subscribe");
      setResubscribed(true);
      setUnsubscribed(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to re-subscribe. Please try again.";
      setError(msg);
    } finally {
      setResubscribing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <div
        className="container-app"
        style={{
          maxWidth: "480px",
          padding: "3.5rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="card animate-fade-scale"
          style={{
            width: "100%",
            padding: "2.25rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          {resubscribed ? (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🕉️</div>
              <h1
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                Welcome back!
              </h1>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                You are now subscribed to weekly Bhagavad Gita Shlok emails at{" "}
                <strong>{email}</strong>.
              </p>
              <Link to="/" className="btn-primary" style={{ display: "inline-flex", justifyContent: "center", width: "100%" }}>
                Return to {APP_NAME} →
              </Link>
            </>
          ) : unsubscribed ? (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌱</div>
              <h1
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                Unsubscribed from Weekly Shloks
              </h1>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                We have removed <strong>{email}</strong> from our scheduled weekly Bhagavad Gita email broadcasts.
                You can re-subscribe anytime below or from your Profile settings.
              </p>

              {error && (
                <div
                  style={{
                    background: "rgba(220,38,38,0.08)",
                    border: "1px solid rgba(220,38,38,0.25)",
                    borderRadius: "10px",
                    padding: "0.75rem",
                    color: "#dc2626",
                    fontSize: "0.85rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  className="btn-primary"
                  onClick={handleResubscribe}
                  disabled={resubscribing}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {resubscribing ? "Subscribing…" : "Re-subscribe to Weekly Shloks 🕉️"}
                </button>
                <Link
                  to="/"
                  className="btn-ghost"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                  }}
                >
                  Return to {APP_NAME} →
                </Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✉️</div>
              <h1
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                Unsubscribe from Weekly Emails
              </h1>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "1rem",
                }}
              >
                Are you sure you want to stop receiving weekly Bhagavad Gita shlok broadcasts at{" "}
                <strong>{email || "your email address"}</strong>?
              </p>

              <div
                style={{
                  background: "rgba(255,107,0,0.08)",
                  border: "1px solid rgba(255,107,0,0.2)",
                  borderRadius: "10px",
                  padding: "0.75rem 0.9rem",
                  fontSize: "0.8rem",
                  color: "#9A4B1A",
                  lineHeight: 1.5,
                  textAlign: "left",
                  marginBottom: "1.25rem",
                }}
              >
                ℹ️ <strong>Note:</strong> You can only unsubscribe from weekly email broadcasts. Login milestone emails celebrate your sacred streak and reading progress whenever you log in to {APP_NAME}.
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(220,38,38,0.08)",
                    border: "1px solid rgba(220,38,38,0.25)",
                    borderRadius: "10px",
                    padding: "0.75rem",
                    color: "#dc2626",
                    fontSize: "0.85rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  className="btn-primary"
                  onClick={handleUnsubscribe}
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    background: "#dc2626",
                    boxShadow: "none",
                    justifyContent: "center",
                  }}
                >
                  {loading ? "Unsubscribing…" : "Confirm Unsubscribe from Weekly Shloks"}
                </button>
                <Link
                  to="/"
                  className="btn-ghost"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                  }}
                >
                  Keep My Subscription
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
