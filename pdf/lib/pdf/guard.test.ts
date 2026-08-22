import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PDF_OPEN_ERROR, PDF_PAGE_ERROR, asOpenError, isAbort, withTimeout } from "./guard";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves when the work finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 1000, "too slow")).resolves.toBe("ok");
  });

  it("rejects with the given message when the work never finishes", async () => {
    const hung = withTimeout(new Promise<never>(() => {}), 1000, "too slow");
    const assertion = expect(hung).rejects.toThrow("too slow");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("rejects with the original error when the work fails in time", async () => {
    await expect(
      withTimeout(Promise.reject(new Error("nope")), 1000, "too slow"),
    ).rejects.toThrow("nope");
  });
});

describe("asOpenError", () => {
  it("keeps the public open-error message as-is", () => {
    const error = new Error(PDF_OPEN_ERROR);
    expect(asOpenError(error)).toBe(error);
  });

  it("replaces a library dump with the public sentence", () => {
    expect(asOpenError(new Error("Unexpected server response")).message).toBe(PDF_OPEN_ERROR);
    expect(asOpenError("not-an-error").message).toBe(PDF_OPEN_ERROR);
  });
});

describe("asOpenError, the messages it is allowed to keep", () => {
  it("keeps the page message as well as the open one", () => {
    const page = new Error(PDF_PAGE_ERROR);
    expect(asOpenError(page)).toBe(page);
  });

  it("keeps a caller's own message when it is listed", () => {
    // The bug this pins: PDF-to-images raises "this browser could not draw that
    // page" on a file that opened perfectly well, and collapsing it into an
    // open failure tells the reader something untrue about their file.
    const mine = new Error("This browser could not draw that page.");
    expect(asOpenError(mine, ["This browser could not draw that page."])).toBe(mine);
  });

  it("still collapses a message that is not listed", () => {
    const dump = new Error("InvalidPDFException: bad XRef entry");
    expect(asOpenError(dump, ["something else"]).message).toBe(PDF_OPEN_ERROR);
  });

  it("collapses a thrown non-Error", () => {
    expect(asOpenError({ nope: true }).message).toBe(PDF_OPEN_ERROR);
  });
});

describe("isAbort", () => {
  it("recognises the abort a caller raised itself", () => {
    expect(isAbort(new DOMException("Aborted", "AbortError"))).toBe(true);
  });

  it("does not mistake anything else for one", () => {
    expect(isAbort(new Error("AbortError"))).toBe(false);
    expect(isAbort(new DOMException("Nope", "DataError"))).toBe(false);
    expect(isAbort("AbortError")).toBe(false);
  });
});

describe("withTimeout, on a rejection that is not an Error", () => {
  it("wraps it so the caller always gets an Error", () => {
    return expect(withTimeout(Promise.reject("a string"), 1000, "too slow")).rejects.toThrow(
      "a string",
    );
  });
});
