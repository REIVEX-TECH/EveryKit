/**
 * Checking the one set of credentials there is.
 *
 * There is no user table and no signup: the address and a bcrypt hash of the
 * password live in the environment, put there by hand. `npm run hash-password`
 * prints the hash to paste in. The plaintext is never stored, never logged and
 * never leaves the terminal it was typed into.
 *
 * This file is Node-only, because bcrypt is. The middleware never calls it: it
 * only reads a signed cookie, which is why that half lives in session.ts and
 * works on the edge runtime.
 */

import { compare } from "bcryptjs";
import { timingSafeEqualString } from "./session";

/** Failures allowed before a cooldown starts, counted from process start. */
export const FAILURES_BEFORE_COOLDOWN = 10;

/** How long the cooldown lasts once it starts. */
export const COOLDOWN_MS = 30_000;

/** A wrong password costs a second, whether or not the address was right. */
export const FAILURE_DELAY_MS = 1000;

/**
 * Attempt state, in memory.
 *
 * In memory is enough here and is chosen deliberately. There is one admin, one
 * PM2 process, and a restart clearing the counter is not a way in: the password
 * is a bcrypt hash and the cooldown is a courtesy on top of it, not the thing
 * keeping anybody out. Putting this in Postgres would mean a write on every
 * failed login, which is a better denial-of-service tool than what it defends.
 */
const state = { failures: 0, cooldownUntil: 0 };

export function cooldownRemainingMs(now = Date.now()): number {
  return Math.max(0, state.cooldownUntil - now);
}

export function noteFailure(now = Date.now()): void {
  state.failures += 1;
  if (state.failures >= FAILURES_BEFORE_COOLDOWN) {
    state.cooldownUntil = now + COOLDOWN_MS;
  }
}

export function noteSuccess(): void {
  state.failures = 0;
  state.cooldownUntil = 0;
}

/** Only the tests call this. */
export function resetAttempts(): void {
  noteSuccess();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type AdminConfig = {
  email: string;
  passwordHash: string;
  sessionSecret: string;
};

/**
 * The three environment variables, or null when any is missing.
 *
 * Null means the dashboard cannot be logged into at all, which is the right
 * answer for a box where they have not been set: it fails shut rather than
 * falling back to something.
 */
export function adminConfig(): AdminConfig | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const sessionSecret = process.env.SESSION_SECRET?.trim();
  if (!email || !passwordHash || !sessionSecret) return null;
  return { email, passwordHash, sessionSecret };
}

/**
 * Are these the credentials?
 *
 * Both halves are always evaluated. Returning early on a wrong address would
 * answer in a millisecond where a wrong password takes bcrypt's hundred or so,
 * and that difference tells anybody who cares which of the two they got right.
 */
export async function checkCredentials(
  email: unknown,
  password: unknown,
  config: AdminConfig,
): Promise<boolean> {
  const givenEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const givenPassword = typeof password === "string" ? password : "";

  const emailMatches = timingSafeEqualString(givenEmail, config.email);

  let passwordMatches = false;
  try {
    passwordMatches = await compare(givenPassword, config.passwordHash);
  } catch {
    // A malformed hash in the environment is a configuration mistake, not a
    // login. Nobody gets in, and the message on screen stays the generic one.
    passwordMatches = false;
  }

  return emailMatches && passwordMatches;
}
