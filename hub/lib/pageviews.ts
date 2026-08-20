/**
 * The rules behind /api/hit, kept out of the route handler so they can be
 * tested without a server or a database.
 *
 * The endpoint counts page views and nothing else. It is passed two strings by
 * the page that was viewed, it validates both against fixed lists and lengths,
 * and it increments one integer. It reads no header beyond Origin and
 * Content-Type, and there is no field anywhere in this file for an address, a
 * user agent, a referrer or an id, because there is nowhere in the table to put
 * one.
 */

import { kits } from "@/data/kits";

/** A path longer than this is not a real page of ours. */
export const MAX_PATH_LENGTH = 128;

/** Two short strings. Anything larger is refused unread. */
export const MAX_BODY_BYTES = 1024;

/** Characters no path of ours contains: controls, space, and a backslash. */
const NOT_IN_A_PATH = /[\u0000-\u0020\u007f\\]/;

/**
 * Every slug that may appear in the `kit` column, derived from the registry so
 * that adding a kit to `data/kits.ts` is still the only step. "hub" is not a
 * kit in the registry but it does serve pages, so it is added here.
 */
export function knownKits(): string[] {
  return ["hub", ...kits.map((kit) => kit.slug)];
}

/**
 * A kit slug, or null when it is not one we publish.
 *
 * Unlike the subscribe endpoint, an unknown slug is rejected rather than folded
 * into "hub": a bad name here would invent a kit in the dashboard, whereas a
 * signup filed under the wrong kit at least still counts a person.
 */
export function normaliseKit(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const kit = input.trim().toLowerCase();
  return knownKits().includes(kit) ? kit : null;
}

/**
 * The path, reduced to the page.
 *
 * The query string is dropped before anything is stored. It is where campaign
 * tags live and, on other people's sites, where the occasional accidental email
 * address ends up, and none of that belongs in a counts table. The fragment
 * never reaches a server at all. Trailing slashes are folded so that /privacy
 * and /privacy/ are one row rather than two.
 */
export function normalisePath(input: unknown): string | null {
  if (typeof input !== "string") return null;

  let path = input.trim();
  if (path === "") return null;

  // Accept an absolute URL as well as a path, and keep only the path part.
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return null;
    }
  }

  path = path.split("?")[0].split("#")[0];
  if (!path.startsWith("/")) return null;
  if (NOT_IN_A_PATH.test(path)) return null;
  if (path.length > MAX_PATH_LENGTH) return null;

  // Collapse repeated slashes, then drop a trailing one, but never the root.
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");

  return path === "" ? "/" : path;
}
