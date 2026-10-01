const PREFIX = 'yotoqhonam.';

export const STORAGE_KEYS = {
  demoState: `${PREFIX}state.v1`,
  session: `${PREFIX}session.v1`,
  theme: `${PREFIX}theme`,
  prefs: `${PREFIX}prefs.v1`,
} as const;

/**
 * Everything below is defensive: GitHub Pages runs in a browser that may
 * have storage disabled (private mode, embedded webviews). A storage
 * failure must degrade to in-memory state, never to a blank screen.
 */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // QuotaExceededError is the realistic case: an oversized photo.
    console.warn(`[yotoqhonam] could not persist "${key}"`, err);
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
