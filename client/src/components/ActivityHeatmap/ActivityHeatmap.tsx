import React, { useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

export interface ActiveDateEntry {
    date: string;        // "YYYY-MM-DD"
    shlok_count: number; // global 1–700 (0 = unknown / legacy row)
    chapter: number;     // 0 = unknown
    verse: number;       // 0 = unknown
}

export interface HeatmapData {
    start_date: string;           // "YYYY-MM-DD" — Jan 1 of join year (from backend)
    end_date: string;             // "YYYY-MM-DD" — today IST (from backend)
    total_active_days: number;
    current_streak: number;
    max_streak: number;
    active_dates: ActiveDateEntry[]; // sorted ascending
}

interface Cell {
    date: string;      // "YYYY-MM-DD" or "" for padding
    active: boolean;
    visible: boolean;  // false = padding cell (opacity 0)
    isFuture: boolean;
    chapter: number;   // 0 = unknown (no navigation available)
    verse: number;     // 0 = unknown
    shlokCount: number;
}

interface MonthBlock {
    label: string;
    columns: Cell[][]; // each column has exactly 7 cells
}

interface TooltipState {
    dateLabel: string;
    active: boolean;
    isFuture: boolean;
    chapter: number;
    verse: number;
    shlokCount: number;
    x: number;
    y: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR_EMPTY = "#edd5be";
const COLOR_ACTIVE = "#FF6B00";

// ─── Grid constants ──────────────────────────────────────────────────────────

const CELL = 9.8;
const WEEK_GAP = 3;   // gap between week columns within a month
const MONTH_GAP = 6;  // gap between month blocks

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// DOW labels — only Mon(1), Wed(3), Fri(5) are shown (LeetCode style)
const DOW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLocal(s: string): Date {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function labelDate(dateStr: string): string {
    return parseLocal(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipProps {
    tip: TooltipState | null;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onNavigate: (chapter: number, verse: number) => void;
}

const Tooltip: React.FC<TooltipProps> = ({ tip, onMouseEnter, onMouseLeave, onNavigate }) => {
    if (!tip) return null;

    const TOOLTIP_W = 220; // Slightly wider for a premium layout
    // Safe left alignment ensuring the tooltip is always fully on-screen
    const left = Math.max(12, Math.min(tip.x - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - 12));
    const top = tip.y - 10; // 10px above the cell

    const hasVerseInfo = tip.active && tip.chapter > 0 && tip.verse > 0;
    const isClickable = hasVerseInfo;

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={() => {
                if (isClickable) {
                    onNavigate(tip.chapter, tip.verse);
                }
            }}
            style={{
                position: "fixed",
                left,
                top,
                width: TOOLTIP_W,
                zIndex: 9999,
                pointerEvents: "auto",
                transform: "translateY(-100%)",
                animation: "tooltipFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                cursor: isClickable ? "pointer" : "default",
                userSelect: "none",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    background: "rgba(24, 24, 27, 0.96)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    width: "100%",
                    boxSizing: "border-box",
                    boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
                    border: tip.active 
                        ? "1px solid rgba(255, 107, 0, 0.35)" 
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
                className="heatmap-tooltip-content"
            >
                {/* Header: Date + Status Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    {/* Date with icon */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", opacity: 0.8 }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f4f4f5" }}>
                            {tip.dateLabel}
                        </span>
                    </div>

                    {/* Status Badge */}
                    {tip.active ? (
                        <span style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(255, 107, 0, 0.15)",
                            color: "#FF7A1A",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                        }}>
                            Read
                        </span>
                    ) : tip.isFuture ? (
                        <span style={{
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "#71717a",
                        }}>
                            Upcoming
                        </span>
                    ) : (
                        <span style={{
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(255, 255, 255, 0.04)",
                            color: "#a1a1aa",
                        }}>
                            No Activity
                        </span>
                    )}
                </div>

                {/* Body Content */}
                {hasVerseInfo ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Shlok Info Card */}
                        <div
                            style={{
                                padding: "8px 10px",
                                background: "rgba(255, 107, 0, 0.05)",
                                borderRadius: 8,
                                border: "1px solid rgba(255, 107, 0, 0.15)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <div style={{ fontSize: "0.72rem", color: "#FFA166", fontWeight: 700, letterSpacing: "0.02em" }}>
                                CH {tip.chapter} · VERSE {tip.verse}
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>
                                Shlok #{tip.shlokCount} of 700
                            </div>
                        </div>

                        {/* Interactive CTA Button */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                padding: "7px 10px",
                                background: "linear-gradient(135deg, #FF6B00 0%, #FF8C32 100%)",
                                borderRadius: 6,
                                color: "#ffffff",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                boxShadow: "0 4px 12px rgba(255, 107, 0, 0.2)",
                                transition: "transform 0.15s ease, filter 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.filter = "brightness(1.08)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "none";
                                e.currentTarget.style.filter = "none";
                            }}
                        >
                            <span>Click to re-read</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.15s ease" }}>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </div>
                    </div>
                ) : tip.active ? (
                    // Legacy active days with unknown verse info
                    <div style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.6)", padding: "2px 0" }}>
                        Shlok read on this day
                    </div>
                ) : tip.isFuture ? (
                    <div style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.5)", padding: "2px 0" }}>
                        This date is in the future.
                    </div>
                ) : (
                    <div style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.5)", padding: "2px 0" }}>
                        No shloks read on this day.
                    </div>
                )}
            </div>

            {/* Caret pointing directly to cell */}
            <div
                style={{
                    position: "absolute",
                    bottom: -5,
                    left: tip.x - left,
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid rgba(24, 24, 27, 0.96)",
                    zIndex: 10000,
                }}
            />

            {/* Invisible bridge to prevent mouseout when moving slowly over the gap */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -12,
                    height: 12,
                    background: "transparent",
                    pointerEvents: "auto",
                }}
            />
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonHeatmap: React.FC = () => (
    <div style={{ borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--border)", padding: "1rem 1.25rem", marginTop: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div style={{ width: 200, height: 18, borderRadius: 4, background: COLOR_EMPTY, opacity: 0.4 }} />
            <div style={{ width: 260, height: 18, borderRadius: 4, background: COLOR_EMPTY, opacity: 0.4 }} />
        </div>
        <div style={{ display: "flex", gap: MONTH_GAP }}>
            {Array.from({ length: 12 }).map((_, mi) => (
                <div key={mi} style={{ display: "flex", gap: WEEK_GAP }}>
                    {Array.from({ length: 4 }).map((_, wi) => (
                        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: WEEK_GAP }}>
                            {Array.from({ length: 7 }).map((_, di) => (
                                <div key={di} style={{ width: CELL, height: CELL, borderRadius: 2, background: COLOR_EMPTY, opacity: 0.35 }} />
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
    data: HeatmapData | null;
    loading: boolean;
}

const ActivityHeatmap: React.FC<Props> = ({ data, loading }) => {
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState<string>("Current");
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Available years for the dropdown
    const years = useMemo(() => {
        if (!data) return [];
        const startY = parseLocal(data.start_date).getFullYear();
        const endY = parseLocal(data.end_date).getFullYear();
        const list: string[] = [];
        for (let y = endY; y >= startY; y--) list.push(String(y));
        return list;
    }, [data]);

    // ── Build month blocks ──────────────────────────────────────────────────────
    const { monthBlocks, submissionsCount } = useMemo(() => {
        if (!data) return { monthBlocks: [], submissionsCount: 0 };

        // Build a Map<dateStr, ActiveDateEntry> for O(1) lookup.
        // Defensively handles both the old API format (active_dates: string[])
        // and the new format (active_dates: ActiveDateEntry[]) so that a stale
        // backend still renders the heatmap correctly (just without verse info).
        const activeMap = new Map<string, ActiveDateEntry>(
            (data.active_dates as unknown as Array<string | ActiveDateEntry>).map(e => {
                if (typeof e === "string") {
                    // Old API format — no shlok/chapter/verse info available
                    return [e, { date: e, shlok_count: 0, chapter: 0, verse: 0 } as ActiveDateEntry];
                }
                return [e.date, e];
            })
        );

        const today = parseLocal(data.end_date);

        // Determine date range
        let rangeStart: Date;
        let rangeEnd: Date;

        if (selectedYear === "Current") {
            // Go back 1 year from today
            rangeEnd = new Date(today);
            rangeStart = new Date(today);
            rangeStart.setFullYear(rangeStart.getFullYear() - 1);
            rangeStart.setDate(rangeStart.getDate() + 1);
        } else {
            const year = Number(selectedYear);
            rangeStart = new Date(year, 0, 1);
            rangeEnd = new Date(year, 11, 31);
        }

        // ── Group dates by month ────────────────────────────────────────────────
        const monthsData: Array<{ year: number; month: number; days: Date[] }> = [];
        const cursor = new Date(rangeStart);

        while (cursor <= rangeEnd) {
            const m = cursor.getMonth();
            const y = cursor.getFullYear();
            const last = monthsData[monthsData.length - 1];

            if (!last || last.month !== m || last.year !== y) {
                monthsData.push({ year: y, month: m, days: [] });
            }
            monthsData[monthsData.length - 1].days.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }

        // ── Convert each month into a block of 7-cell columns ───────────────────
        let totalActive = 0;
        const monthBlocks: MonthBlock[] = [];

        monthsData.forEach((md) => {
            const columns: Cell[][] = [];
            let col: Cell[] = [];

            // Pad the FIRST column: invisible cells before the first day's DOW
            const firstDow = md.days[0].getDay(); // 0=Sun, 1=Mon, ...
            for (let i = 0; i < firstDow; i++) {
                col.push({ date: "", active: false, visible: false, isFuture: false, chapter: 0, verse: 0, shlokCount: 0 });
            }

            // Fill in real day cells
            md.days.forEach((day) => {
                const ds = toDateStr(day);
                const isFuture = day > today;
                const entry = activeMap.get(ds);
                const active = !isFuture && !!entry;
                if (active) totalActive++;

                col.push({
                    date: ds,
                    active,
                    visible: true,
                    isFuture,
                    chapter: entry?.chapter ?? 0,
                    verse: entry?.verse ?? 0,
                    shlokCount: entry?.shlok_count ?? 0,
                });

                // Column full → push and start a new one
                if (col.length === 7) {
                    columns.push(col);
                    col = [];
                }
            });

            // Pad the LAST column: invisible cells after the last day's DOW
            if (col.length > 0) {
                while (col.length < 7) {
                    col.push({ date: "", active: false, visible: false, isFuture: false, chapter: 0, verse: 0, shlokCount: 0 });
                }
                columns.push(col);
            }

            monthBlocks.push({
                label: MONTH_NAMES[md.month],
                columns,
            });
        });

        return { monthBlocks, submissionsCount: totalActive };
    }, [data, selectedYear]);

    // ── Tooltip handlers ────────────────────────────────────────────────────────
    const handleCellEnter = useCallback((cell: Cell, e: React.MouseEvent) => {
        if (!cell.visible) return;
        if (hideTimer.current) clearTimeout(hideTimer.current);
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            dateLabel: labelDate(cell.date),
            active: cell.active,
            isFuture: cell.isFuture,
            chapter: cell.chapter,
            verse: cell.verse,
            shlokCount: cell.shlokCount,
            x: rect.left + rect.width / 2,
            y: rect.top,
        });
    }, []);

    const handleCellLeave = useCallback(() => {
        hideTimer.current = setTimeout(() => setTooltip(null), 400);
    }, []);

    // ── Click handler — navigate to /shloks/chapter/verse ──────────────────────
    const handleCellClick = useCallback((cell: Cell) => {
        if (!cell.active || cell.chapter === 0 || cell.verse === 0) return;
        navigate(`/shloks/${cell.chapter}/${cell.verse}`);
    }, [navigate]);

    // ── Guards ──────────────────────────────────────────────────────────────────
    if (loading) return <SkeletonHeatmap />;
    if (!data) return null;

    return (
        <>
            <style>{`
                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-96%) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(-100%) scale(1);
                    }
                }
                .heatmap-tooltip-content:hover {
                    border-color: rgba(255, 107, 0, 0.5) !important;
                    box-shadow: 0 12px 30px -4px rgba(255, 107, 0, 0.15), 0 0 0 1px rgba(255, 107, 0, 0.2) !important;
                }
            `}</style>

            <Tooltip
                tip={tooltip}
                onMouseEnter={() => {
                    if (hideTimer.current) clearTimeout(hideTimer.current);
                }}
                onMouseLeave={handleCellLeave}
                onNavigate={(chapter, verse) => navigate(`/shloks/${chapter}/${verse}`)}
            />

            <div
                style={{
                    borderRadius: 12,
                    background: "var(--surface-warm)",
                    border: "1px solid var(--border)",
                    padding: "1rem 1.25rem",
                    marginTop: "1.25rem",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                {/* ── Header ───────────────────────────────────────────────────────── */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                    }}
                >
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                            {submissionsCount}
                        </strong>{" "}
                        {selectedYear === "Current"
                            ? "shloks read in the past year"
                            : `shloks read in ${selectedYear}`}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Total active days{" "}
                            <strong style={{ color: "var(--text-primary)" }}>{data.total_active_days}</strong>
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Max streak{" "}
                            <strong style={{ color: "var(--text-primary)" }}>{data.max_streak}</strong>
                        </span>

                        {/* Year selector */}
                        <div style={{ position: "relative" }}>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                style={{
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    background: "rgba(0,0,0,0.06)",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "5px 26px 5px 10px",
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    cursor: "pointer",
                                    outline: "none",
                                }}
                            >
                                <option value="Current">Current</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <div
                                style={{
                                    position: "absolute",
                                    right: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                    borderLeft: "4px solid transparent",
                                    borderRight: "4px solid transparent",
                                    borderTop: "4px solid var(--text-muted)",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Heatmap grid ─────────────────────────────────────────────────── */}
                <div style={{ overflowX: "auto", overflowY: "visible", WebkitOverflowScrolling: "touch" as any }}>
                    <div style={{ display: "inline-flex", alignItems: "flex-start" }}>

                        {/* DOW labels column */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: WEEK_GAP,
                                marginRight: 6,
                                flexShrink: 0,
                            }}
                        >
                            {DOW_LABELS.map((label, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: CELL,
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: "0.6rem",
                                        color: "var(--text-muted)",
                                        userSelect: "none",
                                        lineHeight: 1,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Month blocks — each block is a group of week columns */}
                        <div style={{ display: "flex", gap: MONTH_GAP }}>
                            {monthBlocks.map((block, mi) => (
                                <div
                                    key={mi}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                >
                                    {/* Week columns for this month */}
                                    <div style={{ display: "flex", gap: WEEK_GAP }}>
                                        {block.columns.map((col, ci) => (
                                            <div
                                                key={ci}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: WEEK_GAP,
                                                }}
                                            >
                                                {col.map((cell, ri) => {
                                                    // Clickable = active + known chapter/verse
                                                    const isClickable = cell.active && cell.chapter > 0 && cell.verse > 0;
                                                    return (
                                                        <div
                                                            key={ri}
                                                            style={{
                                                                width: CELL,
                                                                height: CELL,
                                                                borderRadius: 2,
                                                                background: !cell.visible
                                                                    ? "transparent"
                                                                    : cell.active
                                                                        ? COLOR_ACTIVE
                                                                        : COLOR_EMPTY,
                                                                opacity: !cell.visible
                                                                    ? 0
                                                                    : cell.isFuture
                                                                        ? 0.5
                                                                        : 1,
                                                                cursor: isClickable
                                                                    ? "pointer"
                                                                    : cell.visible
                                                                        ? "default"
                                                                        : "default",
                                                                // Subtle ring on hover for clickable cells
                                                                transition: "transform 0.1s ease, box-shadow 0.1s ease",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                handleCellEnter(cell, e);
                                                                if (isClickable) {
                                                                    (e.currentTarget as HTMLElement).style.transform = "scale(1.4)";
                                                                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1.5px rgba(255,107,0,0.6)";
                                                                    (e.currentTarget as HTMLElement).style.borderRadius = "3px";
                                                                    (e.currentTarget as HTMLElement).style.zIndex = "2";
                                                                    (e.currentTarget as HTMLElement).style.position = "relative";
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                handleCellLeave();
                                                                (e.currentTarget as HTMLElement).style.transform = "";
                                                                (e.currentTarget as HTMLElement).style.boxShadow = "";
                                                                (e.currentTarget as HTMLElement).style.zIndex = "";
                                                                (e.currentTarget as HTMLElement).style.position = "";
                                                            }}
                                                            onClick={() => handleCellClick(cell)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Month label centered below the columns */}
                                    <div
                                        style={{
                                            fontSize: "0.62rem",
                                            fontWeight: 500,
                                            color: "var(--text-muted)",
                                            userSelect: "none",
                                            marginTop: 6,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {block.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* ── Legend ────────────────────────────────────────────────────────── */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: "0.6rem" }}>
                    <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginRight: 2 }}>No activity</span>
                    <div style={{ width: CELL, height: CELL, borderRadius: 2, background: COLOR_EMPTY }} />
                    <div style={{ width: CELL, height: CELL, borderRadius: 2, background: COLOR_ACTIVE }} />
                    <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: 2 }}>Shlok read</span>
                </div>
            </div>
        </>
    );
};

export default ActivityHeatmap;
