"use client";

/**
 * Render one page of a PDF to a canvas, for the OCR tool to read.
 *
 * OCR wants a generous resolution: too small and the recogniser guesses, so
 * the page is drawn at roughly 300 dpi (scale derived from the page's own
 * size), capped so a poster-sized page does not allocate an enormous canvas.
 * It reuses the kit's one pdf.js loader, which serves every support file from
 * this origin.
 */

import { openPdfDocument } from "@/lib/pdf/pdfjs";

const TARGET_LONG_EDGE = 2200;

export async function readPdfPageCount(bytes: Uint8Array): Promise<number> {
  const { task, doc } = await openPdfDocument(bytes);
  try {
    return doc.numPages;
  } finally {
    await task.destroy();
  }
}

/** Draw `pageNumber` (1-based) to a canvas sized for legible OCR. */
export async function renderPdfPageToCanvas(
  bytes: Uint8Array,
  pageNumber: number,
): Promise<HTMLCanvasElement> {
  const { task, doc } = await openPdfDocument(bytes);
  try {
    const page = await doc.getPage(Math.min(Math.max(1, pageNumber), doc.numPages));
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(4, TARGET_LONG_EDGE / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale: Math.max(1, scale) });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    if (!canvas.getContext("2d")) {
      throw new Error("This browser could not draw the page for reading.");
    }
    await page.render({ canvas, viewport }).promise;
    return canvas;
  } finally {
    await task.destroy();
  }
}
