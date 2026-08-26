import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GATE_SUBMIT_EVENT,
  gateOutcome,
  hasGivenEmail,
  rememberEmailGiven,
} from "./emailCapture";

/**
 * The gate is mandatory. The dialog reads `gateOutcome` rather than deciding
 * inline, so asserting the outcomes here is asserting the behaviour the person
 * sees: a submit that hands over the file and marks the session, a cancel that
 * abandons with no address and no flag, and no third way past.
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
  it("submit sends the address, marks the session, counts one event, and runs the action", () => {
    expect(gateOutcome("submit")).toEqual({
      sendEmail: true,
      remember: true,
      runAction: true,
      countPath: GATE_SUBMIT_EVENT,
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

  it("has no skip path: submit is the only choice that completes an action", () => {
    // @ts-expect-error "skip" is not a GateChoice; the path no longer exists.
    expect(gateOutcome("skip")).toBeUndefined();
    // The only completing choice is a submit, and it is the only counted event.
    expect(gateOutcome("submit").runAction).toBe(true);
    expect(gateOutcome("cancel").runAction).toBe(false);
    expect(gateOutcome("cancel").countPath).toBeNull();
  });

  it("counts the submit under a path a hit can accept, with no personal data", () => {
    expect(GATE_SUBMIT_EVENT).toBe("/_event/email-submit");
    expect(GATE_SUBMIT_EVENT.startsWith("/")).toBe(true);
    expect(GATE_SUBMIT_EVENT.length).toBeLessThanOrEqual(128);
    expect(NOT_IN_A_PATH.test(GATE_SUBMIT_EVENT)).toBe(false);
    // Nothing anywhere counts a skip.
    expect(GATE_SUBMIT_EVENT).not.toContain("skip");
  });
});

describe("the once-per-session flag", () => {
  it("is unset until a submit remembers it", () => {
    stubSession();
    expect(hasGivenEmail()).toBe(false);
  });

  it("is set by a submit, so the gate does not ask again this session", () => {
    stubSession();
    expect(gateOutcome("submit").remember).toBe(true);
    rememberEmailGiven();
    expect(hasGivenEmail()).toBe(true);
  });

  it("is not set by a cancel: the ask returns on the next action", () => {
    stubSession();
    // A cancel does not remember, so the flag stays unset and the gate reopens.
    expect(gateOutcome("cancel").remember).toBe(false);
    expect(hasGivenEmail()).toBe(false);
  });
});
