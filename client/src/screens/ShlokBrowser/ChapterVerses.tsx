import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { shlokApi } from "../../utils/api_request/shlok";
import { SkeletonVerses } from "../../components/Skeleton/Skeleton";

interface Verse {
  verseNumber: number;
  chapterNumber: number;
  chapterName: string;
  sanskrit: string;
  transliteration: string;
  hinglishMeaning: string;
  simpleExplanation: string;
  lifeLesson: string;
  global_count: number;
}

const ChapterVerses: React.FC = () => {
  const { chapter } = useParams<{ chapter: string }>();
  const navigate = useNavigate();
  const chapterNum = parseInt(chapter || "1", 10);

  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapterName, setChapterName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    shlokApi.getChapterVerses(chapterNum).then((d) => {
      setVerses(d.verses || []);
      if (d.verses?.length > 0) {
        setChapterName(d.verses[0].chapterName || "");
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chapterNum]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: "var(--grad-hero)", padding: "2.5rem 1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "5%", bottom: "-20px", fontFamily: "'Noto Serif Devanagari', serif", fontSize: "7rem", color: "rgba(255,255,255,0.06)", userSelect: "none" }}>
          {chapterNum}
        </div>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Link to="/shloks" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.75rem" }}>
            ← All Chapters
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "white", marginBottom: "0.3rem" }}>
            Chapter {chapterNum}
          </h1>
          {chapterName && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem" }}>{chapterName}</p>
          )}
        </div>
      </div>

      <div className="container-app" style={{ padding: "2rem 1.5rem" }}>
        {/* Chapter navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <button
            className="btn-outline"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            onClick={() => chapterNum > 1 && navigate(`/shloks/${chapterNum - 1}`)}
            disabled={chapterNum <= 1}
          >
            ← Previous Chapter
          </button>
          <button
            className="btn-outline"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            onClick={() => chapterNum < 18 && navigate(`/shloks/${chapterNum + 1}`)}
            disabled={chapterNum >= 18}
          >
            Next Chapter →
          </button>
        </div>

        {loading ? (
          <SkeletonVerses />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {verses.map((v, i) => (
              <Link
                key={v.verseNumber}
                to={`/shloks/${chapterNum}/${v.verseNumber}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="card"
                  style={{
                    padding: "1.25rem",
                    animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bhagwa)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Shlok {v.verseNumber}
                    </span>
                    <span className="badge badge-bhagwa" style={{ fontSize: "0.7rem" }}>#{v.global_count}</span>
                  </div>
                  <p
                    className="devanagari"
                    style={{
                      fontSize: "0.88rem",
                      color: "var(--text-primary)",
                      lineHeight: 1.7,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {v.sanskrit.split("\n")[0]}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                    Read →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterVerses;
