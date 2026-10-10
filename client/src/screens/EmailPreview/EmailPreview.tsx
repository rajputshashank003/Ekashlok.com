import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { shlokApi } from "../../utils/api_request/shlok";

interface Verse {
  chapterNumber?: number;
  chapterName?: string;
  chapterNameHindi?: string;
  verseNumber?: number;
  sanskrit: string;
  transliteration: string;
  hinglishMeaning: string;
  englishMeaning?: string;
  simpleExplanation?: string;
  lifeLesson?: string;
}

const EmailPreview: React.FC = () => {
  const [chapter, setChapter] = useState(2);
  const [verseNum, setVerseNum] = useState(47);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [emailType, setEmailType] = useState<"weekly" | "milestone">("weekly");

  useEffect(() => {
    setLoading(true);
    shlokApi
      .getVerse(chapter, verseNum)
      .then(d => {
        setVerse(d.verse || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chapter, verseNum]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0eb" }}>
      <Navbar />

      <div className="container-app" style={{ maxWidth: "1000px", padding: "1.5rem" }}>
        {/* Controls Toolbar */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              📧 Email Preview
            </span>

            {/* Email Type Switcher */}
            <div style={{ display: "flex", gap: "0.3rem", background: "var(--cream)", padding: "3px", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setEmailType("weekly")}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "7px",
                  border: "none",
                  background: emailType === "weekly" ? "#FF6B00" : "transparent",
                  color: emailType === "weekly" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📅 Weekly Broadcast
              </button>
              <button
                onClick={() => setEmailType("milestone")}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "7px",
                  border: "none",
                  background: emailType === "milestone" ? "#FF6B00" : "transparent",
                  color: emailType === "milestone" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🎯 Login Milestone
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Chapter:</label>
              <input
                type="number"
                min={1}
                max={18}
                value={chapter}
                onChange={e => setChapter(Number(e.target.value))}
                style={{
                  width: "55px",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "0.82rem",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Verse:</label>
              <input
                type="number"
                min={1}
                max={78}
                value={verseNum}
                onChange={e => setVerseNum(Number(e.target.value))}
                style={{
                  width: "55px",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "0.82rem",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              onClick={() => setViewMode("desktop")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                border: viewMode === "desktop" ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                background: viewMode === "desktop" ? "rgba(255,107,0,0.1)" : "transparent",
                color: viewMode === "desktop" ? "var(--bhagwa)" : "var(--text-secondary)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🖥️ Desktop (600px)
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                border: viewMode === "mobile" ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                background: viewMode === "mobile" ? "rgba(255,107,0,0.1)" : "transparent",
                color: viewMode === "mobile" ? "var(--bhagwa)" : "var(--text-secondary)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📱 Mobile (375px)
            </button>
          </div>
        </div>

        {/* Email Canvas Preview */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: viewMode === "desktop" ? "600px" : "375px",
              background: "#FFF8F0",
              borderRadius: "20px",
              boxShadow: "0 12px 40px rgba(255,107,0,0.12)",
              border: "1px solid rgba(255,107,0,0.22)",
              overflow: "hidden",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              transition: "width 0.2s ease",
            }}
          >
            {/* Email Hero Header (Matches Ekashlok Bhagwa Gradient) */}
            <div
              style={{
                background: "linear-gradient(135deg, #FF6B00 0%, #FF8500 45%, #FFA033 100%)",
                padding: "28px 24px 22px",
                textAlign: "center",
                color: "#FFFFFF",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  borderRadius: "99px",
                  padding: "3px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                {emailType === "weekly" ? "🌼 WEEKLY WISDOM · हर हफ़्ते एक श्लोक" : "🎯 LOGIN MILESTONE · हर लॉगइन एक श्लोक"}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "'Noto Serif Devanagari', serif",
                    fontSize: "28px",
                    lineHeight: 1,
                    color: "#FFFFFF",
                  }}
                >
                  ॐ
                </span>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Ekashlok · Bhagavad Gita
                </h1>
              </div>
              <p style={{ margin: "6px 0 0", color: "rgba(255, 255, 255, 0.92)", fontSize: "12.5px", fontWeight: 500 }}>
                {emailType === "weekly"
                  ? "700 Verses · Ancient Wisdom for Modern Living"
                  : `Namaste! Here is your login milestone shlok (Verse #${verse?.verseNumber || 47} of 700) 🎯`}
              </p>
            </div>

            {/* Email Body: The Today's Shlok Card */}
            {loading || !verse ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9A6B4B" }}>
                Loading verse…
              </div>
            ) : (
              <div style={{ padding: "20px 18px" }}>
                {/* Shlok Card Container (Exact ShlokCard Design) */}
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 107, 0, 0.2)",
                    boxShadow: "0 4px 20px rgba(255, 107, 0, 0.06)",
                    padding: "22px 18px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Om Watermark */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-20px",
                      right: "-10px",
                      fontSize: "7rem",
                      color: "rgba(255,107,0,0.04)",
                      fontFamily: "'Noto Serif Devanagari', serif",
                      userSelect: "none",
                      pointerEvents: "none",
                      lineHeight: 1,
                    }}
                  >
                    ॐ
                  </div>

                  {/* Card Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "18px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#FF6B00",
                          fontWeight: 700,
                          marginBottom: "4px",
                        }}
                      >
                        🌼 Bhagavad Gita
                      </div>
                      <h2
                        style={{
                          fontSize: "19px",
                          fontWeight: 800,
                          color: "#1A0800",
                          margin: 0,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Adhyay {verse.chapterNumber}, Shlok {verse.verseNumber}
                      </h2>
                      {(verse.chapterName || verse.chapterNameHindi) && (
                        <div style={{ fontSize: "12.5px", color: "#9A6B4B", marginTop: "3px" }}>
                          {verse.chapterName} {verse.chapterNameHindi ? `(${verse.chapterNameHindi})` : ""}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        background: "rgba(255,107,0,0.1)",
                        border: "1px solid rgba(255,107,0,0.25)",
                        color: "#FF6B00",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "99px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Verse #{verse.verseNumber} of 700
                    </span>
                  </div>

                  {/* Sanskrit Section (Exact ShlokCard Box) */}
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#FF6B00",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <span>🕉️</span>
                      <span>Sanskrit</span>
                    </div>
                    <div
                      style={{
                        backgroundColor: "rgba(255,107,0,0.04)",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        borderLeft: "3.5px solid #FF6B00",
                        borderTop: "1px solid rgba(255,107,0,0.1)",
                        borderRight: "1px solid rgba(255,107,0,0.1)",
                        borderBottom: "1px solid rgba(255,107,0,0.1)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Noto Serif Devanagari', serif",
                          fontSize: "18px",
                          color: "#1A0800",
                          lineHeight: 1.85,
                          margin: 0,
                          whiteSpace: "pre-line",
                          fontWeight: 600,
                        }}
                      >
                        {verse.sanskrit}
                      </p>
                    </div>
                  </div>

                  {/* Transliteration Section */}
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "5px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#FF6B00",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <span>🔤</span>
                      <span>Transliteration</span>
                    </div>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#6B3A1A",
                        fontStyle: "italic",
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      {verse.transliteration}
                    </p>
                  </div>

                  {/* Hinglish Meaning Section */}
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "5px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#FF6B00",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <span>🪷</span>
                      <span>Hinglish Meaning</span>
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#1A0800",
                        lineHeight: 1.65,
                        margin: 0,
                      }}
                    >
                      {verse.hinglishMeaning}
                    </p>
                  </div>

                  {/* English Meaning Section */}
                  {verse.englishMeaning && (
                    <div style={{ marginBottom: "18px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "5px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#FF6B00",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        <span>📖</span>
                        <span>English Meaning</span>
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#1A0800",
                          lineHeight: 1.65,
                          margin: 0,
                        }}
                      >
                        {verse.englishMeaning}
                      </p>
                    </div>
                  )}

                  {/* Simple Explanation Section */}
                  {verse.simpleExplanation && (
                    <div style={{ marginBottom: "18px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "5px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#FF6B00",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        <span>✨</span>
                        <span>Simple Explanation</span>
                      </div>
                      <p
                        style={{
                          fontSize: "13.5px",
                          color: "#6B3A1A",
                          lineHeight: 1.65,
                          margin: 0,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {verse.simpleExplanation}
                      </p>
                    </div>
                  )}

                  {/* Life Lesson Section */}
                  {verse.lifeLesson && (
                    <div style={{ marginBottom: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "6px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#FF6B00",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        <span>📚</span>
                        <span>Life Lesson</span>
                      </div>
                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(255,107,0,0.06) 0%, rgba(255,149,0,0.06) 100%)",
                          borderRadius: "12px",
                          padding: "13px 15px",
                          border: "1px solid rgba(255,107,0,0.14)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "13.5px",
                            color: "#1A0800",
                            lineHeight: 1.65,
                            fontStyle: "italic",
                            margin: 0,
                          }}
                        >
                          {verse.lifeLesson}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div style={{ textAlign: "center", margin: "24px 0 12px" }}>
                  <a
                    href="https://ekashlok.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(135deg, #FF6B00 0%, #E55A00 100%)",
                      color: "#FFFFFF",
                      textDecoration: "none",
                      padding: "12px 28px",
                      borderRadius: "99px",
                      fontWeight: 800,
                      fontSize: "14px",
                      boxShadow: "0 4px 16px rgba(255,107,0,0.32)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    🕉️ Read on Ekashlok.com →
                  </a>
                  <div style={{ fontSize: "11.5px", color: "#9A6B4B", marginTop: "8px" }}>
                    Build your reading streak · Track daily shloks · Explore 700 verses
                  </div>
                </div>
              </div>
            )}

            {/* Email Footer */}
            <div
              style={{
                background: "#FFF0DC",
                padding: "18px 20px",
                borderTop: "1px solid rgba(255,107,0,0.15)",
                textAlign: "center",
                fontSize: "11px",
                color: "#8A5528",
                lineHeight: 1.6,
              }}
            >
              {emailType === "weekly" ? (
                <>
                  <div>You received this email because you are subscribed to weekly Shloks on Ekashlok.com.</div>
                  <div style={{ marginTop: "6px" }}>
                    <a
                      href="#unsubscribe"
                      style={{ color: "#E55A00", fontWeight: 600, textDecoration: "underline", marginRight: "12px" }}
                    >
                      Unsubscribe from weekly email shloks
                    </a>
                    ·
                    <a
                      href="https://ekashlok.com/profile"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#8A5528", textDecoration: "underline", marginLeft: "12px" }}
                    >
                      Manage Preferences
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div>You received this milestone update because you logged in to Ekashlok.com.</div>
                  <div style={{ marginTop: "4px", color: "#A06C3E", fontSize: "10.5px" }}>
                    Every login unlocks your next Bhagavad Gita shlok · 700 verses journey 🙏
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
