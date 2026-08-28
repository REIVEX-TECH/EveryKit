/**
 * A short "Recent" list, kept in localStorage, per tool.
 *
 * The point is retention: a tool nobody comes back to is a tool used once, so a
 * handful of the last inputs or results are kept on the device and shown on the
 * tool page. It is local only, never sent anywhere, and cleared in one click.
 *
 * localStorage, not sessionStorage: the value of this is that it survives the
 * tab closing and the visitor returning tomorrow. It is plain app storage on the
 * deployed site; the artifact sandbox forbids localStorage, this is not that.
 */

export type RecentEntry = { v: string; label: string };

const PREFIX = "ek_recent_";
const CAP = 6;

export function loadRecent(key: string): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.v === "string" && typeof e.label === "string")
      .slice(0, CAP);
  } catch {
    return [];
  }
}

export function saveRecent(key: string, entries: RecentEntry[]): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entries.slice(0, CAP)));
  } catch {
    // Storage can be full or refused in private mode. Recent is a nicety, so a
    // failure here is silent and the tool works exactly as before.
  }
}

export function clearRecent(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // As above: nothing to do, nothing to report.
  }
}

/** Add one entry to the front, drop a duplicate value, cap the length. */
export function addRecent(key: string, value: string, label?: string): RecentEntry[] {
  const trimmed = value.trim();
  if (trimmed === "") return loadRecent(key);
  const entry: RecentEntry = { v: trimmed, label: (label ?? trimmed).slice(0, 80) };
  const next = [entry, ...loadRecent(key).filter((e) => e.v !== trimmed)].slice(0, CAP);
  saveRecent(key, next);
  return next;
}

export const RECENT_CAP = CAP;
