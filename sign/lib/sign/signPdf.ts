/**
 * Stamping a signature onto a PDF, entirely in the browser.
 *
 * pdf-lib is loaded through a dynamic import so the landing page, which is just
 * a drawing canvas, never carries it.
 */

import { clampToPage, fitInside, type PdfBox } from "./place";

export type Placement = {
  /** Zero-based page index. */
  page: number;
  box: PdfBox;
};

async function lib() {
  return import("pdf-lib");
}

/** Page sizes in points, for laying out the preview and the placement boxes. */
export async function pageSizes(
  bytes: Uint8Array,
): Promise<Array<{ width: number; height: number }>> {
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return { width, height };
  });
}

/**
 * Draw the signature onto the chosen pages and hand back new bytes.
 *
 * The image is embedded once and drawn as many times as it was placed, so ten
 * placements cost one copy of the PNG rather than ten. It is flattened into the
 * page content rather than added as an annotation: an annotation can be moved
 * or deleted in any reader, which is not what someone signing a document
 * expects, and some viewers do not print them.
 */
export async function signPdf(
  pdfBytes: Uint8Array,
  signaturePng: Uint8Array,
  placements: Placement[],
): Promise<Uint8Array> {
  if (placements.length === 0) {
    throw new Error("Place the signature on the page first.");
  }

  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const image = await doc.embedPng(signaturePng);
  const pages = doc.getPages();

  for (const placement of placements) {
    const page = pages[placement.page];
    if (!page) continue;
    const { width, height } = page.getSize();

    const clamped = clampToPage(placement.box, { width, height });
    // Keep the handwriting's proportions inside whatever rectangle was dragged.
    const fitted = fitInside({ width: image.width, height: image.height }, clamped);

    page.drawImage(image, {
      x: fitted.x,
      y: fitted.y,
      width: fitted.width,
      height: fitted.height,
    });
  }

  return doc.save();
}

/** How many pages, without keeping the document in memory. */
export async function pageCount(bytes: Uint8Array): Promise<number> {
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}
