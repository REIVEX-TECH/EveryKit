"use client";

/**
 * Page thumbnails, drawn with pdf.js.
 *
 * pdf-lib can copy and rearrange pages but cannot draw them, so picking pages
 * by eye needs a second library. It is loaded on demand: only the tools that
 * show a page grid pay for it, and the landing page never does.
 */

import { PDF_PAGE_ERROR, PDF_PAGE_TIMEOUT_MS, asOpenError, withTimeout } from "./guard";
import { openPdfDocument } from "./pdfjs";

const THUMBNAIL_WIDTH = 150;

/** Past this, rendering every page costs more than it helps. */
export const THUMBNAIL_LIMIT = 300;

export type Thumbnail = {
  /** Zero-based page index. */
  index: number;
  dataUrl: string;
  width: number;
  height: number;
  /** The rotation the page already carried, so the grid can show it upright. */
  rotation: number;
};

/**
 * Render up to `limit` pages, calling back as each one is ready.
 *
 * The callback matters: on a 200-page document, waiting for the whole set
 * before showing anything reads as a hang, whereas pages appearing one by one
 * reads as progress.
 *
 * ## What happens when a page will not draw
 *
 * Opening is guarded and throws; see openPdfDocument. Drawing is guarded and
 * does not. A page that cannot be painted stops the loop and leaves the
 * thumbnails collected so far in place, and the page count is still returned,
 * because the count comes from the document rather than from the pictures.
 *
 * That matters more than it looks. Extract, organise, split and delete all
 * work off the count and the grid tolerates a missing picture already: it
 * shows the page number instead. Rejecting the whole run because page 94 of
 * 300 would not paint would take away a tool that was about to do its job
 * perfectly well. Sign reached the same conclusion from the other direction
 * and degrades to page outlines.
 */
export async function renderThumbnails(
  bytes: Uint8Array,
  onPage: (thumbnail: Thumbnail) => void,
  options: {
    limit?: number;
    signal?: AbortSignal;
    /** Fired as soon as the document opens, before any page is drawn. */
    onCount?: (total: number) => void;
  } = {},
): Promise<number> {
  const limit = options.limit ?? THUMBNAIL_LIMIT;
  const { task, doc } = await openPdfDocument(bytes);

  try {
    const total = doc.numPages;
    // Reported before the loop, not after it. The grid is keyed off the page
    // count, so setting it at the end would mean the page-by-page callback
    // below paints nothing until the very last page is done, which is the
    // opposite of what it exists for.
    options.onCount?.(total);
    const count = Math.min(total, limit);

    for (let number = 1; number <= count; number++) {
      if (options.signal?.aborted) break;

      let page;
      try {
        page = await withTimeout(doc.getPage(number), PDF_PAGE_TIMEOUT_MS, PDF_PAGE_ERROR);
      } catch {
        // Whatever is drawn already stays on screen and the count still stands.
        break;
      }

      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH / base.width });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      // Asked for only to find out whether this browser can draw at all. It is
      // deliberately not passed to render(): pdf.js 6 treats `canvas` and
      // `canvasContext` as alternatives rather than as a pair, and says the
      // canvas must be null if the context is the one being used.
      if (!canvas.getContext("2d")) continue;

      try {
        await withTimeout(
          page.render({ canvas, viewport }).promise,
          PDF_PAGE_TIMEOUT_MS,
          PDF_PAGE_ERROR,
        );
      } catch {
        break;
      }

      onPage({
        index: number - 1,
        dataUrl: canvas.toDataURL("image/jpeg", 0.7),
        width: canvas.width,
        height: canvas.height,
        rotation: page.rotate,
      });

      page.cleanup();
    }

    return total;
  } catch (error) {
    throw asOpenError(error);
  } finally {
    await task.destroy();
  }
}

/** Page count alone, for tools that do not need pictures. */
export async function readPageCount(bytes: Uint8Array): Promise<number> {
  const { task, doc } = await openPdfDocument(bytes);
  try {
    return doc.numPages;
  } finally {
    await task.destroy();
  }
}
