import { beforeEach, describe, expect, it } from "vitest";
import { hashSync } from "bcryptjs";
import {
  COOLDOWN_MS,
  FAILURES_BEFORE_COOLDOWN,
  checkCredentials,
  cooldownRemainingMs,
  noteFailure,
  noteSuccess,
  resetAttempts,
} from "./auth";

// Cost 4 rather than the 12 the script uses: these tests check the comparison,
// not bcrypt, and twelve rounds a call adds seconds to the suite for nothing.
const config = {
  email: "ahad@reivex.io",
  passwordHash: hashSync("the-real-password", 4),
  sessionSecret: "a-secret",
};

beforeEach(() => resetAttempts());

describe("the one set of credentials", () => {
  it("lets the right pair through", async () => {
    expect(await checkCredentials("ahad@reivex.io", "the-real-password", config)).toBe(true);
  });

  it("does not care about case or padding in the address", async () => {
    expect(await checkCredentials("  Ahad@Reivex.io ", "the-real-password", config)).toBe(true);
  });

  it("refuses a wrong password, a wrong address, and both", async () => {
    expect(await checkCredentials("ahad@reivex.io", "guess", config)).toBe(false);
    expect(await checkCredentials("someone@else.com", "the-real-password", config)).toBe(false);
    expect(await checkCredentials("someone@else.com", "guess", config)).toBe(false);
  });

  it("refuses what is not a string at all", async () => {
    expect(await checkCredentials(undefined, undefined, config)).toBe(false);
    expect(await checkCredentials(["ahad@reivex.io"], 7, config)).toBe(false);
  });

  it("refuses everything when the stored hash is malformed", async () => {
    // A mangled paste into .env.production must lock the door, not open it.
    const broken = { ...config, passwordHash: "not-a-bcrypt-hash" };
    expect(await checkCredentials("ahad@reivex.io", "the-real-password", broken)).toBe(false);
  });
});

describe("the cooldown", () => {
  const now = 1_760_000_000_000;

  it("stays out of the way for the first failures", () => {
    for (let i = 0; i < FAILURES_BEFORE_COOLDOWN - 1; i++) noteFailure(now);
    expect(cooldownRemainingMs(now)).toBe(0);
  });

  it("starts once the tenth failure lands", () => {
    for (let i = 0; i < FAILURES_BEFORE_COOLDOWN; i++) noteFailure(now);
    expect(cooldownRemainingMs(now)).toBe(COOLDOWN_MS);
    expect(cooldownRemainingMs(now + COOLDOWN_MS + 1)).toBe(0);
  });

  it("is lifted by a successful login", () => {
    for (let i = 0; i < FAILURES_BEFORE_COOLDOWN; i++) noteFailure(now);
    noteSuccess();
    expect(cooldownRemainingMs(now)).toBe(0);
  });
});
