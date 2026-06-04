import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { shlokApi } from "../../utils/api_request/shlok";
import { TOTAL_SHLOKS } from "../../utils/constants";
import { SkeletonChapters } from "../../components/Skeleton/Skeleton";

interface ChapterSummary {
  chapter_number: number;
  chapter_name: string;
  chapter_name_hindi: string;
  summary: string;
  verse_count: number;
}

const CHAPTER_COLORS = [
  "#FF6B00","#FF9500","#E55A00","#FFB347","#C9A84C",
  "#FF6B00","#FF9500","#E55A00","#FFB347","#C9A84C",
  "#FF6B00","#FF9500","#E55A00","#FFB347","#C9A84C",
  "#FF6B00","#FF9500","#E55A00",
];

const ShlokBrowser: React.FC = () => {
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shlokApi.getChapters().then((d) => {
      setChapters(d.chapters || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      {/* Header */}
      <div
        style={{
          background: "var(--grad-hero)",
          padding: "3rem 1.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", top: 0, right: "10%",
            fontFamily: "'Noto Serif Devanagari', serif",
            fontSize: "8rem", color: "rgba(255,255,255,0.06)",
            userSelect: "none", pointerEvents: "none",
          }}
        >ॐ</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "white", marginBottom: "0.5rem" }}>
          Bhagavad Gita
        </h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem" }}>
          {TOTAL_SHLOKS} Shloks · 18 Chapters · Browse all
        </p>
      </div>

      <div className="container-app" style={{ padding: "2.5rem 1.5rem" }}>
        {loading ? (
          <SkeletonChapters />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {chapters.map((ch, i) => (
              <Link
                key={ch.chapter_number}
                to={`/shloks/${ch.chapter_number}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="card"
                  style={{
                    padding: "1.5rem",
                    animation: `fadeIn 0.4s ease ${i * 0.04}s both`,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Chapter number watermark */}
                  <div
                    style={{
                      position: "absolute",
                      right: "-10px",
                      bottom: "-15px",
                      fontSize: "5rem",
                      fontWeight: 900,
                      color: "rgba(255,107,0,0.05)",
                      lineHeight: 1,
                      userSelect: "none",
                    }}
                  >
                    {ch.chapter_number}
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div
                      style={{
                        minWidth: "40px", height: "40px",
                        borderRadius: "12px",
                        background: `${CHAPTER_COLORS[i]}20`,
                        border: `1px solid ${CHAPTER_COLORS[i]}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: CHAPTER_COLORS[i],
                      }}
                    >
                      {ch.chapter_number}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                        {ch.chapter_name}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "'Noto Serif Devanagari', serif" }}>
                        {ch.chapter_name_hindi}
                      </p>
                    </div>
                  </div>

                  <p
                    style={{
                      marginTop: "0.75rem",
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {ch.summary}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.9rem", alignItems: "center" }}>
                    <span className="badge badge-bhagwa">{ch.verse_count} shloks</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--bhagwa)", fontWeight: 600 }}>Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShlokBrowser;
