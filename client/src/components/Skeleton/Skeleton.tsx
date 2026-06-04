import React from "react";

// Reusable basic skeleton wrapper
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBase: React.FC<SkeletonProps> = ({ className = "", style }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export const SkeletonText: React.FC<SkeletonProps & { variant?: "short" | "medium" | "large" | "full" }> = ({
  variant = "full",
  className = "",
  style,
}) => <div className={`skeleton skeleton-text ${variant} ${className}`} style={style} />;

// ─── 1. Shlok Card Skeleton ───────────────────────────────────────────────────
// Matches ShlokCard.tsx layout exactly
export const SkeletonShlok: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div
      className="card animate-fade-in"
      style={{ padding: compact ? "1.5rem" : "2rem", minHeight: "400px", background: "white" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ width: "60%" }}>
          <SkeletonText variant="short" style={{ height: "10px", marginBottom: "0.5rem" }} />
          <SkeletonText variant="medium" style={{ height: "18px" }} />
        </div>
        <SkeletonBase style={{ width: "60px", height: "24px", borderRadius: "12px" }} />
      </div>

      {/* Sanskrit section */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <SkeletonBase style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
          <SkeletonText variant="short" style={{ height: "12px", width: "80px" }} />
        </div>
        <div
          style={{
            backgroundColor: "rgba(255,107,0,0.02)",
            padding: "1rem",
            borderRadius: "10px",
            borderLeft: "3px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <SkeletonText variant="full" style={{ height: "14px" }} />
          <SkeletonText variant="large" style={{ height: "14px" }} />
          <SkeletonText variant="medium" style={{ height: "14px" }} />
        </div>
      </div>

      {/* Transliteration section */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <SkeletonBase style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
          <SkeletonText variant="short" style={{ height: "12px", width: "100px" }} />
        </div>
        <SkeletonText variant="full" style={{ height: "12px", marginBottom: "0.5rem" }} />
        <SkeletonText variant="large" style={{ height: "12px" }} />
      </div>

      {/* Hinglish Meaning section */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <SkeletonBase style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
          <SkeletonText variant="short" style={{ height: "12px", width: "110px" }} />
        </div>
        <SkeletonText variant="full" style={{ height: "12px", marginBottom: "0.5rem" }} />
        <SkeletonText variant="large" style={{ height: "12px" }} />
      </div>

      {!compact && (
        <>
          {/* Simple Explanation section */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <SkeletonBase style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
              <SkeletonText variant="short" style={{ height: "12px", width: "130px" }} />
            </div>
            <SkeletonText variant="full" style={{ height: "12px", marginBottom: "0.5rem" }} />
            <SkeletonText variant="full" style={{ height: "12px", marginBottom: "0.5rem" }} />
            <SkeletonText variant="medium" style={{ height: "12px" }} />
          </div>

          {/* Life Lesson section */}
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <SkeletonBase style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
              <SkeletonText variant="short" style={{ height: "12px", width: "90px" }} />
            </div>
            <div
              style={{
                background: "rgba(255,107,0,0.02)",
                borderRadius: "12px",
                padding: "1rem",
                border: "1px solid rgba(255,107,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <SkeletonText variant="full" style={{ height: "12px" }} />
              <SkeletonText variant="large" style={{ height: "12px" }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── 2. Chapter Grid Skeleton ─────────────────────────────────────────────────
// Matches ShlokBrowser.tsx list view
export const SkeletonChapters: React.FC = () => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card" style={{ padding: "1.5rem", background: "white", height: "185px" }}>
          {/* Avatar and Title row */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <SkeletonBase style={{ width: "40px", height: "40px", borderRadius: "12px" }} />
            <div style={{ flex: 1 }}>
              <SkeletonText variant="medium" style={{ height: "14px", marginBottom: "0.4rem" }} />
              <SkeletonText variant="short" style={{ height: "10px" }} />
            </div>
          </div>
          {/* Summary lines */}
          <SkeletonText variant="full" style={{ height: "11px", marginBottom: "0.4rem" }} />
          <SkeletonText variant="large" style={{ height: "11px", marginBottom: "1rem" }} />
          {/* Badges footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBase style={{ width: "70px", height: "20px", borderRadius: "99px" }} />
            <SkeletonBase style={{ width: "40px", height: "14px", borderRadius: "4px" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── 3. Verse List Skeleton ───────────────────────────────────────────────────
// Matches ChapterVerses.tsx list view
export const SkeletonVerses: React.FC = () => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="card" style={{ padding: "1.25rem", background: "white", height: "118px" }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <SkeletonBase style={{ width: "65px", height: "16px", borderRadius: "4px" }} />
            <SkeletonBase style={{ width: "40px", height: "18px", borderRadius: "99px" }} />
          </div>
          {/* Sanskrit line */}
          <SkeletonText variant="full" style={{ height: "12px", marginBottom: "0.4rem" }} />
          <SkeletonText variant="medium" style={{ height: "10px" }} />
        </div>
      ))}
    </div>
  );
};

// ─── 4. Admin Users List Skeleton ─────────────────────────────────────────────
// Matches AdminUsers.tsx table view layout
export const SkeletonUsers: React.FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid rgba(255,107,0,0.08)", paddingBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "150px" }}>
            <SkeletonBase className="skeleton-circle" style={{ width: "32px", height: "32px" }} />
            <SkeletonText variant="medium" style={{ height: "12px", width: "100px" }} />
          </div>
          <SkeletonText variant="large" style={{ height: "12px", width: "150px" }} />
          <SkeletonBase style={{ width: "40px", height: "18px", borderRadius: "4px" }} />
          <SkeletonBase style={{ width: "80px", height: "18px", borderRadius: "99px" }} />
          <SkeletonBase style={{ width: "80px", height: "26px", borderRadius: "8px" }} />
        </div>
      ))}
    </div>
  );
};

