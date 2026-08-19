/**
 * Placing a signature on a PDF page.
 *
 * The arithmetic that turns "the box the user dragged, on the thumbnail they
 * were looking at" into "a rectangle in PDF points on the real page". Pure, so
 * the coordinate flip that catches everyone can be tested directly rather than
 * discovered by opening a signed file and finding the signature upside down at
 * the top.
 */

/** A box in the preview's own pixel space, top-left origin. */
export type PreviewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A box in PDF user space: bottom-left origin, measured in points. */
export type PdfBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageSize = { width: number; height: number };

/**
 * Convert a box drawn on a preview into PDF page coordinates.
 *
 * Two things differ and both bite. The preview is a scaled raster, so every
 * length has to come back through that scale. And PDF measures y upward from
 * the bottom of the page while a browser measures it downward from the top, so
 * a box placed near the top of the preview has a *large* y in PDF space. Get
 * that wrong and every signature lands mirrored vertically, which looks
 * plausible on a symmetric page and obviously broken on a real one.
 */
export function previewBoxToPdf(
  box: PreviewBox,
  previewSize: PageSize,
  page: PageSize,
): PdfBox {
  const scaleX = page.width / previewSize.width;
  const scaleY = page.height / previewSize.height;

  const width = box.width * scaleX;
  const height = box.height * scaleY;
  const x = box.x * scaleX;
  // Flip: distance from the bottom of the page to the bottom of the box.
  const y = page.height - box.y * scaleY - height;

  return { x, y, width, height };
}

/** The inverse, for restoring a saved placement onto a preview. */
export function pdfBoxToPreview(
  box: PdfBox,
  previewSize: PageSize,
  page: PageSize,
): PreviewBox {
  const scaleX = previewSize.width / page.width;
  const scaleY = previewSize.height / page.height;
  return {
    x: box.x * scaleX,
    y: (page.height - box.y - box.height) * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  };
}

/**
 * Keep a box inside the page, without changing its size.
 *
 * A signature half off the edge is almost never what someone meant, and
 * pdf-lib will happily draw it there.
 */
export function clampToPage(box: PdfBox, page: PageSize): PdfBox {
  const width = Math.min(box.width, page.width);
  const height = Math.min(box.height, page.height);
  return {
    width,
    height,
    x: Math.min(Math.max(box.x, 0), page.width - width),
    y: Math.min(Math.max(box.y, 0), page.height - height),
  };
}

/**
 * Fit a signature image into a box while keeping its proportions.
 *
 * The user drags a rectangle; the signature has its own shape. Stretching it to
 * fill would distort the handwriting, so it is centred inside instead.
 */
export function fitInside(
  image: { width: number; height: number },
  box: PdfBox,
): PdfBox {
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    width,
    height,
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
  };
}

/** A sensible starting box: lower left, about a third of the page across. */
export function defaultBox(page: PageSize): PdfBox {
  const width = page.width * 0.32;
  const height = width * 0.34;
  return {
    x: page.width * 0.1,
    y: page.height * 0.12,
    width,
    height,
  };
}
