import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GATE_EVENT_PATHS,
  gateOutcome,
  hasGivenEmail,
  rememberEmailGiven,
} from "./emailCapture";

/**
 * The gate is dismissible, and these pin what each way out of it does. The
 * dialog reads `gateOutcome` rather than deciding inline, so asserting the
 * outcomes here is asserting the behaviour the person sees: a skip that hands
 * over the file with no address, a submit that is unchanged, and a session flag
 * that stops the ask returning whichever of the two was taken.
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
  it("submit sends the address, marks the session, and runs the action", () => {
    expect(gateOutcome("submit")).toEqual({
      sendEmail: true,
      remember: true,
      runAction: true,
      countPath: GATE_EVENT_PATHS.submit,
    });
  });

  it("skip runs the action and marks the session, but sends no address", () => {
    const outcome = gateOutcome("skip");
    // The download or copy still happens: skip is a real way to the file.
    expect(outcome.runAction).toBe(true);
    // And no address leaves the device on that path.
    expect(outcome.sendEmail).toBe(false);
    // The session is marked, so the gate does not return this session.
    expect(outcome.remember).toBe(true);
    expect(outcome.countPath).toBe(GATE_EVENT_PATHS.skip);
  });

  it("cancel is the only path that abandons: nothing runs, nothing is marked", () => {
    expect(gateOutcome("cancel")).toEqual({
      sendEmail: false,
      remember: false,
      runAction: false,
      countPath: null,
    });
  });

  it("counts submit and skip under distinct paths a hit can accept, with no personal data", () => {
    expect(GATE_EVENT_PATHS.submit).not.toBe(GATE_EVENT_PATHS.skip);
    for (const path of Object.values(GATE_EVENT_PATHS)) {
      // Same shape /api/hit demands of any path: absolute, short, no controls.
      expect(path.startsWith("/")).toBe(true);
      expect(path.length).toBeLessThanOrEqual(128);
      expect(NOT_IN_A_PATH.test(path)).toBe(false);
    }
  });
});

describe("the once-per-session flag", () => {
  it("is unset until a choice remembers it", () => {
    stubSession();
    expect(hasGivenEmail()).toBe(false);
  });

  it("prevents re-asking after either a submit or a skip", () => {
    // Both real choices set `remember`, and remembering flips the flag the guard
    // reads to run the next action straight through, with no second dialog.
    for (const choice of ["submit", "skip"] as const) {
      stubSession();
      expect(gateOutcome(choice).remember).toBe(true);
      rememberEmailGiven();
      expect(hasGivenEmail()).toBe(true);
      vi.unstubAllGlobals();
    }
  });
});
