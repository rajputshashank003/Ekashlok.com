import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import ShlokCard from "../../components/ShlokCard/ShlokCard";
import { authApi } from "../../utils/api_request/auth";
import { useUser } from "../../hooks/useUser";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, TOTAL_SHLOKS, DAILY_SEND_TIME } from "../../utils/constants";

// Static sample verse (Chapter 1, Verse 3) for landing preview
const SAMPLE_VERSE = {
  chapterNumber: 2,
  chapterName: "Sankhya Yoga",
  verseNumber: 47,
  sanskrit: "कर्मण्येवाधिकारस्ते\nमा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा\nते सङ्गोऽस्त्वकर्मणि॥",
  transliteration: "Karmaṇy-evādhikāras te\nmā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr\nmā te saṅgo 'stv akarmaṇi",
  hinglishMeaning:
    "Tumhara adhikar sirf karm karne mein hai, uske falon mein kabhi nahi. Na hi tum karm ke phal ke liye karo, aur na hi akarman mein teri aasakti ho.",
  simpleExplanation:
    "Shri Krishna Arjun ko samjhate hain ki hame apna karm poori nishtha se karna chahiye, bina is chinta ke ki parinam kya hoga.\nJo log sirf phal ki chinta mein doobe rehte hain, unka karm prabhavit hota hai.\nLekin jo log nirlipta hokar karm karte hain, unhe andar se sukoon milta hai.",
  lifeLesson:
    "Result pe dhyan mat do — apne karm pe dhyan do. Jab hum apna 100% dete hain bina phal ki chinta ke, tabhi asli success aati hai.",
};

const STEPS = [
  { emoji: "🔐", title: "Login with Google", desc: "Secure, one-click login — no password needed" },
  { emoji: "📱", title: "Connect WhatsApp", desc: "Verify your number with a quick OTP" },
  { emoji: "🌅", title: `Receive daily at ${DAILY_SEND_TIME}`, desc: "One shlok, every morning, straight to your WhatsApp" },
];

