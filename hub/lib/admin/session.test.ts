import { describe, expect, it } from "vitest";
import {
  SESSION_MAX_AGE_SECONDS,
  clearedSessionCookie,
  createSession,
  readSession,
  sessionCookie,
  timingSafeEqual,
  timingSafeEqualString,
} from "./session";

const SECRET = "a-secret-that-is-long-enough-to-be-one";
const NOW = 1_760_000_000_000;

describe("the session token", () => {
  it("round trips the address it was issued to", async () => {
    const token = await createSession("ahad@reivex.io", SECRET, NOW);
    expect(await readSession(token, SECRET, NOW)).toBe("ahad@reivex.io");
  });

  it("is refused when the payload is edited", async () => {
    const token = await createSession("ahad@reivex.io", SECRET, NOW);
    const [body, signature] = token.split(".");
    const forged = btoa(JSON.stringify({ e: "someone@else.com", exp: 9_999_999_999 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await readSession(`${forged}.${signature}`, SECRET, NOW)).toBeNull();
    expect(body).not.toBe(forged);
  });

  it("is refused when it was signed with a different secret", async () => {
    const token = await createSession("ahad@reivex.io", "the-other-secret", NOW);
    expect(await readSession(token, SECRET, NOW)).toBeNull();
  });

  it("is refused once it has expired", async () => {
    const token = await createSession("ahad@reivex.io", SECRET, NOW);
    const justBefore = NOW + SESSION_MAX_AGE_SECONDS * 1000 - 1000;
    const justAfter = NOW + SESSION_MAX_AGE_SECONDS * 1000 + 1000;
    expect(await readSession(token, SECRET, justBefore)).toBe("ahad@reivex.io");
    expect(await readSession(token, SECRET, justAfter)).toBeNull();
  });

  it("is refused when it is missing or nonsense", async () => {
    expect(await readSession(undefined, SECRET, NOW)).toBeNull();
    expect(await readSession("", SECRET, NOW)).toBeNull();
    expect(await readSession("no-dot-here", SECRET, NOW)).toBeNull();
    expect(await readSession(".", SECRET, NOW)).toBeNull();
    expect(await readSession("a.b", SECRET, NOW)).toBeNull();
  });

  it("is refused when the secret is missing, rather than accepted", async () => {
    // A box with no SESSION_SECRET must let nobody in, not everybody.
    const token = await createSession("ahad@reivex.io", SECRET, NOW);
    expect(await readSession(token, "", NOW)).toBeNull();
  });
});

describe("the cookie", () => {
  it("carries every flag that keeps it out of reach", async () => {
    const cookie = sessionCookie(await createSession("ahad@reivex.io", SECRET, NOW));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain(`Max-Age=${SESSION_MAX_AGE_SECONDS}`);
  });

  it("clears with the same flags and no life left", () => {
    const cookie = clearedSessionCookie();
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Max-Age=0");
  });
});

describe("comparing without leaking", () => {
  it("agrees with a plain comparison on the answer", () => {
    expect(timingSafeEqualString("abc", "abc")).toBe(true);
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
    expect(timingSafeEqualString("abc", "abcd")).toBe(false);
    expect(timingSafeEqualString("", "")).toBe(true);
    expect(timingSafeEqual(Uint8Array.from([1, 2]), Uint8Array.from([1, 2]))).toBe(true);
    expect(timingSafeEqual(Uint8Array.from([1, 2]), Uint8Array.from([1, 3]))).toBe(false);
  });
});
