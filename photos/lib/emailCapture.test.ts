import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidEmail, submitEmail } from "./emailCapture";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("isValidEmail", () => {
  it("mirrors the server's rule for addresses people actually have", () => {
    for (const email of [
      "a@b.co", "first.last@example.com", "name+tag@example.co.uk", "AHAD@REIVEX.IO",
    ]) {
      expect([email, isValidEmail(email)]).toEqual([email, true]);
    }
  });

  it("rejects the same things the server rejects", () => {
    for (const bad of [
      "", "   ", "nope", "@example.com", "a@b", "two@@b.co", "a b@c.co",
      ".x@y.co", "x.@y.co", "x..y@z.co",
    ]) {
      expect([bad, isValidEmail(bad)]).toEqual([bad, false]);
    }
  });
});

/**
 * The rule the whole feature hangs on: nothing `submitEmail` does may throw or
 * hang, because the caller hands over the file the moment it settles. These
 * cover every way the hub can let us down.
 */
describe("submitEmail fails open", () => {
  it("resolves false when the hub returns an error status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(submitEmail("a@b.co", "")).resolves.toBe(false);
  });

  it("resolves false when the request rejects outright", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(submitEmail("a@b.co", "")).resolves.toBe(false);
  });

  it("resolves false when an extension blocks the call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Blocked", "NetworkError")),
    );
    await expect(submitEmail("a@b.co", "")).resolves.toBe(false);
  });

  it("gives up on a hub that never answers, rather than hanging forever", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      }),
    );

    const pending = submitEmail("a@b.co", "");
    let settled = false;
    void pending.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(2500);
    expect(settled).toBe(false); // still waiting, inside the cap

    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toBe(false); // aborted at 3s
  });

  it("resolves true on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    await expect(submitEmail("a@b.co", "")).resolves.toBe(true);
  });

  it("does not call the hub at all when the honeypot is filled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(submitEmail("bot@spam.co", "http://buy")).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a lowercased, trimmed address and the kit name", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    await submitEmail("  Ahad@Example.COM  ", "");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ email: "ahad@example.com", kit: "photos", honeypot: "" });
  });
});
