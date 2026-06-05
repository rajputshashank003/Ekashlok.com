/**
 * BGS Frontend Cache Utility
 *
 * Strategy: Versioned TTL cache with stale-while-revalidate.
 *   - All cache keys are namespaced with "bgs_".
 *   - Bump CACHE_VERSION whenever the backend data schema or content changes.
 *     This auto-invalidates every user's cached data on their next visit — no
 *     manual reset flag needed.
 *   - TTL is set to 7 days. Bhagavad Gita content is essentially static, so
 *     daily expiry would only create unnecessary network chatter.
 *   - staleWhileRevalidate: serve cached data instantly, then silently refresh
 *     in the background. Gives zero perceived latency on repeat visits.
 */

// ── Config ────────────────────────────────────────────────────────────────────

/**
 * Injected by Vite at build time (see vite.config.ts → define.__BUILD_TIMESTAMP__).
 * Changes on every deploy automatically — no manual version bumping ever needed.
 * e.g. "2026-06-05T09:04:32.000Z"
 */
declare const __BUILD_TIMESTAMP__: string;
const CACHE_VERSION = __BUILD_TIMESTAMP__;

/** 7 days in milliseconds — content is static, no need to hit the server daily. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Namespace prefix so we can bulk-clear only BGS keys. */
const NS = "bgs_";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  version: string;
  data: T;
  cachedAt: number; // Unix ms timestamp
}

// ── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Returns cached data if it exists, matches the current version, and is within TTL.
 * Returns null on any miss (not found / version mismatch / expired / parse error).
 */
function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    if (entry.version !== CACHE_VERSION) return null; // schema changed

    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null; // TTL expired

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Writes data to cache under the given key. Fails silently if localStorage is
 * unavailable (e.g. private browsing quota exhausted).
 */
function set<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      version: CACHE_VERSION,
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(NS + key, JSON.stringify(entry));
  } catch (e) {
    console.warn("[BGS Cache] Write failed (quota?):", e);
  }
}

/**
 * Returns true if a valid (non-expired, correct version) cache entry exists.
 */
function has(key: string): boolean {
  return get(key) !== null;
}

/**
 * Returns the age of a cache entry in milliseconds, or null if not found/invalid.
 */
function age(key: string): number | null {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return null;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) return null;
    return Date.now() - entry.cachedAt;
  } catch {
    return null;
  }
}

/**
 * Removes a single cache key (or all BGS keys if called with no arguments).
 */
function invalidate(key?: string): void {
  if (key) {
    localStorage.removeItem(NS + key);
  } else {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k));
  }
}

// ── Stale-while-revalidate ────────────────────────────────────────────────────

/**
 * Stale-While-Revalidate helper.
 *
 * 1. If cache has fresh data → return it instantly. Done.
 * 2. If cache has stale data (expired but exists) → return it instantly AND
 *    silently kick off a background fetch to refresh the cache.
 * 3. If cache is completely empty → fetch, cache, and return.
 *
 * This means the user always sees data immediately, while stale content is
 * refreshed transparently in the background for the next visit.
 */
async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  onBackground?: (fresh: T) => void
): Promise<T> {
  // ── 1. Check fresh cache ──────────────────────────────────────────────────
  const fresh = get<T>(key);
  if (fresh !== null) return fresh;

  // ── 2. Check stale cache (entry exists but TTL/version failed) ────────────
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw) {
      const stale: CacheEntry<T> = JSON.parse(raw);
      // Has data but is either expired or version-mismatched
      // Serve it instantly while refreshing in background
      if (stale.data !== undefined) {
        // Background refresh (don't await — fire and forget)
        fetcher()
          .then((freshData) => {
            set(key, freshData);
            onBackground?.(freshData);
          })
          .catch(() => {
            // Background refresh failed — stale data is still better than nothing
          });

        return stale.data;
      }
    }
  } catch {
    // Corrupt entry — fall through to fresh fetch
  }

  // ── 3. No cache at all → blocking fetch ──────────────────────────────────
  const data = await fetcher();
  set(key, data);
  return data;
}

// ── Export ────────────────────────────────────────────────────────────────────

export const cache = { get, set, has, age, invalidate, swr };

/** Cache key constants — centralised so there are no magic strings. */
export const CACHE_KEYS = {
  chapters: "chapters",
  chapterVerses: (ch: number) => `chapter_verses_${ch}`,
  verse: (ch: number, v: number) => `verse_${ch}_${v}`,
} as const;
