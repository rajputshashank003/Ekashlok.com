import React, { useState, useEffect, useRef } from "react";
import { FixedPopover } from "../AdminFilters/FixedPopover";

export interface DateRangeValue {
  from: string; // "YYYY-MM-DD" or ""
  to: string;   // "YYYY-MM-DD" or ""
}

export interface CalendarPreset {
  label: string;
  from: string;
  to: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getTodayStr = () => toDateStr(new Date());

const getDaysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
};

const getMonthsAgoStr = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return toDateStr(d);
};

export const DEFAULT_DATE_PRESETS: CalendarPreset[] = [
  { label: "Today", from: getTodayStr(), to: getTodayStr() },
  { label: "Yesterday", from: getDaysAgoStr(1), to: getDaysAgoStr(1) },
  { label: "Last 7 days", from: getDaysAgoStr(7), to: getTodayStr() },
  { label: "Last 30 days", from: getDaysAgoStr(30), to: getTodayStr() },
  { label: "Last 2 months", from: getMonthsAgoStr(2), to: getTodayStr() },
  { label: "Last 6 months", from: getMonthsAgoStr(6), to: getTodayStr() },
  { label: "This year", from: `${new Date().getFullYear()}-01-01`, to: getTodayStr() },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const fmtDisplay = (s: string) => {
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

interface CalendarPickerProps {
  label: string;
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
  presets?: CalendarPreset[];
  allowFuture?: boolean;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  label,
  value,
  onChange,
  presets = DEFAULT_DATE_PRESETS,
  allowFuture = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Month navigation in calendar
  const initialDate = value.to ? new Date(value.to) : value.from ? new Date(value.from) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Selection states
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Sync draft when opened or external value changes
  useEffect(() => {
    setDraftFrom(value.from);
    setDraftTo(value.to);
    if (value.to) {
      const d = new Date(value.to);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    } else if (value.from) {
      const d = new Date(value.from);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value, open]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const todayStr = getTodayStr();

  // Days in current viewMonth
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayDOW = new Date(viewYear, viewMonth, 1).getDay();

  const handleDateClick = (dateStr: string) => {
    if ((!draftFrom && !draftTo) || (draftFrom && draftTo)) {
      setDraftFrom(dateStr);
      setDraftTo("");
    } else if (draftFrom && !draftTo) {
      if (dateStr < draftFrom) {
        setDraftTo(draftFrom);
        setDraftFrom(dateStr);
      } else {
        setDraftTo(dateStr);
      }
    }
  };

  const applyRange = (f: string, t: string) => {
    onChange({ from: f, to: t });
    setOpen(false);
  };

  const clear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange({ from: "", to: "" });
    setDraftFrom("");
    setDraftTo("");
    setOpen(false);
  };

  const hasValue = Boolean(value.from || value.to);
  const displayLabel =
    value.from && value.to
      ? value.from === value.to
        ? fmtDisplay(value.from)
        : `${fmtDisplay(value.from)} – ${fmtDisplay(value.to)}`
      : value.from
      ? `From ${fmtDisplay(value.from)}`
      : value.to
      ? `Up to ${fmtDisplay(value.to)}`
      : label;

  const renderCalendarContent = () => (
    <>
      {/* Quick Presets Row - Horizontally Scrollable on Mobile */}
      <div style={{ marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            Quick Presets
          </p>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>1-tap apply</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: "3px",
          }}
        >
          {presets.map(p => {
            const isSelected = value.from === p.from && value.to === p.to;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setDraftFrom(p.from);
                  setDraftTo(p.to);
                  applyRange(p.from, p.to);
                }}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.38rem 0.8rem",
                  borderRadius: "20px",
                  border: isSelected ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                  background: isSelected ? "rgba(255,107,0,0.12)" : "#F9F6F0",
                  color: isSelected ? "var(--bhagwa)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: isSelected ? 700 : 600,
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--border)", margin: "0.75rem 0" }} />

      {/* Month & Year Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={handlePrevMonth}
          style={{
            background: "#F5EFE6",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            color: "var(--text-primary)",
            fontWeight: 700,
          }}
        >
          ‹
        </button>
        <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-primary)" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          style={{
            background: "#F5EFE6",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            color: "var(--text-primary)",
            fontWeight: 700,
          }}
        >
          ›
        </button>
      </div>

      {/* Day of Week headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          textAlign: "center",
          marginBottom: "6px",
        }}
      >
        {DAY_NAMES.map(d => (
          <span
            key={d}
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              padding: "2px 0",
            }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "3px",
          textAlign: "center",
          marginBottom: "0.85rem",
        }}
      >
        {/* Blank leading slots */}
        {Array.from({ length: firstDayDOW }).map((_, i) => (
          <div key={`blank-${i}`} style={{ height: "34px" }} />
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isToday = dateStr === todayStr;
          const isFuture = !allowFuture && dateStr > todayStr;

          const effectiveTo = draftTo || (draftFrom && hoverDate && hoverDate > draftFrom ? hoverDate : "");
          const isStart = draftFrom === dateStr;
          const isEnd = draftTo ? draftTo === dateStr : effectiveTo === dateStr;
          const isInRange = draftFrom && effectiveTo && dateStr > draftFrom && dateStr < effectiveTo;

          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => !isFuture && handleDateClick(dateStr)}
              onMouseEnter={() => !isFuture && setHoverDate(dateStr)}
              onMouseLeave={() => setHoverDate(null)}
              style={{
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.82rem",
                fontWeight: isStart || isEnd || isToday ? 800 : 500,
                borderRadius: isStart || isEnd ? "10px" : isInRange ? "4px" : "8px",
                border: isToday && !isStart && !isEnd ? "1.5px solid var(--bhagwa)" : "none",
                background:
                  isStart || isEnd
                    ? "var(--bhagwa)"
                    : isInRange
                    ? "rgba(255,107,0,0.14)"
                    : "transparent",
                color:
                  isStart || isEnd
                    ? "#ffffff"
                    : isFuture
                    ? "rgba(0,0,0,0.22)"
                    : isInRange
                    ? "var(--bhagwa)"
                    : "var(--text-primary)",
                cursor: isFuture ? "not-allowed" : "pointer",
                transition: "all 0.1s ease",
                padding: 0,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Date Range Summary Card (Replaces clumsy native input fields) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FFFBF5",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "0.6rem 0.85rem",
          marginBottom: "0.85rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
            Start Date
          </span>
          <span style={{ fontSize: "0.86rem", fontWeight: 700, color: draftFrom ? "var(--bhagwa)" : "var(--text-muted)" }}>
            {draftFrom ? fmtDisplay(draftFrom) : "Tap calendar"}
          </span>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "0 0.5rem" }}>→</span>
        <div style={{ flex: 1, textAlign: "right" }}>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
            End Date
          </span>
          <span style={{ fontSize: "0.86rem", fontWeight: 700, color: draftTo ? "var(--bhagwa)" : "var(--text-muted)" }}>
            {draftTo ? fmtDisplay(draftTo) : draftFrom ? fmtDisplay(draftFrom) : "Tap calendar"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => applyRange(draftFrom, draftTo || draftFrom)}
          disabled={!draftFrom && !draftTo}
          style={{
            flex: 1,
            padding: "0.7rem",
            borderRadius: "12px",
            background: (!draftFrom && !draftTo) ? "#E5E7EB" : "var(--bhagwa)",
            color: (!draftFrom && !draftTo) ? "#9CA3AF" : "white",
            border: "none",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: (!draftFrom && !draftTo) ? "not-allowed" : "pointer",
            boxShadow: (!draftFrom && !draftTo) ? "none" : "0 4px 14px rgba(255,107,0,0.25)",
            transition: "all 0.15s ease",
          }}
        >
          {draftFrom && draftTo && draftFrom !== draftTo
            ? `Apply (${fmtDisplay(draftFrom)} – ${fmtDisplay(draftTo)})`
            : draftFrom
            ? `Apply (${fmtDisplay(draftFrom)})`
            : "Select Dates"}
        </button>
        <button
          type="button"
          onClick={clear}
          style={{
            padding: "0.7rem 1.1rem",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "#FFFFFF",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Reset
        </button>
      </div>
    </>
  );

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`admin-filter-chip-btn ${hasValue ? "is-active" : ""}`}
      >
        <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>📅</span>
        <span className="admin-filter-chip-label">
          {displayLabel}
        </span>
        {hasValue && (
          <span
            onClick={clear}
            title="Clear filter"
            style={{
              marginLeft: "0.1rem",
              fontSize: "0.82rem",
              opacity: 0.8,
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </span>
        )}
      </button>

      {/* Popover / Bottom Sheet portal */}
      <FixedPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={containerRef}
        desktopWidth={330}
        mobileTitle={<>📅 {label}</>}
      >
        {renderCalendarContent()}
      </FixedPopover>
    </div>
  );
};
