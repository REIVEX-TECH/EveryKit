"use client";

/**
 * The main-thread side of the worker.
 *
 * One worker is created lazily and kept for the session, because spinning one
 * up costs a module parse and people run several operations in a row.
 *
 * Input buffers are deliberately *not* transferred. Transferring would detach
 * them, and the moment someone compresses at one setting and then tries
 * another, the file they picked would be gone and they would have to choose it
 * again. Results are transferred, since nothing in the worker needs them after.
 */

import type { WorkerRequest, WorkerResponse } from "./pdf.worker";

export type OperationResult = { files: Uint8Array[]; note?: string };

/**
 * A request without its id.
 *
 * Written the long way round because a plain Omit over a union keeps only the
 * keys every member shares, which here is just the id - leaving a type that
 * accepts nothing at all.
 */
type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;
export type OperationRequest = WithoutId<WorkerRequest>;

type Pending = {
  resolve: (value: OperationResult) => void;
  reject: (reason: Error) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL("./pdf.worker.ts", import.meta.url));

  worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const entry = pending.get(response.id);
    if (!entry) return;
    pending.delete(response.id);

    if (response.ok) {
      entry.resolve({
        files: response.files.map((buffer) => new Uint8Array(buffer)),
        note: response.note,
      });
    } else {
      entry.reject(new Error(response.error));
    }
  });

  worker.addEventListener("error", () => {
    // A worker that dies takes every outstanding job with it. Failing them all
    // is better than leaving buttons spinning forever.
    const dead = new Error(
      "The tool stopped unexpectedly. Reloading the page and trying again usually fixes it.",
    );
    for (const entry of pending.values()) entry.reject(dead);
    pending.clear();
    worker?.terminate();
    worker = null;
  });

  return worker;
}

export function runOperation(
  request: OperationRequest,
): Promise<OperationResult> {
  const id = nextId++;
  return new Promise<OperationResult>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...request, id } as WorkerRequest);
  });
}