const Landing: React.FC = () => {
  const { login, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/home");
  }, [isAuthenticated]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoggingIn(true);
    try {
      const data = await authApi.verifyGoogleToken(credentialResponse.credential);
      login(data.token, data.user);
    } catch {
      // handled by global error handler in utils.ts
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar transparent />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--grad-hero)",
          textAlign: "center",
        }}
      >
        {/* Floating Om symbols */}
        <div
          className="animate-float"
          style={{
            position: "absolute", top: "10%", left: "5%",
            fontFamily: "'Noto Serif Devanagari', serif",
            fontSize: "6rem", color: "rgba(255,255,255,0.08)",
            userSelect: "none", pointerEvents: "none",
          }}
        >ॐ</div>
        <div
          className="animate-float-rev"
          style={{
            position: "absolute", bottom: "10%", right: "8%",
            fontFamily: "'Noto Serif Devanagari', serif",
            fontSize: "5rem", color: "rgba(255,255,255,0.07)",
            userSelect: "none", pointerEvents: "none",
          }}
        >ॐ</div>
        <div
          className="animate-float"
          style={{
            position: "absolute", top: "20%", right: "15%",
            fontFamily: "'Noto Serif Devanagari', serif",
            fontSize: "3rem", color: "rgba(255,255,255,0.06)",
            userSelect: "none", pointerEvents: "none",
            animationDelay: "1s",
          }}
        >ॐ</div>

        <div style={{ position: "relative", maxWidth: "720px", margin: "0 auto" }}>
          <div
            className="animate-fade-in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              borderRadius: "99px",
              padding: "0.4rem 1rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(255,255,255,0.3)",
              fontSize: "0.85rem",
              color: "white",
              fontWeight: 600,
            }}
          >
            <span>🌼</span> {TOTAL_SHLOKS} Shloks · 18 Chapters · Daily Delivery
          </div>

          <h1
            className="animate-slide-up"
            style={{
              fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
              fontWeight: 900,
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.25rem",
            }}
          >
            {APP_NAME}
          </h1>

          <p
            className="animate-slide-up"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "rgba(255,255,255,0.9)",
              maxWidth: "520px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
              animationDelay: "0.1s",
            }}
          >
            {APP_TAGLINE}. <br />
            <span style={{ opacity: 0.8 }}>One shlok a day keeps the chaos away.</span>
          </p>

          <div className="animate-fade-in" style={{ animationDelay: "0.2s", display: "flex", justifyContent: "center" }}>
            {loggingIn ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <div className="spinner" style={{ borderTopColor: "white", border: "3px solid rgba(255,255,255,0.3)" }} />
                <span style={{ color: "white", fontSize: "0.9rem" }}>Signing you in…</span>
              </div>
            ) : (
              <div
                style={{
                  background: "white",
                  borderRadius: "14px",
                  padding: "0.4rem",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google login failed")}
                  shape="pill"
                  size="large"
                  text="signin_with"
                />
              </div>
            )}
          </div>
        </div>

        {/* Wave divider */}
        <svg
          style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: "60px" }}
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          fill="var(--cream)"
        >
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* ── Sample Shlok Section ─────────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge badge-bhagwa" style={{ marginBottom: "0.75rem" }}>Preview</span>
          <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
            This is what you'll receive daily
          </h2>
          <p className="section-subtitle">
            Every morning at 6 AM IST, this beautifully formatted shlok lands in your WhatsApp
          </p>
        </div>

        {/* WhatsApp bubble wrapper */}
        <div
          className="wa-preview-container"
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #128C7E 0%, #075E54 100%)",
            borderRadius: "20px",
            boxShadow: "0 16px 48px rgba(7,94,84,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem",
              }}
            >ॐ</div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}>{APP_NAME}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }}>Business · 6:00 AM</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "12px", overflow: "hidden" }}>
            <ShlokCard verse={SAMPLE_VERSE} />
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", background: "white" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>How It Works</h2>
            <p className="section-subtitle">Three simple steps to start your Gita journey</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: "2rem 1.5rem",
                  textAlign: "center",
                  animation: `slideUp 0.6s ease ${i * 0.1}s both`,
                }}
              >
                <div
                  style={{
                    width: "56px", height: "56px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(255,149,0,0.1) 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.6rem",
                    margin: "0 auto 1rem",
                    border: "1px solid rgba(255,107,0,0.15)",
                  }}
                >
                  {step.emoji}
                </div>
                <div
                  style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: "var(--bhagwa)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 800,
                    margin: "0 auto 0.75rem",
                  }}
                >
                  {i + 1}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "4rem 1.5rem",
          background: "var(--grad-dark)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "2rem",
          }}
        >
          {[
            { number: `${TOTAL_SHLOKS}`, label: "Shloks" },
            { number: "18", label: "Chapters" },
            { number: "6 AM", label: "Daily Delivery" },
            { number: "Free", label: "Forever" },
          ].map((stat, i) => (
            <div key={i}>
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 900,
                  color: "var(--bhagwa-light)",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.number}
              </div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,248,240,0.7)", marginTop: "0.25rem" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", textAlign: "center", background: "var(--cream)" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "'Noto Serif Devanagari', serif",
              fontSize: "3rem",
              color: "var(--bhagwa)",
              marginBottom: "1rem",
            }}
          >ॐ</div>
          <h2 className="section-title" style={{ marginBottom: "0.75rem" }}>
            Begin Your Journey
          </h2>
          <p className="section-subtitle" style={{ marginBottom: "2rem" }}>
            {APP_DESCRIPTION}
          </p>
          {loggingIn ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ background: "white", borderRadius: "14px", padding: "0.4rem", boxShadow: "var(--shadow-md)" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google login failed")}
                  shape="pill"
                  size="large"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          textAlign: "center",
          padding: "1.5rem",
          borderTop: "1px solid var(--border)",
          background: "white",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ fontFamily: "'Noto Serif Devanagari', serif", color: "var(--bhagwa)", marginRight: "0.4rem" }}>ॐ</span>
        {APP_NAME} · Jai Shri Krishna 🙏
      </footer>
    </div>
  );
};

export default Landing;
