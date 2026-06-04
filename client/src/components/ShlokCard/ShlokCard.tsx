import React from "react";

interface Verse {
  chapter_number?: number;
  chapter_name?: string;
  chapter_name_hindi?: string;
  chapterNumber?: number;
  chapterName?: string;
  verse_number?: number;
  verseNumber?: number;
  sanskrit: string;
  transliteration: string;
  hinglishMeaning: string;
  simpleExplanation: string;
  lifeLesson: string;
  global_count?: number;
}

interface ShlokCardProps {
  verse: Verse;
  shlokCount?: number;
  totalVerses?: number;
  className?: string;
  compact?: boolean;
}

const ShlokCard: React.FC<ShlokCardProps> = ({
  verse,
  shlokCount,
  totalVerses,
  className = "",
  compact = false,
}) => {
  const chapterNum = verse.chapter_number ?? verse.chapterNumber ?? 0;
  const verseNum = verse.verse_number ?? verse.verseNumber ?? 0;

  return (
    <div
      className={`card animate-fade-in ${className}`}
      style={{ padding: compact ? "1.5rem" : "2rem", overflow: "hidden", position: "relative" }}
    >
      {/* Om watermark */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-10px",
          fontSize: "8rem",
          color: "rgba(255,107,0,0.04)",
          fontFamily: "'Noto Serif Devanagari', serif",
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: 1,
        }}
      >
        ॐ
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--bhagwa)", fontWeight: 700 }}>
            🌼 Bhagavad Gita
          </span>
          <h2 style={{ fontSize: compact ? "1rem" : "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
            Adhyay {chapterNum}, Shlok {verseNum}
          </h2>
          {verse.chapterName || verse.chapter_name ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
              {verse.chapterName ?? verse.chapter_name}
            </p>
          ) : null}
        </div>
        {shlokCount !== undefined && totalVerses !== undefined && (
          <span className="badge badge-bhagwa">{shlokCount} / {totalVerses}</span>
        )}
      </div>

      {/* Sanskrit */}
      <section style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>🕉️</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bhagwa)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sanskrit</span>
        </div>
        <p
          className="devanagari"
          style={{
            fontSize: compact ? "1rem" : "1.1rem",
            color: "var(--text-primary)",
            lineHeight: 2,
            backgroundColor: "rgba(255,107,0,0.04)",
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            borderLeft: "3px solid var(--bhagwa)",
          }}
        >
          {verse.sanskrit}
        </p>
      </section>

      {/* Transliteration */}
      <section style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>🔤</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bhagwa)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Transliteration</span>
        </div>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.8 }}>
          {verse.transliteration}
        </p>
      </section>

      {/* Hinglish Meaning */}
      <section style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>🪷</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bhagwa)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Hinglish Meaning</span>
        </div>
        <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.75 }}>
          {verse.hinglishMeaning}
        </p>
      </section>

      {!compact && (
        <>
          {/* Simple Explanation */}
          <section style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1rem" }}>✨</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bhagwa)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Simple Explanation</span>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              {verse.simpleExplanation}
            </p>
          </section>

          {/* Life Lesson */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1rem" }}>📚</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bhagwa)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Life Lesson</span>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,107,0,0.06) 0%, rgba(255,149,0,0.06) 100%)",
                borderRadius: "12px",
                padding: "1rem",
                border: "1px solid rgba(255,107,0,0.12)",
              }}
            >
              <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.75, fontStyle: "italic" }}>
                {verse.lifeLesson}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ShlokCard;
