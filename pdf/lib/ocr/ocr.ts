"use client";

/**
 * Optical character recognition, on the device, through tesseract.js.
 *
 * Every asset tesseract needs is served from this origin, never a CDN: the
 * worker script, the WebAssembly core, and the language data all live under
 * /tesseract in public. The core is LSTM-only, which is why the smaller
 * `-lstm` builds are the ones vendored. Language data is fetched on first use
 * of that language and then cached by the browser, so English and Urdu are not
 * both pulled unless both are used.
 *
 * This keeps the brand promise intact: the picture handed to `recognize` is
 * turned into text inside the tab, and no request carries it anywhere.
 */

import { createWorker, OEM, type ImageLike, type Worker } from "tesseract.js";

export type OcrLang = "eng" | "urd";

export const OCR_LANGS: Array<{ id: OcrLang; label: string }> = [
  { id: "eng", label: "English" },
  { id: "urd", label: "Urdu" },
];

export type OcrProgress = { status: string; progress: number };

/** The stages tesseract reports, turned into a sentence a person can read. */
function friendlyStatus(status: string): string {
  if (status.includes("loading language") || status.includes("traineddata")) {
    return "Loading the language";
  }
  if (status.includes("initializing")) return "Getting ready";
  if (status.includes("loading tesseract core") || status.includes("core")) {
    return "Loading the recogniser";
  }
  if (status.includes("recognizing")) return "Reading the text";
  return "Working";
}

// One worker per language, kept for the session so a second page of the same
// language does not reload the model. The listener is mutable so each call can
// receive its own progress without rebuilding the worker.
const workers = new Map<OcrLang, Promise<Worker>>();
let listener: ((p: OcrProgress) => void) | null = null;

function workerFor(lang: OcrLang): Promise<Worker> {
  let existing = workers.get(lang);
  if (existing) return existing;
  // Absolute URLs, not root-relative. tesseract spawns its worker from a blob:
  // URL and calls importScripts(workerPath) inside it; a "/tesseract/..." path
  // resolved against a blob: base is invalid, so every path is pinned to this
  // origin explicitly. Still same-origin, so the promise holds.
  const origin = window.location.origin;
  existing = createWorker(lang, OEM.LSTM_ONLY, {
    workerPath: `${origin}/tesseract/worker.min.js`,
    // A directory: tesseract appends the right core filename for this browser
    // (SIMD or not). Only the LSTM cores are vendored, which is what OEM 1 asks
    // for.
    corePath: `${origin}/tesseract`,
    langPath: `${origin}/tesseract/lang`,
    logger: (m: { status?: string; progress?: number }) => {
      if (!listener || typeof m.progress !== "number") return;
      listener({ status: friendlyStatus(m.status ?? ""), progress: m.progress });
    },
  });
  workers.set(lang, existing);
  return existing;
}

/**
 * Read the text out of an image, canvas, or bitmap.
 *
 * Resolves with the recognised text, trimmed. It does not throw for a blank
 * page; it returns an empty string, which the caller shows as "no text found"
 * rather than an error.
 */
export async function recognize(
  image: ImageLike,
  lang: OcrLang,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  listener = onProgress ?? null;
  try {
    const worker = await workerFor(lang);
    const { data } = await worker.recognize(image);
    return data.text.trim();
  } finally {
    listener = null;
  }
}
