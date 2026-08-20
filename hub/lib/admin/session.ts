/**
 * The admin session cookie: what is in it, how it is signed, how it is checked.
 *
 * There is one admin and no user table, so a session is not a row anywhere. It
 * is a short JSON payload with the address and an expiry, signed with
 * SESSION_SECRET, and the signature is the only thing standing between a cookie
 * and the dashboard. Nothing here trusts the payload before the signature has
 * been checked.
 *
 * Web Crypto rather than node:crypto, because the middleware that guards
 * /admin runs on the edge runtime, and one implementation used in both places
 * is worth more than a marginally shorter function in each.
 */

export const SESSION_COOKIE = "ek_admin";

/** Seven days, as asked for. Long enough not to be a nuisance, short enough to expire. */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type Payload = {
  /** The address this session was issued to. */
  e: string;
  /** Expiry, in whole seconds since the epoch. */
  exp: number;
};

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Compare without leaking where two values first differ.
 *
 * Length is compared up front, which does leak the length of a signature, and
 * that is not a secret: every signature here is the same 32 bytes.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

/** The same, for two strings, used on the email. */
export function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  return timingSafeEqual(encoder.encode(a), encoder.encode(b));
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(body: string, secret: string): Promise<Uint8Array> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key(secret),
    new TextEncoder().encode(body),
  );
  return new Uint8Array(signature);
}

/**
 * Mint a session for an address.
 *
 * `now` is a parameter so the tests can stand at a chosen moment rather than
 * sleeping through one.
 */
export async function createSession(
  email: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const payload: Payload = {
    e: email,
    exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${base64urlEncode(await sign(body, secret))}`;
}

/**
 * The address this token is good for, or null.
 *
 * Null covers every way a token can be wrong: missing, malformed, signed with a
 * different secret, tampered with, or expired. The caller gets no detail,
 * because there is nothing useful to do with the difference and plenty to be
 * learned from being told.
 */
export async function readSession(
  token: string | undefined | null,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  if (!token || !secret) return null;

  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;

  const body = token.slice(0, dot);
  const provided = base64urlDecode(token.slice(dot + 1));
  if (!provided) return null;

  const expected = await sign(body, secret);
  if (!timingSafeEqual(provided, expected)) return null;

  const decoded = base64urlDecode(body);
  if (!decoded) return null;

  let payload: Payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(decoded)) as Payload;
  } catch {
    return null;
  }

  if (typeof payload?.e !== "string" || typeof payload?.exp !== "number") return null;
  if (payload.exp * 1000 <= now) return null;

  return payload.e;
}

/**
 * The Set-Cookie value.
 *
 * httpOnly so no script can read it, SameSite=Lax so it does not ride along on
 * a cross-site request, Secure so it never crosses plain HTTP. Secure is
 * unconditional rather than switched off in development, because browsers treat
 * localhost as a secure origin and accept it there, so there is no reason to
 * ship a weaker cookie to production by way of a flag that could be read wrong.
 */
export function sessionCookie(token: string, maxAgeSeconds = SESSION_MAX_AGE_SECONDS): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

/** The same cookie, emptied and expired. */
export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
