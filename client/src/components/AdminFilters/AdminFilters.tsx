/**
 * AdminFilters – reusable filter components for Admin pages.
 *
 * Senior UI/UX Architecture:
 *  - Master "All Filters" Mobile Bottom Sheet with 1-tap controls
 *  - High-touch individual bottom sheets on mobile, floating popovers on desktop
 *  - Quick preset chips (1-tap apply) for counts and date ranges
 *  - Custom touch-optimized Email Status picker (replaces raw <select>)
 *  - Active dismissible chips with Clear All action
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CalendarPicker,
  DateRangeValue,
  DEFAULT_DATE_PRESETS,
  fmtDisplay,
} from "../CalendarPicker/CalendarPicker";
import { FixedPopover } from "./FixedPopover";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export type DateRange = DateRangeValue;

export interface CountFilterState {
  mode: "any" | "gte" | "lte" | "between";
  min: string;
  max: string;
}

export type ShlokCount = CountFilterState;

export type EmailStatusOption = "all" | "subscribed" | "unsubscribed";

/* ─────────────────────────────────────────────
   Re-export CalendarPicker as DateRangePicker
───────────────────────────────────────────── */
export const DateRangePicker = CalendarPicker;

/* ─────────────────────────────────────────────
   Generic NumberRangeFilter
───────────────────────────────────────────── */
interface NumberRangeFilterProps {
  label: string;
  icon: string;
  maxLimit?: number;
  presets?: { label: string; value: CountFilterState }[];
  value: CountFilterState;
  onChange: (v: CountFilterState) => void;
}

const MODE_LABELS: Record<CountFilterState["mode"], string> = {
  any: "Any",
  gte: "≥ (min)",
  lte: "≤ (max)",
  between: "Range",
};

