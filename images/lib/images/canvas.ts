"use client";

/**
 * The browser bits the new single-image tools share: decode a file the right
 * way up, encode a canvas, name the output, and hand it to the user.
 *
 * `process.ts` has its own copies of the encode and canvas helpers, tuned for
 * the batch path and covered by its tests. These are deliberately not merged
 * into it: that module is shipping and tested, and the new tools want a
 * slightly different decode (orientation applied, one image at a time) rather
 * than a shared abstraction that has to serve both.
 */

export type Encodable = "image/jpeg" | "image/png" | "image/webp";

const EXTENSIONS: Record<Encodable, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Decode a file to a bitmap with its EXIF orientation already applied, so a
 * sideways phone photo arrives upright and every tool below works in pixels it
 * can trust. `from-image` is honoured by every current browser; where it is
 * not, the image simply keeps its stored orientation, which is the old
 * behaviour rather than a break.
 */
export async function decodeUpright(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

export function makeCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export async function encodeCanvas(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: Encodable,
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

/** A 2D context, throwing the same message the batch path uses if it is refused. */
export function context2d(
  canvas: OffscreenCanvas | HTMLCanvasElement,
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error("The browser could not open a canvas for that image.");
  return ctx;
}

/** Fill a white ground before drawing, for when a transparent source is saved as JPEG. */
export function whiteGround(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

/** Swap a file's extension to match the format it was saved as. */
export function rename(name: string, type: Encodable): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  return `${stem}.${EXTENSIONS[type]}`;
}

/** The stem alone, for building a set of names from one source. */
export function stem(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
