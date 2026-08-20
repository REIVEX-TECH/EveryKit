/**
 * A JWT, taken apart and read out. Nothing here verifies anything.
 *
 * That is the whole design and it is stated on the page as plainly as it is
 * stated here: this splits the token on its dots, base64url-decodes the first
 * two parts and pretty prints them. It does not check the signature, because
 * checking a signature needs the key, and a page that asked you to paste your
 * signing key into a text box would deserve everything that followed.
 *
 * So: a token that decodes cleanly here is a token that is well formed. It is
 * not a token that is valid, and the difference matters.
 */

import { base64ToBytes } from "./encode";

export type JwtClaims = Record<string, unknown>;

export type JwtParsed = {
  header: JwtClaims;
  payload: JwtClaims;
  /** The third part, shown as the opaque string it is. */
  signature: string;
  /** Pretty printed, ready to render. */
  headerText: string;
  payloadText: string;
};

export type JwtResult = { ok: true; token: JwtParsed } | { ok: false; message: string };

function decodePart(part: string): JwtClaims | null {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const bytes = base64ToBytes(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const value: unknown = JSON.parse(text);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    return value as JwtClaims;
  } catch {
    return null;
  }
}

export function decodeJwt(raw: string): JwtResult {
  const token = raw.trim().replace(/^Bearer\s+/i, "");
  if (token === "") return { ok: false, message: "Paste a token to take it apart." };

  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      message: `A JWT has three parts separated by dots: header, payload and signature. This has ${parts.length}.`,
    };
  }

  const header = decodePart(parts[0]);
  if (!header) {
    return { ok: false, message: "The first part is not base64url-encoded JSON, so this is not a JWT." };
  }

  const payload = decodePart(parts[1]);
  if (!payload) {
    return { ok: false, message: "The second part is not base64url-encoded JSON, so this is not a JWT." };
  }

  return {
    ok: true,
    token: {
      header,
      payload,
      signature: parts[2],
      headerText: JSON.stringify(header, null, 2),
      payloadText: JSON.stringify(payload, null, 2),
    },
  };
}

/** A claim that is a NumericDate, as a Date. */
export function claimDate(claims: JwtClaims, name: string): Date | null {
  const value = claims[name];
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  // NumericDate is seconds since the epoch, per RFC 7519. A token carrying
  // milliseconds here is malformed, and reading it as seconds puts it in the
  // year 55,000, which is visible rather than silently wrong.
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type Expiry =
  | { state: "none" }
  | { state: "expired"; at: Date }
  | { state: "valid"; at: Date }
  | { state: "not-yet"; at: Date };

/**
 * What `exp` and `nbf` say about now.
 *
 * Reported, not enforced: an expired token here is still just a decoded token,
 * and the label is a courtesy rather than a verdict.
 */
export function expiryState(claims: JwtClaims, now = Date.now()): Expiry {
  const notBefore = claimDate(claims, "nbf");
  if (notBefore && notBefore.getTime() > now) return { state: "not-yet", at: notBefore };

  const expires = claimDate(claims, "exp");
  if (!expires) return { state: "none" };
  return expires.getTime() <= now
    ? { state: "expired", at: expires }
    : { state: "valid", at: expires };
}

/** The claims RFC 7519 names, so the reader knows which are standard. */
export const REGISTERED_CLAIMS: Record<string, string> = {
  iss: "issuer",
  sub: "subject",
  aud: "audience",
  exp: "expires at",
  nbf: "not before",
  iat: "issued at",
  jti: "token id",
};
