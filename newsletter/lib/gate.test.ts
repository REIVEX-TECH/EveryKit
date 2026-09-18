import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GATE_SUBMIT_EVENT,
  GATE_SKIP_EVENT,
  gateOutcome,
  hasGivenEmail,
  rememberEmailGiven,
} from "./emailCapture";

/**
 * The gate is skippable. The dialog reads `gateOutcome` rather than deciding
 * inline, so asserting the outcomes here is asserting the behaviour the person
 * sees: a submit that hands over the file and marks the session, a skip that
 * also hands over the file and marks the session but sends no address, and a
 * cancel that abandons with no address and no flag.
 */

/** A minimal sessionStorage, so the flag can be exercised without a browser. */
function stubSession() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
  return store;
}

/** Characters a path sent to /api/hit may not contain: whitespace, backslash. */
const NOT_IN_A_PATH = /[\s\\]/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gateOutcome", () => {
  it("submit sends the address, marks the session, counts the submit, and runs the action", () => {
    expect(gateOutcome("submit")).toEqual({
      sendEmail: true,
      remember: true,
      runAction: true,
      countPath: GATE_SUBMIT_EVENT,
    });
  });

  it("skip sends no address, still marks the session, counts the skip, and runs the action", () => {
    expect(gateOutcome("skip")).toEqual({
      sendEmail: false,
      remember: true,
      runAction: true,
      countPath: GATE_SKIP_EVENT,
    });
  });

  it("cancel abandons: no address, no session flag, no event, no action", () => {
    expect(gateOutcome("cancel")).toEqual({
      sendEmail: false,
      remember: false,
      runAction: false,
      countPath: null,
    });
  });

  it("has two completing choices, submit and skip, and only cancel abandons", () => {
    expect(gateOutcome("submit").runAction).toBe(true);
    expect(gateOutcome("skip").runAction).toBe(true);
    expect(gateOutcome("cancel").runAction).toBe(false);
    // Skip is the quiet decline: it never sends an address.
    expect(gateOutcome("skip").sendEmail).toBe(false);
  });

  it("counts both choices under paths a hit can accept, with no personal data", () => {
    for (const path of [GATE_SUBMIT_EVENT, GATE_SKIP_EVENT]) {
      expect(path.startsWith("/_event/")).toBe(true);
      expect(path.length).toBeLessThanOrEqual(128);
      expect(NOT_IN_A_PATH.test(path)).toBe(false);
    }
    expect(GATE_SUBMIT_EVENT).toBe("/_event/email-submit");
    expect(GATE_SKIP_EVENT).toBe("/_event/email-skip");
  });
});

describe("the once-per-session flag", () => {
  it("is unset until a choice remembers it", () => {
    stubSession();
    expect(hasGivenEmail()).toBe(false);
  });

  it("is set by a submit, so the gate does not ask again this session", () => {
    stubSession();
    expect(gateOutcome("submit").remember).toBe(true);
    rememberEmailGiven();
    expect(hasGivenEmail()).toBe(true);
  });

  it("is also set by a skip, so a skip is once per session too", () => {
    stubSession();
    expect(gateOutcome("skip").remember).toBe(true);
    rememberEmailGiven();
    expect(hasGivenEmail()).toBe(true);
  });

  it("is not set by a cancel: the ask returns on the next action", () => {
    stubSession();
    expect(gateOutcome("cancel").remember).toBe(false);
    expect(hasGivenEmail()).toBe(false);
  });
});
