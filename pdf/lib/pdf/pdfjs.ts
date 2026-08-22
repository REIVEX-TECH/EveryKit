"use client";

/**
 * The one place pdf.js is loaded, and the one place a document is opened.
 *
 * Thumbnails and PDF-to-images both need this. Opening goes through the hang
 * guard: a malformed file must fail with a sentence, never sit on a spinner
 * until the tab is killed.
 */

import {
  PDF_OPEN_ERROR,
  PDF_OPEN_TIMEOUT_MS,
  asOpenError,
  withTimeout,
} from "./guard";

/**
 * Where pdf.js finds its own support files.
 *
 * These are not optional. A page that uses one of the fourteen standard PDF
 * fonts makes pdf.js ask for the matching font data before it will draw, and a
 * page with CJK text asks for a character map. If those requests cannot be
 * answered, render() does not fail; it simply never finishes. Both directories
 * are copied out of the package into public/pdfjs, so they are served from
 * this origin. The alternative every pdf.js example reaches for is a CDN,
 * which would put a third-party request on a page whose entire promise is that
 * it does not make one.
 */
export const PDFJS_ASSETS = {
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  // pdf.js 6 decodes JBIG2 and JPEG 2000 images in WebAssembly and reads
  // predefined ICC profiles for colour, fetching both at run time from
  // wherever these point. Left unset, it goes looking on its own, and the
  // first scanned fax somebody opened would put a network request on a page
  // whose whole promise is that it makes none.
  wasmUrl: "/pdfjs/wasm/",
  iccUrl: "/pdfjs/iccs/",
  // A PDF can carry its own JavaScript, and pdf.js will run it. Nothing here
  // needs that. GHSA-hq66-cqwq-w95j is closed by the upgrade that came with
  // this line, but the option is what makes the intent true rather than
  // incidental.
  enableScripting: false,
} as const;

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

export async function getPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/**
 * Open a document, or throw PDF_OPEN_ERROR.
 *
 * The loading task, not just its promise: pdf.js 6 moved destroy() off the
 * document and onto the task, and the worker stays up until it is called. The
 * caller must destroy in a `finally`, including on the error path we take
 * here when the open itself times out.
 */
export async function openPdfDocument(bytes: Uint8Array): Promise<{
  task: ReturnType<PdfJs["getDocument"]>;
  doc: Awaited<ReturnType<PdfJs["getDocument"]>["promise"]>;
}> {
  const pdfjs = await getPdfJs();
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);

  const task = pdfjs.getDocument({ data: copy, ...PDFJS_ASSETS });
  try {
    const doc = await withTimeout(task.promise, PDF_OPEN_TIMEOUT_MS, PDF_OPEN_ERROR);
    return { task, doc };
  } catch (error) {
    try {
      await task.destroy();
    } catch {
      // Failing to destroy must not hide the reason the open failed.
    }
    throw asOpenError(error);
  }
}
