import React, { useState } from "react";
import toast from "react-hot-toast";
import { waApi } from "../../utils/api_request/whatsapp";
import { WA_START_CHOICES, TOTAL_SHLOKS, DAILY_SEND_TIME } from "../../utils/constants";

interface OTPModalProps {
  currentShlokCount: number;
  onSuccess: (shlokCount: number) => void;
  onClose: () => void;
}

type Step = "phone" | "otp" | "choice";

const OTPModal: React.FC<OTPModalProps> = ({ currentShlokCount, onSuccess, onClose }) => {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [choice, setChoice] = useState<string>(WA_START_CHOICES.CURRENT);
  const [customCount, setCustomCount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sandboxNote, setSandboxNote] = useState<string>("");

  const handleSendOTP = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await waApi.sendOTP(phone);
      if (res.sandbox_note) setSandboxNote(res.sandbox_note);
      toast.success("OTP sent on WhatsApp! 📱");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await waApi.verifyOTP(phone, otp);
      toast.success("Phone verified! ✅");
      setStep("choice");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    let custom: number | undefined;
    if (choice === WA_START_CHOICES.CUSTOM) {
      custom = parseInt(customCount, 10);
      if (!custom || custom < 1 || custom > TOTAL_SHLOKS) {
        toast.error(`Enter a number between 1 and ${TOTAL_SHLOKS}`);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await waApi.subscribe(choice, custom);
      toast.success("Subscribed! You'll receive shloks daily at " + DAILY_SEND_TIME + " 🌸");
      onSuccess(res.shlok_count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,8,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card animate-fade-scale"
        style={{ width: "100%", maxWidth: "460px", padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
              📲 Connect WhatsApp
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              {step === "phone" && "Enter your WhatsApp number"}
              {step === "otp" && "Check your WhatsApp for the OTP"}
              {step === "choice" && "Choose where to start"}
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: "1.2rem", padding: "0.25rem 0.5rem" }}>✕</button>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.75rem" }}>
          {(["phone", "otp", "choice"] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: "4px",
                borderRadius: "99px",
                background: i <= ["phone", "otp", "choice"].indexOf(step)
                  ? "var(--bhagwa)"
                  : "rgba(255,107,0,0.15)",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* ── Step 1: Phone ── */}
        {step === "phone" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
                WhatsApp Number
              </label>
              <input
                id="wa-phone-input"
                className="input"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendOTP()}
              />
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                Include country code (e.g. +91 for India)
              </p>
            </div>
            <button className="btn-primary" onClick={handleSendOTP} disabled={loading}>
              {loading ? "Sending…" : "Send OTP on WhatsApp →"}
            </button>
          </div>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                background: "rgba(255,107,0,0.06)",
                borderRadius: "12px",
                padding: "0.9rem 1rem",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                border: "1px solid rgba(255,107,0,0.12)",
              }}
            >
              📱 We've sent a 6-digit OTP to <strong>{phone}</strong> on WhatsApp.
            </div>

            {/* Sandbox mode note — only shown when backend returns sandbox_note */}
            {sandboxNote && (
              <div
                style={{
                  background: "rgba(255, 193, 7, 0.08)",
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  fontSize: "0.82rem",
                  color: "#92400e",
                  lineHeight: 1.6,
                }}
              >
                <strong>⚠️ Test Mode Active</strong><br />
                {sandboxNote}
              </div>
            )}

            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
                Enter OTP
              </label>
              <input
                id="wa-otp-input"
                className="input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                style={{ letterSpacing: "0.3em", fontSize: "1.2rem", textAlign: "center" }}
              />
            </div>
            <button className="btn-primary" onClick={handleVerifyOTP} disabled={loading}>
              {loading ? "Verifying…" : "Verify OTP →"}
            </button>
            <button className="btn-ghost" onClick={() => setStep("phone")} style={{ fontSize: "0.85rem", margin: "0 auto" }}>
              ← Change number
            </button>
          </div>
        )}


        {/* ── Step 3: Start Choice ── */}
        {step === "choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Where would you like to start on WhatsApp?
            </p>

            {[
              {
                value: WA_START_CHOICES.FROM_START,
                emoji: "🌱",
                label: "From Shlok 1",
                desc: "Start from the very beginning",
              },
              {
                value: WA_START_CHOICES.CURRENT,
                emoji: "📍",
                label: `Today's Shlok (#${currentShlokCount})`,
                desc: "Continue from where you are on the website",
              },
              {
                value: WA_START_CHOICES.CUSTOM,
                emoji: "🎯",
                label: "Custom Number",
                desc: "Pick any shlok to start from",
              },
            ].map(opt => (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  padding: "0.9rem 1rem",
                  borderRadius: "12px",
                  border: `2px solid ${choice === opt.value ? "var(--bhagwa)" : "var(--border)"}`,
                  background: choice === opt.value ? "rgba(255,107,0,0.05)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <input
                  type="radio"
                  name="start-choice"
                  value={opt.value}
                  checked={choice === opt.value}
                  onChange={() => setChoice(opt.value)}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: "1.3rem" }}>{opt.emoji}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{opt.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{opt.desc}</div>
                </div>
              </label>
            ))}

            {choice === WA_START_CHOICES.CUSTOM && (
              <input
                id="wa-custom-count"
                className="input"
                type="number"
                min={1}
                max={TOTAL_SHLOKS}
                placeholder={`Shlok number (1–${TOTAL_SHLOKS})`}
                value={customCount}
                onChange={e => setCustomCount(e.target.value)}
              />
            )}

            <button className="btn-primary" onClick={handleSubscribe} disabled={loading}>
              {loading ? "Subscribing…" : "Start Receiving Daily Shloks 🙏"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPModal;
