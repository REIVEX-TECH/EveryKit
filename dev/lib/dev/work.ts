"use client";

/**
 * The two jobs that must not run on the main thread, and the harness that runs
 * them.
 *
 * They are here for different reasons. JSON is a size problem: five megabytes
 * through `JSON.parse` and `JSON.stringify` is a few hundred milliseconds of
 * frozen tab, and a frozen tab looks broken. Regex is a correctness-of-the-page
 * problem: a pattern like `(a+)+b` against forty a's does not finish this
 * century, and JavaScript's regex engine cannot be interrupted once it starts.
 * A worker can be terminated. That is the only reason this file exists.
 *
 * One worker per call rather than a pool. A terminated worker cannot be reused,
 * and pooling would mean tracking which of them are still alive after a kill,
 * which is more machinery than the few milliseconds it saves.
 */

export const REGEX_TIMEOUT_MS = 2000;

type Job =
  | { kind: "json"; action: "format" | "minify"; text: string; indent: number }
  | { kind: "regex"; pattern: string; flags: string; text: string };

function run<T>(job: Job, timeoutMs: number | null): Promise<T> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./work.worker.ts", import.meta.url), { type: "module" });
    } catch {
      reject(new Error("This browser could not start a worker."));
      return;
    }

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      fn();
    };

    const timer =
      timeoutMs === null
        ? (undefined as unknown as ReturnType<typeof setTimeout>)
        : setTimeout(() => {
            // The kill. Everything past here depends on it: without a
            // terminate the page is gone and no message will ever arrive.
            finish(() =>
              reject(
                new Error(
                  `That took longer than ${timeoutMs / 1000} seconds and was stopped. ` +
                    "A pattern that nests a repeat inside a repeat, like (a+)+, can take " +
                    "effectively forever on input that nearly matches.",
                ),
              ),
            );
          }, timeoutMs);

    worker.addEventListener("message", (event: MessageEvent) => {
      finish(() => resolve(event.data as T));
    });
    worker.addEventListener("error", (event) => {
      finish(() => reject(new Error(event.message || "The worker failed.")));
    });

    worker.postMessage(job);
  });
}

import type { JsonResult } from "./json";
import type { RegexOutcome } from "./regex";

/**
 * Format or minify off the main thread.
 *
 * No timeout: JSON.parse on a big document is slow but it always finishes, and
 * killing it at an arbitrary second would only turn a slow answer into no
 * answer.
 */
export function jsonInWorker(
  action: "format" | "minify",
  text: string,
  indent: number,
): Promise<JsonResult> {
  return run<JsonResult>({ kind: "json", action, text, indent }, null);
}

/** Match off the main thread, with the two second kill that makes it safe. */
export function regexInWorker(
  pattern: string,
  flags: string,
  text: string,
): Promise<RegexOutcome> {
  return run<RegexOutcome>({ kind: "regex", pattern, flags, text }, REGEX_TIMEOUT_MS);
}
