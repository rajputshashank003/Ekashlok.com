import React, { useMemo, useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeatmapData {
    start_date: string;        // "YYYY-MM-DD" — Jan 1 of join year (from backend)
    end_date: string;          // "YYYY-MM-DD" — today IST (from backend)
    total_active_days: number;
    current_streak: number;
    max_streak: number;
    active_dates: string[];    // sorted ascending ["YYYY-MM-DD", ...]
}

interface Cell {
    date: string;      // "YYYY-MM-DD" or "" for padding
    active: boolean;
    visible: boolean;  // false = padding cell (opacity 0)
    isFuture: boolean;
}

interface MonthBlock {
    label: string;
    columns: Cell[][]; // each column has exactly 7 cells
}

interface TooltipState {
    dateLabel: string;
    active: boolean;
    isFuture: boolean;
    x: number;
    y: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR_EMPTY = "#edd5be";
const COLOR_ACTIVE = "#FF6B00";

// ─── Grid constants ──────────────────────────────────────────────────────────

const CELL = 9.8;
const WEEK_GAP = 3;   // gap between week columns within a month
const MONTH_GAP = 6;   // gap between month blocks

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

const Tooltip: React.FC<{ tip: TooltipState | null }> = ({ tip }) => {
    if (!tip) return null;

    const TOOLTIP_W = 160;
    const left = Math.min(tip.x + 12, window.innerWidth - TOOLTIP_W - 8);
    const top = tip.y - 72;

    const statusLabel = tip.active ? "Shlok read" : tip.isFuture ? "Upcoming" : "No activity";
    const dotColor = tip.active ? COLOR_ACTIVE : tip.isFuture ? "#999" : COLOR_EMPTY;

    return (
        <div
            style={{
                position: "fixed",
                left,
                top,
                zIndex: 9999,
                pointerEvents: "none",
                userSelect: "none",
            }}
        >
            <div
                style={{
                    background: "#1f1f1f",
                    borderRadius: 6,
                    padding: "6px 10px",
                    width: TOOLTIP_W,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
            >
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#e6e6e6", marginBottom: 3 }}>
                    {tip.dateLabel}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.68rem", color: "#aaa", fontWeight: 500 }}>
                        {statusLabel}
                    </span>
                </div>
            </div>
            <div
                style={{
                    width: 0,
                    height: 0,
                    marginLeft: 14,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: "5px solid #1f1f1f",
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

        const activeSet = new Set(data.active_dates);
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
                col.push({ date: "", active: false, visible: false, isFuture: false });
            }

            // Fill in real day cells
            md.days.forEach((day) => {
                const ds = toDateStr(day);
                const isFuture = day > today;
                const active = !isFuture && activeSet.has(ds);
                if (active) totalActive++;

                col.push({ date: ds, active, visible: true, isFuture });

                // Column full → push and start a new one
                if (col.length === 7) {
                    columns.push(col);
                    col = [];
                }
            });

            // Pad the LAST column: invisible cells after the last day's DOW
            if (col.length > 0) {
                while (col.length < 7) {
                    col.push({ date: "", active: false, visible: false, isFuture: false });
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
        setTooltip({
            dateLabel: labelDate(cell.date),
            active: cell.active,
            isFuture: cell.isFuture,
            x: e.clientX,
            y: e.clientY,
        });
    }, []);

    const handleCellLeave = useCallback(() => {
        hideTimer.current = setTimeout(() => setTooltip(null), 80);
    }, []);

    // ── Guards ──────────────────────────────────────────────────────────────────
    if (loading) return <SkeletonHeatmap />;
    if (!data) return null;

    return (
        <>
            <Tooltip tip={tooltip} />

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
                                                {col.map((cell, ri) => (
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
                                                            cursor: cell.visible ? "pointer" : "default",
                                                        }}
                                                        onMouseEnter={(e) => handleCellEnter(cell, e)}
                                                        onMouseLeave={handleCellLeave}
                                                        onMouseMove={(e) => {
                                                            if (tooltip && cell.visible) {
                                                                setTooltip((prev) =>
                                                                    prev ? { ...prev, x: e.clientX, y: e.clientY } : prev
                                                                );
                                                            }
                                                        }}
                                                    />
                                                ))}
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
