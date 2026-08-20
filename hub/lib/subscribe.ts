/**
 * The rules behind /api/subscribe, kept out of the route handler so they can be
 * tested without standing up a server or a database.
 */

import { kits } from "@/data/kits";

/** Long enough for real addresses, short enough that nobody posts a novel. */
export const MAX_EMAIL_LENGTH = 254;

/** Bodies above this are rejected unread. A JSON object with two short strings. */
export const MAX_BODY_BYTES = 2048;

/**
 * Which kit a signup may be filed under, derived from the registry so that
 * adding a kit to `data/kits.ts` remains the only step.
 *
 * This was a hardcoded list of three, written when there were three. Every kit
 * added since sent a slug this list did not know, and `normaliseKit` filed all
 * of them under "hub" — so the one signal we keep about what pulls people in
 * has been recording the wrong answer for eight kits.
 */
export function kitSlugs(): string[] {
  return ["hub", ...kits.map((kit) => kit.slug)];
}

/**
 * Deliberately not RFC 5322. That grammar accepts addresses no mail server
 * would route, and rejecting a real address is worse than accepting a fake one
 * we will simply never mail. This asks: one @, something either side, a dot in
 * the domain, no spaces.
 */
const EMAIL_PATTERN = /^[^\s@,;:<>()[\]\\"]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normaliseEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email === "" || email.length > MAX_EMAIL_LENGTH) return null;
  if (!EMAIL_PATTERN.test(email)) return null;
  // A trailing or leading dot in the local part is invalid and is the shape
  // typos take, so it is worth catching rather than storing.
  const [local] = email.split("@");
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
  return email;
}

export function normaliseKit(input: unknown): string {
  if (typeof input !== "string") return "hub";
  const kit = input.trim().toLowerCase();
  return kitSlugs().includes(kit) ? kit : "hub";
}

/**
 * Which origins may call this endpoint.
 *
 * It writes to a database, so there is no blanket `*` any more. Exact match on
 * the apex, or any single-label subdomain of it — which covers every present
 * and future kit without listing them one by one.
 *
 * Localhost is allowed only outside production, so a dev machine can exercise
 * the real endpoint without opening it up on the deployed hub.
 */
export function isAllowedOrigin(origin: string | null, isProduction = true): boolean {
  if (!origin) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (!isProduction && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
    return true;
  }
  if (url.protocol !== "https:") return false;
  if (url.hostname === "useeverykit.com") return true;
  // One label only: photos.useeverykit.com yes, a.b.useeverykit.com no.
  return /^[a-z0-9-]+\.useeverykit\.com$/.test(url.hostname);
}

/** A filled honeypot means a bot. Accept it, store nothing, say nothing. */
export function isHoneypotFilled(body: Record<string, unknown>): boolean {
  const value = body.honeypot;
  return typeof value === "string" && value.trim() !== "";
}
