// ─── App Identity ─────────────────────────────────────────────────────────────
// Change APP_NAME here and it propagates everywhere in the UI.
export const APP_NAME = "Gita Daily";
export const APP_TAGLINE = "Bhagavad Gita, delivered daily to your WhatsApp";
export const APP_DESCRIPTION =
  "Read one shlok every day from the Bhagavad Gita. Receive daily guidance on WhatsApp at 6 AM IST.";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const LOCAL_STORAGE = {
  TOKEN: "gitadaily_token",
  USER: "gitadaily_user",
};

// ─── Gita Constants ───────────────────────────────────────────────────────────
export const TOTAL_SHLOKS = 700;
export const TOTAL_CHAPTERS = 18;
export const DAILY_SEND_TIME = "6:00 AM IST";

// ─── HTTP Methods ─────────────────────────────────────────────────────────────
export const METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

export type HttpMethod = (typeof METHODS)[keyof typeof METHODS];

// ─── WhatsApp Start Choice Options ────────────────────────────────────────────
export const WA_START_CHOICES = {
  FROM_START: "from_start",
  CURRENT: "current",
  CUSTOM: "custom",
} as const;