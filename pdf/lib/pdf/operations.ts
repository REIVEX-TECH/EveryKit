/**
 * The PDF operations themselves.
 *
 * Every one of these takes bytes and returns bytes. Nothing here touches the
 * DOM, the network or a worker, which is what lets the byte-level tests run in
 * Node against real fixture PDFs — a merge that reports success but produces
 * the wrong page order is the failure that matters, and it is invisible from
 * the outside.
 *
 * pdf-lib is loaded through a dynamic import so a tool route pulls it in on
 * demand and the landing page never carries it.
 */

import type { PDFRawStream as RawStream, PDFRef } from "pdf-lib";

import { normaliseRotation } from "./pageRanges";

export type PageSize = "a4" | "letter" | "fit";

/** A4 and US Letter in PDF points. */
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

async function lib() {
  return import("pdf-lib");
}

/**
 * Combine documents in the order given.
 *
 * Pages are copied rather than referenced, so the result stands alone and the
 * inputs can be released.
 */
export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  if (files.length === 0) throw new Error("There is nothing to merge.");
  const { PDFDocument } = await lib();

  const out = await PDFDocument.create();
  for (const bytes of files) {
    const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const copied = await out.copyPages(source, source.getPageIndices());
    for (const page of copied) out.addPage(page);
  }
  return out.save();
}

/**
 * Build one document from the chosen pages, in the order chosen.
 *
 * Used by both extract and split; split just calls it once per group.
 */
export async function extractPages(
  bytes: Uint8Array,
  pages: number[],
): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error("No pages were selected.");
  const { PDFDocument } = await lib();

  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = source.getPageCount();
  for (const index of pages) {
    if (index < 0 || index >= total) {
      throw new Error(`Page ${index + 1} does not exist in this file.`);
    }
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(source, pages);
  for (const page of copied) out.addPage(page);
  return out.save();
}

/** Split into one document per group of pages. */
export async function splitPdf(
  bytes: Uint8Array,
  groups: number[][],
): Promise<Uint8Array[]> {
  const out: Uint8Array[] = [];
  for (const group of groups) out.push(await extractPages(bytes, group));
  return out;
}

/** Every page as its own single-page document. */
export async function explodePdf(bytes: Uint8Array): Promise<Uint8Array[]> {
  const { PDFDocument } = await lib();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const groups = source.getPageIndices().map((index) => [index]);
  return splitPdf(bytes, groups);
}

export type PagePlan = {
  /** Index in the source document. */
  from: number;
  /** Degrees clockwise to add on top of whatever the page already carries. */
  rotate: number;
};

/**
 * Reorder and rotate in one pass.
 *
 * Rotation is added to the page's existing /Rotate rather than replacing it,
 * because a page that arrived rotated is already being displayed that way and
 * the buttons turn what the user can see.
 */
export async function organisePages(
  bytes: Uint8Array,
  plan: PagePlan[],
): Promise<Uint8Array> {
  if (plan.length === 0) throw new Error("No pages were selected.");
  const { PDFDocument, degrees } = await lib();

  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    source,
    plan.map((entry) => entry.from),
  );

  copied.forEach((page, index) => {
    const added = plan[index].rotate;
    if (added !== 0) {
      const existing = page.getRotation().angle;
      page.setRotation(degrees(normaliseRotation(existing + added)));
    }
    out.addPage(page);
  });

  return out.save();
}

export type ImageInput = {
  bytes: Uint8Array;
  /** Only JPEG and PNG can be embedded directly; anything else is converted first. */
  type: "image/jpeg" | "image/png";
};

/**
 * One PDF from a set of images.
 *
 * "fit" gives each page the image's own proportions, which is what people
 * expect for a scan or a screenshot. A4 and Letter letterbox the image inside
 * a fixed page with a small margin, which is what they expect when the result
 * is going to be printed.
 */
