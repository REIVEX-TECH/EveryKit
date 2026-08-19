/**
 * The browser half: decoding a file, applying a plan, and encoding it back.
 *
 * `createImageBitmap` decodes off the main thread already, and the encode goes
 * through OffscreenCanvas where it exists, so a batch of large photos does not
 * lock the tab. Files are handled one at a time on purpose: decoding twenty
 * 12-megapixel images at once is how a phone tab gets killed for using too
 * much memory.
 */

import { planResize, type Target } from "./resize";
import { inspect, isJpeg, stripMetadata } from "./jpeg";

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp" | "keep";

export type Job = {
  file: File;
  target: Target;
  format: OutputFormat;
  /** 0 to 1, for the lossy formats. Ignored by PNG. */
  quality: number;
};

export type Done = {
  name: string;
  blob: Blob;
  beforeBytes: number;
  afterBytes: number;
  width: number;
  height: number;
  /** Set when something worth saying happened, such as no resize being needed. */
  note?: string;
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function rename(name: string, type: string): string {
  const extension = EXTENSIONS[type];
  if (!extension) return name;
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  return `${stem}.${extension}`;
}

async function encode(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not save that image."))),
      type,
      quality,
    );
  });
}

function makeCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Remove the metadata from a JPEG without going near a canvas.
 *
 * The pixels are not decoded, so they cannot change. Anything that is not a
 * JPEG is handed back untouched with a note, rather than silently re-encoded
 * into one.
 */
export async function runStrip(file: File): Promise<Done> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!isJpeg(bytes)) {
    return {
      name: file.name,
      blob: file,
      beforeBytes: file.size,
      afterBytes: file.size,
      width: 0,
      height: 0,
      note: "Not a JPEG, so it was left exactly as it was. PNG and WebP from a phone camera do not normally carry EXIF.",
    };
  }

  const report = inspect(bytes);
  if (!report.present) {
    return {
      name: file.name,
      blob: file,
      beforeBytes: file.size,
      afterBytes: file.size,
      width: 0,
      height: 0,
      note: "There was no metadata in this one, so it is unchanged.",
    };
  }

  const stripped = stripMetadata(bytes);
  return {
    name: file.name,
    blob: new Blob([stripped as unknown as BlobPart], { type: "image/jpeg" }),
    beforeBytes: file.size,
    afterBytes: stripped.length,
    width: 0,
    height: 0,
    // Not lower-cased: the names contain acronyms, and "removed exif ... often
    // gps" is what lower-casing a list of them produces.
    note: `Removed: ${report.kinds.join(", ")}. The picture itself is untouched — not re-saved, not re-compressed.`,
  };
}

/** Resize and/or convert, which both go through the same decode and encode. */
export async function runImage(job: Job): Promise<Done> {
  const bitmap = await createImageBitmap(job.file);
  try {
    const plan = planResize({ width: bitmap.width, height: bitmap.height }, job.target);
    const type = job.format === "keep" ? job.file.type || "image/jpeg" : job.format;

    const canvas = makeCanvas(plan.width, plan.height);
    const context = canvas.getContext("2d") as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!context) throw new Error("The browser could not open a canvas for that image.");

    // A white ground under a transparent PNG being saved as JPEG, which has no
    // alpha: without it the transparent areas come out black.
    if (type === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, plan.width, plan.height);
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      bitmap,
      plan.crop.x,
      plan.crop.y,
      plan.crop.width,
      plan.crop.height,
      0,
      0,
      plan.width,
      plan.height,
    );

    const blob = await encode(canvas, type, job.quality);

    // "Left at its own size" only means something when a size was actually
    // asked for. Converting a format sets no target, so planResize reports the
    // image as unchanged and the note would otherwise appear on every
    // conversion, answering a question nobody asked.
    const askedForSize = job.target.width !== null || job.target.height !== null;

    return {
      name: rename(job.file.name, type),
      blob,
      beforeBytes: job.file.size,
      afterBytes: blob.size,
      width: plan.width,
      height: plan.height,
      note:
        plan.unchanged && askedForSize
          ? "Already smaller than the size you asked for, so it was left at its own size rather than enlarged."
          : undefined,
    };
  } finally {
    bitmap.close();
  }
}
