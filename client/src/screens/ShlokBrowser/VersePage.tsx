import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import ShlokCard from "../../components/ShlokCard/ShlokCard";
import { shlokApi } from "../../utils/api_request/shlok";

const VersePage: React.FC = () => {
  const { chapter, verse } = useParams<{ chapter: string; verse: string }>();
  const navigate = useNavigate();
  const chapterNum = parseInt(chapter || "1", 10);
  const verseNum = parseInt(verse || "1", 10);

  const [verseData, setVerseData] = useState<any>(null);
  const [totalInChapter, setTotalInChapter] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      shlokApi.getVerse(chapterNum, verseNum),
      shlokApi.getChapterVerses(chapterNum),
    ]).then(([vd, cd]) => {
      setVerseData(vd.verse);
      setTotalInChapter((cd.verses || []).length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chapterNum, verseNum]);

  const goToPrev = () => {
    if (verseNum > 1) navigate(`/shloks/${chapterNum}/${verseNum - 1}`);
    else if (chapterNum > 1) navigate(`/shloks/${chapterNum - 1}`);
  };

  const goToNext = () => {
    if (verseNum < totalInChapter) navigate(`/shloks/${chapterNum}/${verseNum + 1}`);
    else if (chapterNum < 18) navigate(`/shloks/${chapterNum + 1}/1`);
  };

  const hasPrev = verseNum > 1 || chapterNum > 1;
  const hasNext = verseNum < totalInChapter || chapterNum < 18;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="container-app" style={{ padding: "1.25rem 1.5rem 0", maxWidth: "820px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
          <Link to="/shloks" style={{ color: "var(--bhagwa)", textDecoration: "none" }}>Chapters</Link>
          <span>›</span>
          <Link to={`/shloks/${chapterNum}`} style={{ color: "var(--bhagwa)", textDecoration: "none" }}>
            Chapter {chapterNum}
          </Link>
          <span>›</span>
          <span>Shlok {verseNum}</span>
        </div>
      </div>

      <div className="container-app" style={{ padding: "1.5rem", maxWidth: "820px" }}>
        {loading ? (
          <div style={{ minHeight: "500px", borderRadius: "20px", overflow: "hidden", position: "relative" }}>
            <div className="animate-shimmer" style={{ position: "absolute", inset: 0 }} />
          </div>
        ) : verseData ? (
          <ShlokCard verse={verseData} />
        ) : (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            Verse not found
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", gap: "0.75rem" }}>
          <button
            className="btn-outline"
            onClick={goToPrev}
            disabled={!hasPrev}
            style={{ flex: 1, justifyContent: "center", padding: "0.7rem 1rem" }}
          >
            ← Previous
          </button>
          <Link
            to={`/shloks/${chapterNum}`}
            className="btn-ghost"
            style={{ flex: 0.5, textAlign: "center", padding: "0.7rem 1rem", border: "1px solid var(--border)", borderRadius: "12px" }}
          >
            Chapter {chapterNum}
          </Link>
          <button
            className="btn-primary"
            onClick={goToNext}
            disabled={!hasNext}
            style={{ flex: 1, justifyContent: "center", padding: "0.7rem 1rem" }}
          >
            Next →
          </button>
        </div>

        {/* Share hint */}
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          🌸 Like this shlok?{" "}
          <Link to="/login" style={{ color: "var(--bhagwa)", textDecoration: "none", fontWeight: 600 }}>
            Subscribe
          </Link>{" "}
          to receive one daily on WhatsApp
        </p>
      </div>
    </div>
  );
};

export default VersePage;