export async function imagesToPdf(
  images: ImageInput[],
  size: PageSize,
): Promise<Uint8Array> {
  if (images.length === 0) throw new Error("There are no images to put in a PDF.");
  const { PDFDocument } = await lib();
  const out = await PDFDocument.create();

  for (const image of images) {
    const embedded =
      image.type === "image/png"
        ? await out.embedPng(image.bytes)
        : await out.embedJpg(image.bytes);

    if (size === "fit") {
      const page = out.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      continue;
    }

    const { width, height } = PAGE_SIZES[size];
    const page = out.addPage([width, height]);
    const margin = 24;
    const scale = Math.min(
      (width - margin * 2) / embedded.width,
      (height - margin * 2) / embedded.height,
    );
    const drawWidth = embedded.width * scale;
    const drawHeight = embedded.height * scale;
    page.drawImage(embedded, {
      x: (width - drawWidth) / 2,
      y: (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return out.save();
}

/** How many pages a document has, without keeping it in memory. */
export async function pageCount(bytes: Uint8Array): Promise<number> {
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

/** The /Rotate value each page carries, which the tests assert on. */
export async function pageRotations(bytes: Uint8Array): Promise<number[]> {
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPages().map((page) => page.getRotation().angle);
}

/** Page sizes in points, for asserting images-to-pdf laid pages out correctly. */
export async function pageSizes(
  bytes: Uint8Array,
): Promise<Array<{ width: number; height: number }>> {
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return { width: Math.round(width), height: Math.round(height) };
  });
}

// ---------------------------------------------------------------------------
// Compression
// ---------------------------------------------------------------------------

export type CompressLevel = "light" | "email" | "smallest";

/**
 * What each setting does to a picture inside the document.
 *
 * These are a longest-edge cap in pixels plus a JPEG quality, not a DPI figure.
 * Turning a cap into a true DPI number would mean knowing how large each image
 * is drawn on its page, which means parsing content streams for the placement
 * matrix - fragile, and wrong the moment an image is drawn twice at two sizes.
 * A pixel cap is the thing actually being applied, so it is the thing described.
 */
const LEVELS: Record<CompressLevel, { maxEdge: number; quality: number }> = {
  light: { maxEdge: 2200, quality: 0.85 },
  email: { maxEdge: 1600, quality: 0.72 },
  smallest: { maxEdge: 1000, quality: 0.5 },
};

export type CompressResult = {
  bytes: Uint8Array;
  /** Plain-language explanation when the result is not what someone hoped for. */
  note?: string;
  /** How many image streams were actually re-encoded. */
  imagesRecompressed: number;
};

/**
 * Shrink a PDF by re-encoding the JPEG images inside it.
 *
 * Only DCTDecode (JPEG) image streams are touched. That is where the weight of
 * a scanned document lives, and it is the one case where re-encoding is both
 * safe and worth it. Text, vector art and fonts are left exactly as they are,
 * so the result stays selectable and searchable.
 *
 * The honesty rule for this tool: it never claims a saving it did not make. If
 * a document has no images in it, it comes back very slightly smaller (from
 * being rewritten more compactly) or not smaller at all, and says so.
 */
export async function compressPdf(
  bytes: Uint8Array,
  level: CompressLevel,
): Promise<CompressResult> {
  const { PDFDocument, PDFName, PDFNumber, PDFRawStream } = await lib();
  const { maxEdge, quality } = LEVELS[level];

  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") {
    // Rather than silently returning the file unchanged and letting the size
    // readout imply we tried, say what happened.
    return {
      bytes: await doc.save({ useObjectStreams: true }),
      imagesRecompressed: 0,
      note: "This browser cannot re-encode images off the main thread, so only the file's structure was tidied. Chrome, Edge, Firefox or Safari 17 and up will do the full job.",
    };
  }

  const IMAGE = PDFName.of("Image");
  const DCT = PDFName.of("DCTDecode");

  // Collect first, then reassign: mutating while enumerating is asking for it.
  const candidates: Array<[PDFRef, RawStream]> = [];
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    const dict = object.dict;
    if (dict.get(PDFName.of("Subtype")) !== IMAGE) continue;
    if (dict.get(PDFName.of("ImageMask"))) continue;
    if (dict.get(PDFName.of("Filter")) !== DCT) continue;
    candidates.push([ref, object]);
  }

  let recompressed = 0;

  for (const [ref, stream] of candidates) {
    const original = stream.contents;
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(new Blob([original as BlobPart], { type: "image/jpeg" }));
    } catch {
      // An image this browser will not decode is left exactly as it was.
      continue;
    }

    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      continue;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    const encoded = new Uint8Array(await blob.arrayBuffer());

    // Re-encoding can make a small or already-efficient image bigger. When it
    // does, keep the original: the point is a smaller file, not a changed one.
    if (encoded.length >= original.length) continue;

    const dict = stream.dict;
    dict.set(PDFName.of("Width"), PDFNumber.of(width));
    dict.set(PDFName.of("Height"), PDFNumber.of(height));
    dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
    dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
    dict.set(PDFName.of("Filter"), DCT);
    dict.set(PDFName.of("Length"), PDFNumber.of(encoded.length));
    // The canvas output is plain RGB, so any decode instructions that came with
    // the old stream no longer describe it.
    dict.delete(PDFName.of("DecodeParms"));
    dict.delete(PDFName.of("Decode"));

    doc.context.assign(ref, PDFRawStream.of(dict, encoded));
    recompressed++;
  }

  const out = await doc.save({ useObjectStreams: true });
  const saved = bytes.length - out.length;
  const percent = bytes.length > 0 ? (saved / bytes.length) * 100 : 0;

  let note: string | undefined;
  if (recompressed === 0) {
    note =
      "There were no re-encodable images in this file, so there was nothing to shrink. That usually means the document is text and vector graphics, which are already stored compactly.";
  } else if (percent < 5) {
    note = `Only ${recompressed} image${recompressed === 1 ? "" : "s"} could be re-encoded, and ${recompressed === 1 ? "it was" : "they were"} already efficient. Most of this file is something other than pictures.`;
  }

  return { bytes: out, note, imagesRecompressed: recompressed };
}
