import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export interface FixedPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  desktopWidth?: number | string;
  mobileTitle?: React.ReactNode;
}

export const FixedPopover: React.FC<FixedPopoverProps> = ({
  open,
  onClose,
  anchorRef,
  children,
  desktopWidth = 280,
  mobileTitle,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updateCoords = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();

    // If anchor is completely off screen, close
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      onClose();
      return;
    }

    const popW = typeof desktopWidth === "number" ? desktopWidth : 280;
    let top = rect.bottom + 6;
    let left = rect.left;

    // Prevent overflowing right edge
    if (left + popW > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popW - 12);
    }
    if (left < 12) left = 12;

    setCoords({ top, left });
  }, [anchorRef, desktopWidth, onClose]);

  // Recalculate on open, window scroll (capture), resize
  useEffect(() => {
    if (!open) return;
    updateCoords();

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open, updateCoords]);

  // Exit animation lifecycle state
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsClosing(false);
    }
  }, [open]);

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

  const isVisible = open || isClosing;

  // Click outside (desktop)
  useEffect(() => {
    if (!isVisible || isMobile || isClosing) return;
    const handleDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (popoverRef.current && popoverRef.current.contains(target)) return;
      if (anchorRef.current && anchorRef.current.contains(target)) return;
      triggerClose();
    };

    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [isVisible, isMobile, isClosing, triggerClose, anchorRef]);

  // Escape key closes
  useEffect(() => {
    if (!isVisible || isClosing) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") triggerClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isVisible, isClosing, triggerClose]);

  // Lock mobile body scroll when bottom sheet is open
  useEffect(() => {
    if (isVisible && isMobile) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isVisible, isMobile]);

  if (!isVisible) return null;

  if (isMobile) {
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
          ref={popoverRef}
          className={`premium-bottom-sheet ${isClosing ? "premium-bottom-sheet-exit" : ""}`}
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "#FFFFFF",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            padding: "1.25rem 1.25rem 1.75rem",
            maxHeight: "85vh",
            overflowY: "auto",
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
              margin: "0 auto 0.85rem",
            }}
          />

          {/* Header */}
          {mobileTitle && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
                {mobileTitle}
              </span>
              <button
                type="button"
                onClick={triggerClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0 0.5rem",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {children}
        </div>
      </div>,
      document.body
    );
  }

  // Desktop fixed popup
  if (!coords) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`premium-desktop-dropdown ${isClosing ? "premium-desktop-dropdown-exit" : ""}`}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 99999,
        background: "#FFFFFF",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        boxShadow: "0 10px 36px rgba(0,0,0,0.18)",
        padding: "1rem",
        width: desktopWidth,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>,
    document.body
  );
};