export const NumberRangeFilter: React.FC<NumberRangeFilterProps> = ({
  label,
  icon,
  maxLimit = 700,
  presets,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hasValue = value.mode !== "any";
  const displayLabel =
    value.mode === "gte"
      ? `${label} ≥ ${value.min}`
      : value.mode === "lte"
      ? `${label} ≤ ${value.max}`
      : value.mode === "between"
      ? `${label} ${value.min}–${value.max}`
      : label;

  const clear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange({ mode: "any", min: "", max: "" });
    setOpen(false);
  };

  const renderFilterContent = () => (
    <>
      {/* Quick Presets if provided */}
      {presets && presets.length > 0 && (
        <div style={{ marginBottom: "0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Quick Presets
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>1-tap apply</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              paddingBottom: "2px",
            }}
          >
            {presets.map(p => {
              const isSelected =
                value.mode === p.value.mode &&
                value.min === p.value.min &&
                value.max === p.value.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    onChange(p.value);
                    setOpen(false);
                  }}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "18px",
                    border: isSelected ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                    background: isSelected ? "rgba(255,107,0,0.12)" : "#F9F6F0",
                    color: isSelected ? "var(--bhagwa)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: isSelected ? 700 : 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div style={{ height: "1px", background: "var(--border)", margin: "0.75rem 0" }} />
        </div>
      )}

      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "0.5rem",
        }}
      >
        Select Mode
      </p>

      {/* Mode selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1rem" }}>
        {(["any", "gte", "lte", "between"] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onChange({ ...value, mode: m })}
            style={{
              fontSize: "0.76rem",
              padding: "0.35rem 0.8rem",
              borderRadius: "20px",
              border: value.mode === m ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
              background: value.mode === m ? "rgba(255,107,0,0.12)" : "#F9F6F0",
              color: value.mode === m ? "var(--bhagwa)" : "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: value.mode === m ? 700 : 500,
              transition: "all 0.1s ease",
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {value.mode !== "any" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: value.mode === "between" ? "1fr 1fr" : "1fr",
            gap: "0.6rem",
            marginBottom: "1rem",
          }}
        >
          {(value.mode === "gte" || value.mode === "between") && (
            <div>
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "0.3rem",
                  fontWeight: 600,
                }}
              >
                {value.mode === "between" ? "From (Min)" : "Min count"}
              </label>
              <input
                type="number"
                min={0}
                max={maxLimit}
                value={value.min}
                onChange={e => onChange({ ...value, min: e.target.value })}
                placeholder="e.g. 5"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "#FFFBF5",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
          {(value.mode === "lte" || value.mode === "between") && (
            <div>
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "0.3rem",
                  fontWeight: 600,
                }}
              >
                {value.mode === "between" ? "To (Max)" : "Max count"}
              </label>
              <input
                type="number"
                min={0}
                max={maxLimit}
                value={value.max}
                onChange={e => onChange({ ...value, max: e.target.value })}
                placeholder="e.g. 100"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "#FFFBF5",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            flex: 1,
            padding: "0.65rem",
            borderRadius: "10px",
            background: "var(--bhagwa)",
            color: "white",
            border: "none",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(255,107,0,0.25)",
          }}
        >
          Apply Filter
        </button>
        <button
          type="button"
          onClick={clear}
          style={{
            padding: "0.65rem 1rem",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
    </>
  );

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`admin-filter-chip-btn ${hasValue ? "is-active" : ""}`}
      >
        <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{icon}</span>
        <span className="admin-filter-chip-label">
          {displayLabel}
        </span>
        {hasValue && (
          <span
            onClick={clear}
            style={{ marginLeft: "0.1rem", fontSize: "0.82rem", opacity: 0.8, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </span>
        )}
      </button>

      <FixedPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={ref}
        desktopWidth={290}
        mobileTitle={<>{icon} Filter by {label}</>}
      >
        {renderFilterContent()}
      </FixedPopover>
    </div>
  );
};

const SHLOK_PRESETS = [
  { label: "Any", value: { mode: "any" as const, min: "", max: "" } },
  { label: "1+ Started", value: { mode: "gte" as const, min: "1", max: "" } },
  { label: "10+ Active", value: { mode: "gte" as const, min: "10", max: "" } },
  { label: "50+ Devoted", value: { mode: "gte" as const, min: "50", max: "" } },
  { label: "100+ Advanced", value: { mode: "gte" as const, min: "100", max: "" } },
  { label: "700 Complete", value: { mode: "gte" as const, min: "700", max: "" } },
];

export const ShlokCountFilter: React.FC<{ value: CountFilterState; onChange: (v: CountFilterState) => void }> = ({
  value,
  onChange,
}) => (
  <NumberRangeFilter
    label="Shloks"
    icon="📿"
    maxLimit={700}
    presets={SHLOK_PRESETS}
    value={value}
    onChange={onChange}
  />
);

const LOGIN_PRESETS = [
  { label: "Any", value: { mode: "any" as const, min: "", max: "" } },
  { label: "1+ Logged In", value: { mode: "gte" as const, min: "1", max: "" } },
  { label: "5+ Regular", value: { mode: "gte" as const, min: "5", max: "" } },
  { label: "10+ Frequent", value: { mode: "gte" as const, min: "10", max: "" } },
  { label: "25+ Loyal", value: { mode: "gte" as const, min: "25", max: "" } },
  { label: "50+ Champion", value: { mode: "gte" as const, min: "50", max: "" } },
];

export const LoggedCountFilter: React.FC<{ value: CountFilterState; onChange: (v: CountFilterState) => void }> = ({
  value,
  onChange,
}) => (
  <NumberRangeFilter
    label="Logins"
    icon="🔢"
    maxLimit={700}
    presets={LOGIN_PRESETS}
    value={value}
    onChange={onChange}
  />
);

/* ─────────────────────────────────────────────
   EmailStatusFilter (Custom UI replacing raw <select>)
───────────────────────────────────────────── */
interface EmailStatusProps {
  value: EmailStatusOption;
  onChange: (v: EmailStatusOption) => void;
}

export const EmailStatusFilter: React.FC<EmailStatusProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasValue = value !== "all";

  const options: { id: EmailStatusOption; label: string; icon: string; desc: string }[] = [
    { id: "all", label: "All Users", icon: "📧", desc: "Show all users regardless of email status" },
    { id: "subscribed", label: "Subscribed", icon: "✅", desc: "Users actively receiving scheduled shlok broadcasts" },
    { id: "unsubscribed", label: "Unsubscribed", icon: "🚫", desc: "Users who opted out of email broadcasts" },
  ];

  const currentOpt = options.find(o => o.id === value) || options[0];

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`admin-filter-chip-btn ${hasValue ? "is-active" : ""}`}
      >
        <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{currentOpt.icon}</span>
        <span className="admin-filter-chip-label">
          {value === "all" ? "Email Status" : currentOpt.label}
        </span>
        {hasValue && (
          <span
            onClick={e => {
              e.stopPropagation();
              onChange("all");
            }}
            style={{ marginLeft: "0.1rem", fontSize: "0.82rem", opacity: 0.8, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </span>
        )}
      </button>

      <FixedPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={ref}
        desktopWidth={270}
        mobileTitle={<>📧 Filter by Email Subscription</>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.35rem",
            }}
          >
            Email Subscription
          </p>
          {options.map(opt => {
            const isSelected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.65rem",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "10px",
                  border: isSelected ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                  background: isSelected ? "rgba(255,107,0,0.08)" : "#FFFFFF",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.1s ease",
                }}
              >
                <span style={{ fontSize: "1.1rem", lineHeight: 1.2 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.84rem",
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? "var(--bhagwa)" : "var(--text-primary)",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.35 }}>
                    {opt.desc}
                  </p>
                </div>
                {isSelected && (
                  <span style={{ color: "var(--bhagwa)", fontWeight: 800, fontSize: "0.9rem" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </FixedPopover>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Active filter chip list
───────────────────────────────────────────── */
interface ChipProps {
  label: string;
  onRemove: () => void;
}
const FilterChip: React.FC<ChipProps> = ({ label, onRemove }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.22rem 0.65rem",
      borderRadius: "20px",
      fontSize: "0.72rem",
      fontWeight: 600,
      background: "rgba(255,107,0,0.1)",
      color: "var(--bhagwa)",
      border: "1px solid rgba(255,107,0,0.25)",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}
  >
    {label}
    <span onClick={onRemove} style={{ cursor: "pointer", fontSize: "0.85rem", lineHeight: 1 }}>
      ×
    </span>
  </span>
);

/* ─────────────────────────────────────────────
   Master Filter Drawer (Senior UI/UX for Mobile)
───────────────────────────────────────────── */
interface MasterFilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: UsersFilterState;
  onChange: (v: UsersFilterState) => void;
  activeCount: number;
}

const MasterFilterSheet: React.FC<MasterFilterSheetProps> = ({
  open,
  onClose,
  value,
  onChange,
  activeCount,
}) => {
  const [draft, setDraft] = useState<UsersFilterState>(value);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setDraft(value);
      setIsClosing(false);
    }
  }, [open, value]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const triggerClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 260);
  }, [isClosing, onClose]);

  // Escape key closes
  useEffect(() => {
    if (!open || isClosing) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") triggerClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, isClosing, triggerClose]);

  const isVisible = open || isClosing;
  if (!isVisible) return null;

  const handleApply = () => {
    onChange(draft);
    triggerClose();
  };

  const handleReset = () => {
    const empty = defaultUsersFilter();
    setDraft(empty);
    onChange(empty);
    triggerClose();
  };

  return createPortal(
    <div
      className={`premium-modal-backdrop ${isClosing ? "premium-modal-backdrop-exit" : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
      onClick={triggerClose}
    >
      <div
        className={`premium-bottom-sheet ${isClosing ? "premium-bottom-sheet-exit" : ""}`}
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#FFFFFF",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
          boxSizing: "border-box",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div
          style={{
            width: "36px",
            height: "4px",
            background: "#E4D5C5",
            borderRadius: "2px",
            margin: "0.85rem auto 0.4rem",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.6rem 1.25rem 0.85rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>
              Filter Users
            </span>
            {activeCount > 0 && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  background: "var(--bhagwa)",
                  color: "white",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "12px",
                }}
              >
                {activeCount} active
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc2626",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reset all
              </button>
            )}
            <button
              type="button"
              onClick={triggerClose}
              aria-label="Close filters"
              title="Close filters"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(145deg, #FFFDF8 0%, #FFF5EB 100%)",
                border: "1.5px solid rgba(255, 107, 0, 0.3)",
                color: "var(--bhagwa)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                boxShadow: "0 2px 6px rgba(255, 107, 0, 0.1)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Filter Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Section: Email Status */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.5rem" }}>
              📧 Email Subscription Status
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.45rem" }}>
              {(["all", "subscribed", "unsubscribed"] as const).map(st => {
                const isSel = draft.emailStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDraft({ ...draft, emailStatus: st })}
                    style={{
                      padding: "0.55rem 0.4rem",
                      borderRadius: "10px",
                      border: isSel ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                      background: isSel ? "rgba(255,107,0,0.12)" : "#F9F6F0",
                      color: isSel ? "var(--bhagwa)" : "var(--text-secondary)",
                      fontSize: "0.78rem",
                      fontWeight: isSel ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {st === "all" ? "All" : st === "subscribed" ? "Subscribed ✅" : "Unsubscribed 🚫"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Shloks Read */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                📿 Shloks Read
              </label>
              {draft.shlokCount.mode !== "any" && (
                <span
                  onClick={() => setDraft({ ...draft, shlokCount: { mode: "any", min: "", max: "" } })}
                  style={{ fontSize: "0.75rem", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
                >
                  Clear
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px", marginBottom: "0.5rem" }}>
              {SHLOK_PRESETS.map(p => {
                const isSel =
                  draft.shlokCount.mode === p.value.mode &&
                  draft.shlokCount.min === p.value.min &&
                  draft.shlokCount.max === p.value.max;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDraft({ ...draft, shlokCount: p.value })}
                    style={{
                      padding: "0.35rem 0.7rem",
                      borderRadius: "16px",
                      border: isSel ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                      background: isSel ? "rgba(255,107,0,0.12)" : "#F9F6F0",
                      color: isSel ? "var(--bhagwa)" : "var(--text-secondary)",
                      fontSize: "0.74rem",
                      fontWeight: isSel ? 700 : 500,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Logins Count */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                🔢 Logins Count
              </label>
              {draft.loggedCount.mode !== "any" && (
                <span
                  onClick={() => setDraft({ ...draft, loggedCount: { mode: "any", min: "", max: "" } })}
                  style={{ fontSize: "0.75rem", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
                >
                  Clear
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px", marginBottom: "0.5rem" }}>
              {LOGIN_PRESETS.map(p => {
                const isSel =
                  draft.loggedCount.mode === p.value.mode &&
                  draft.loggedCount.min === p.value.min &&
                  draft.loggedCount.max === p.value.max;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDraft({ ...draft, loggedCount: p.value })}
                    style={{
                      padding: "0.35rem 0.7rem",
                      borderRadius: "16px",
                      border: isSel ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                      background: isSel ? "rgba(255,107,0,0.12)" : "#F9F6F0",
                      color: isSel ? "var(--bhagwa)" : "var(--text-secondary)",
                      fontSize: "0.74rem",
                      fontWeight: isSel ? 700 : 500,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Last Login Date */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                📅 Last Login Date
              </label>
              {(draft.lastLogin.from || draft.lastLogin.to) && (
                <span
                  onClick={() => setDraft({ ...draft, lastLogin: { from: "", to: "" } })}
                  style={{ fontSize: "0.75rem", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
                >
                  Clear
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px" }}>
              {[
                { label: "Any time", from: "", to: "" },
                ...DEFAULT_DATE_PRESETS.slice(0, 4),
              ].map(p => {
                const isSel = draft.lastLogin.from === p.from && draft.lastLogin.to === p.to;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDraft({ ...draft, lastLogin: { from: p.from, to: p.to } })}
                    style={{
                      padding: "0.35rem 0.7rem",
                      borderRadius: "16px",
                      border: isSel ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                      background: isSel ? "rgba(255,107,0,0.12)" : "#F9F6F0",
                      color: isSel ? "var(--bhagwa)" : "var(--text-secondary)",
                      fontSize: "0.74rem",
                      fontWeight: isSel ? 700 : 500,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Signed Up Date */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                📅 Joined Date
              </label>
              {(draft.signedUp.from || draft.signedUp.to) && (
                <span
                  onClick={() => setDraft({ ...draft, signedUp: { from: "", to: "" } })}
                  style={{ fontSize: "0.75rem", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
                >
                  Clear
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px" }}>
              {[
                { label: "Any time", from: "", to: "" },
                ...DEFAULT_DATE_PRESETS.slice(0, 4),
              ].map(p => {
                const isSel = draft.signedUp.from === p.from && draft.signedUp.to === p.to;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDraft({ ...draft, signedUp: { from: p.from, to: p.to } })}
                    style={{
                      padding: "0.35rem 0.7rem",
                      borderRadius: "16px",
                      border: isSel ? "1.5px solid var(--bhagwa)" : "1px solid var(--border)",
                      background: isSel ? "rgba(255,107,0,0.12)" : "#F9F6F0",
                      color: isSel ? "var(--bhagwa)" : "var(--text-secondary)",
                      fontSize: "0.74rem",
                      fontWeight: isSel ? 700 : 500,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div
          style={{
            padding: "0.85rem 1.25rem 1.15rem",
            borderTop: "1px solid var(--border)",
            background: "#FFFBF5",
            display: "flex",
            gap: "0.6rem",
          }}
        >
          <button
            type="button"
            onClick={handleApply}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "12px",
              background: "var(--bhagwa)",
              color: "white",
              border: "none",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(255,107,0,0.25)",
            }}
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={triggerClose}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "#FFFFFF",
              color: "var(--text-secondary)",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─────────────────────────────────────────────
   UsersFilterBar
───────────────────────────────────────────── */
export interface UsersFilterState {
  shlokCount: CountFilterState;
  loggedCount: CountFilterState;
  emailStatus: EmailStatusOption;
  lastLogin: DateRange;
  signedUp: DateRange;
}

export const defaultUsersFilter = (): UsersFilterState => ({
  shlokCount: { mode: "any", min: "", max: "" },
  loggedCount: { mode: "any", min: "", max: "" },
  emailStatus: "all",
  lastLogin: { from: "", to: "" },
  signedUp: { from: "", to: "" },
});

interface UFBProps {
  value: UsersFilterState;
  onChange: (v: UsersFilterState) => void;
  activeCount: number;
}

export const UsersFilterBar: React.FC<UFBProps> = ({ value, onChange, activeCount }) => {
  const [masterOpen, setMasterOpen] = useState(false);
  const clearAll = () => onChange(defaultUsersFilter());

  // Compute chips
  const chips: { label: string; clear: () => void }[] = [];

  if (value.shlokCount.mode !== "any") {
    const sc = value.shlokCount;
    chips.push({
      label:
        sc.mode === "gte"
          ? `Shlok ≥ ${sc.min}`
          : sc.mode === "lte"
          ? `Shlok ≤ ${sc.max}`
          : `Shlok ${sc.min}–${sc.max}`,
      clear: () => onChange({ ...value, shlokCount: { mode: "any", min: "", max: "" } }),
    });
  }

  if (value.loggedCount.mode !== "any") {
    const lc = value.loggedCount;
    chips.push({
      label:
        lc.mode === "gte"
          ? `Logins ≥ ${lc.min}`
          : lc.mode === "lte"
          ? `Logins ≤ ${lc.max}`
          : `Logins ${lc.min}–${lc.max}`,
      clear: () => onChange({ ...value, loggedCount: { mode: "any", min: "", max: "" } }),
    });
  }

  if (value.emailStatus !== "all") {
    chips.push({
      label: value.emailStatus === "subscribed" ? "Email: Subscribed" : "Email: Unsubscribed",
      clear: () => onChange({ ...value, emailStatus: "all" }),
    });
  }

  if (value.lastLogin.from || value.lastLogin.to) {
    const fromStr = value.lastLogin.from ? fmtDisplay(value.lastLogin.from) : "…";
    const toStr = value.lastLogin.to ? fmtDisplay(value.lastLogin.to) : "…";
    chips.push({
      label: value.lastLogin.from === value.lastLogin.to ? `Login: ${fromStr}` : `Login: ${fromStr} → ${toStr}`,
      clear: () => onChange({ ...value, lastLogin: { from: "", to: "" } }),
    });
  }

  if (value.signedUp.from || value.signedUp.to) {
    const fromStr = value.signedUp.from ? fmtDisplay(value.signedUp.from) : "…";
    const toStr = value.signedUp.to ? fmtDisplay(value.signedUp.to) : "…";
    chips.push({
      label: value.signedUp.from === value.signedUp.to ? `Joined: ${fromStr}` : `Joined: ${fromStr} → ${toStr}`,
      clear: () => onChange({ ...value, signedUp: { from: "", to: "" } }),
    });
  }

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* Auto-managing responsive grid: 2x3 on mobile (<520px), 3x2 on tablet (520-899px), 6x1 on desktop (>=900px) */}
      <div className="admin-filters-grid">
        {/* Master "All Filters" button */}
        <button
          type="button"
          onClick={() => setMasterOpen(true)}
          className={`admin-filter-chip-btn ${activeCount > 0 ? "is-master-active" : ""}`}
        >
          <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>⚡</span>
          <span className="admin-filter-chip-label">Filters</span>
          {activeCount > 0 && (
            <span
              style={{
                background: "#FFFFFF",
                color: "var(--bhagwa)",
                borderRadius: "10px",
                fontSize: "0.68rem",
                padding: "0.05rem 0.35rem",
                fontWeight: 800,
                marginLeft: "0.1rem",
                flexShrink: 0,
              }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {/* Individual Quick Filters */}
        <EmailStatusFilter
          value={value.emailStatus}
          onChange={es => onChange({ ...value, emailStatus: es })}
        />
        <CalendarPicker
          label="Last Login"
          value={value.lastLogin}
          onChange={r => onChange({ ...value, lastLogin: r })}
        />
        <CalendarPicker
          label="Signed Up"
          value={value.signedUp}
          onChange={r => onChange({ ...value, signedUp: r })}
        />
        <ShlokCountFilter
          value={value.shlokCount}
          onChange={sc => onChange({ ...value, shlokCount: sc })}
        />
        <LoggedCountFilter
          value={value.loggedCount}
          onChange={lc => onChange({ ...value, loggedCount: lc })}
        />
      </div>

      {/* Active dismissible chips */}
      {chips.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.4rem",
            marginTop: "0.6rem",
            paddingTop: "0.5rem",
            borderTop: "1px dashed var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginRight: "0.2rem",
            }}
          >
            Active:
          </span>
          {chips.map((ch, i) => (
            <FilterChip key={i} label={ch.label} onRemove={ch.clear} />
          ))}
          <button
            type="button"
            onClick={clearAll}
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "14px",
              fontSize: "0.72rem",
              fontWeight: 600,
              border: "1px solid var(--border)",
              background: "#FFFFFF",
              color: "var(--text-muted)",
              cursor: "pointer",
              marginLeft: "auto",
              transition: "all 0.15s ease",
            }}
          >
            Clear all ({activeCount})
          </button>
        </div>
      )}

      {/* Master Filter Bottom Sheet Modal */}
      <MasterFilterSheet
        open={masterOpen}
        onClose={() => setMasterOpen(false)}
        value={value}
        onChange={onChange}
        activeCount={activeCount}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   SignupFilterBar
───────────────────────────────────────────── */
export interface SignupFilterState {
  dateRange: DateRange;
}
export const defaultSignupFilter = (): SignupFilterState => ({
  dateRange: { from: "", to: "" },
});

interface SFBProps {
  value: SignupFilterState;
  onChange: (v: SignupFilterState) => void;
}

export const SignupFilterBar: React.FC<SFBProps> = ({ value, onChange }) => {
  const hasFilter = !!(value.dateRange.from || value.dateRange.to);
  const fromStr = value.dateRange.from ? fmtDisplay(value.dateRange.from) : "…";
  const toStr = value.dateRange.to ? fmtDisplay(value.dateRange.to) : "…";

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", maxWidth: "340px" }}>
        <CalendarPicker
          label="Attempt Date"
          value={value.dateRange}
          onChange={r => onChange({ dateRange: r })}
        />
        {hasFilter && (
          <button
            type="button"
            onClick={() => onChange(defaultSignupFilter())}
            style={{
              padding: "0.38rem 0.75rem",
              borderRadius: "10px",
              fontSize: "0.78rem",
              border: "1px solid var(--border)",
              background: "#FFFFFF",
              color: "var(--text-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>
      {hasFilter && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>
          <FilterChip
            label={value.dateRange.from === value.dateRange.to ? `Date: ${fromStr}` : `Date: ${fromStr} → ${toStr}`}
            onRemove={() => onChange(defaultSignupFilter())}
          />
        </div>
      )}
    </div>
  );
};
