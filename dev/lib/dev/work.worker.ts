/**
 * The other side of work.ts: the thread that is allowed to be killed.
 *
 * It imports the same pure modules the tests exercise, so what runs here is
 * what was tested. There is no logic in this file beyond dispatch, on purpose:
 * anything that lived only in a worker could not be tested in Node.
 */

import { formatJson, minifyJson } from "./json";
import { runRegex } from "./regex";

type Job =
  | { kind: "json"; action: "format" | "minify"; text: string; indent: number }
  | { kind: "regex"; pattern: string; flags: string; text: string };

self.addEventListener("message", (event: MessageEvent<Job>) => {
  const job = event.data;
  const post = (message: unknown) => (self as unknown as Worker).postMessage(message);

  try {
    if (job.kind === "json") {
      post(job.action === "format" ? formatJson(job.text, job.indent) : minifyJson(job.text));
      return;
    }
    post(runRegex(job.pattern, job.flags, job.text));
  } catch (error) {
    // A worker that throws without answering leaves the caller waiting for a
    // message that never comes, so every path ends in a post.
    post({
      ok: false,
      message: error instanceof Error ? error.message : "That could not be worked out.",
    });
  }
});
