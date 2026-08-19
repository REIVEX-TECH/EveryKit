"use client";

/**
 * Driving the encode worker from the page.
 */

import type { EncodeResponse } from "./encode.worker";

export const BITRATE = 128;

let worker: Worker | null = null;
let nextId = 1;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./encode.worker.ts", import.meta.url), { type: "module" });
  }
  return worker;
}

/**
 * Encode already-trimmed, already-faded channels to an MP3.
 *
 * The channel buffers are transferred rather than copied, so this hands over
 * ownership: they are unusable here afterwards, which is why the caller passes
 * freshly sliced copies rather than the decoded original.
 */
export function encodeMp3(
  channels: Float32Array[],
  sampleRate: number,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const instance = getWorker();

    const onMessage = (event: MessageEvent<EncodeResponse>) => {
      const message = event.data;
      if (message.id !== id) return;

      if ("progress" in message) {
        onProgress?.(message.progress);
        return;
      }

      instance.removeEventListener("message", onMessage);
      if (message.ok) {
        onProgress?.(1);
        resolve(new Blob([message.mp3], { type: "audio/mpeg" }));
      } else {
        reject(new Error(message.error));
      }
    };

    instance.addEventListener("message", onMessage);

    const buffers = channels.map((channel) => {
      // A copy, so a Float32Array that is a view onto a larger AudioBuffer is
      // sent whole rather than dragging the entire track along with it.
      const copy = new Float32Array(channel.length);
      copy.set(channel);
      return copy.buffer;
    });

    instance.postMessage({ id, channels: buffers, sampleRate, bitrate: BITRATE }, buffers);
  });
}

/** Decode a file into raw samples, using the browser's own decoder. */
export async function decodeAudio(file: File): Promise<AudioBuffer> {
  const context = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  try {
    return await context.decodeAudioData(await file.arrayBuffer());
  } finally {
    // Contexts are a limited resource, and leaving them open costs battery.
    void context.close();
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
