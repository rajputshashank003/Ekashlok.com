import { METHODS } from "../constants";
import utils from "./utils";
import { cache, CACHE_KEYS } from "../cache";

export const shlokApi = {
  // ── Dynamic endpoints — never cached ────────────────────────────────────────

  /** Today's shlok is user-specific and changes daily — always fresh. */
  getTodayShlok: () =>
    utils.request({ url: "/shlok/today", method: METHODS.GET }),

  /** Admin-only reset action — always hits the server. */
  resetShlokCount: () =>
    utils.request({ url: "/shlok/reset", method: METHODS.POST }),

  /** Set progress to any specific shlok (1–700). */
  setShlokCount: (count: number) =>
    utils.request({ url: "/shlok/count", method: METHODS.PATCH, data: { count } }),

  /** Authenticated user profile — not cached. */
  getMe: () =>
    utils.request({ url: "/users/me", method: METHODS.GET }),

  // ── Static Gita data — served from cache, refreshed in background ──────────

  /**
   * Returns all 18 chapter summaries.
   * Cached for 7 days. On a stale hit, returns old data immediately and
   * silently refreshes in the background for the next load.
   */
  getChapters: () =>
    cache.swr(
      CACHE_KEYS.chapters,
      () => utils.request({ url: "/shloks", method: METHODS.GET, show_error: false })
    ),

  /**
   * Returns all verses in a chapter.
   * Each chapter is cached individually so the user only fetches what they browse.
   */
  getChapterVerses: (chapter: number) =>
    cache.swr(
      CACHE_KEYS.chapterVerses(chapter),
      () => utils.request({ url: `/shloks/${chapter}`, method: METHODS.GET, show_error: false })
    ),

  /**
   * Returns a single verse.
   * Cached individually — browsing a verse once means instant loads forever.
   */
  getVerse: (chapter: number, verse: number) =>
    cache.swr(
      CACHE_KEYS.verse(chapter, verse),
      () => utils.request({ url: `/shloks/${chapter}/${verse}`, method: METHODS.GET, show_error: false }),
    ),

  /** User's per-day reading history for the heatmap — always fresh (user-specific). */
  getActivityHeatmap: () =>
    utils.request({ url: "/shlok/activity-heatmap", method: METHODS.GET }),
};


