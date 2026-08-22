"use client";

/**
 * Render every page of a PDF to a raster image, for the PDF-to-images tool.
 *
 * This is pdf.js again, at a useful size rather than a thumbnail, and it
 * cannot live in the operations worker: the worker has no DOM and no canvas.
 * Pages are drawn one by one on the main thread so a long document still
 * paints, and the hang guard from openPdfDocument applies here too.
 */

import { PDF_PAGE_TIMEOUT_MS, asOpenError, isAbort, withTimeout } from "./guard";
import { openPdfDocument } from "./pdfjs";

export type PageImageFormat = "jpg" | "png";

/** Cap the longest edge so a poster-sized page does not allocate a 40 MB canvas. */
const MAX_EDGE = 2000;
const DEFAULT_SCALE = 2;
const JPEG_QUALITY = 0.85;

/**
 * Every image is held in memory at once, because the zip is built from all of
 * them together. At two hundred pages that is already several hundred
 * megabytes on a phone, and past it the tab is killed by the browser rather
 * than by anything this code could catch. Saying so is better than dying.
 */
export const IMAGE_PAGE_LIMIT = 200;

/** Raised when a page will not draw, and kept as itself rather than collapsed. */
const PAGE_DRAW_ERROR =
  "A page in this file could not be drawn, so the images were not made. The other tools here still work on it.";

const CANVAS_ERROR = "This browser could not draw that page.";
const ENCODE_ERROR = "A page could not be turned into an image.";

/** The messages this module is allowed to show, rather than an open failure. */
const OWN_ERRORS = [PAGE_DRAW_ERROR, CANVAS_ERROR, ENCODE_ERROR] as const;

export type PageImage = {
  name: string;
  bytes: Uint8Array;
};

export async function renderPdfToImages(
  bytes: Uint8Array,
  format: PageImageFormat,
  options: {
    signal?: AbortSignal;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<PageImage[]> {
  const { task, doc } = await openPdfDocument(bytes);
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const extension = format === "png" ? "png" : "jpg";
  const out: PageImage[] = [];

  try {
    const total = doc.numPages;
    if (total > IMAGE_PAGE_LIMIT) {
      throw new Error(
        `This file has ${total} pages, and ${IMAGE_PAGE_LIMIT} is as many as a browser can turn into images at once. Split it first and run the parts.`,
      );
    }
    const pad = String(total).length;

    for (let number = 1; number <= total; number++) {
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const page = await withTimeout(doc.getPage(number), PDF_PAGE_TIMEOUT_MS, PAGE_DRAW_ERROR);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(
        DEFAULT_SCALE,
        MAX_EDGE / Math.max(base.width, 1),
        MAX_EDGE / Math.max(base.height, 1),
      );
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      // Asked for only to find out whether this browser can draw at all; pdf.js
      // 6 wants the canvas rather than the context, and treats being handed
      // both as a contradiction.
      if (!canvas.getContext("2d")) throw new Error(CANVAS_ERROR);

      await withTimeout(
        page.render({ canvas, viewport }).promise,
        PDF_PAGE_TIMEOUT_MS,
        PAGE_DRAW_ERROR,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, format === "jpg" ? JPEG_QUALITY : undefined),
      );
      if (!blob) throw new Error(ENCODE_ERROR);

      out.push({
        name: `page-${String(number).padStart(pad, "0")}.${extension}`,
        bytes: new Uint8Array(await blob.arrayBuffer()),
      });
      page.cleanup();
      options.onProgress?.(number, total);
    }

    return out;
  } catch (error) {
    // An abort is the caller's own, and the page-limit and drawing messages
    // were written for a person. Collapsing those into "this file could not be
    // opened" would be a plain lie about a file that opened perfectly well.
    if (isAbort(error)) throw error;
    if (error instanceof Error && error.message.startsWith("This file has ")) throw error;
    throw asOpenError(error, OWN_ERRORS);
  } finally {
    await task.destroy();
  }
}
