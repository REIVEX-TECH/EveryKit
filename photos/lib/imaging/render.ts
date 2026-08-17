/**
 * Turning a crop rect into finished pixels.
 *
 * One function does the work for both the on-screen preview and the download,
 * so what you see is what you get — the only difference is the output size and
 * whether a watermark goes on top.
 */

import { BACKGROUND_HEX, type PhotoSpec } from "@/data/specs";
import type { CropRect } from "./cropMath";
import type { Cutout } from "./backgroundRemoval";
import { canvasToBlob, createCanvas } from "./imageSource";
import { setBlobDpi } from "./dpiWriter";

export type RenderOptions = {
  /** Full-resolution source photo. */
  source: ImageBitmap;
  rect: CropRect;
  spec: PhotoSpec;
  /** Supply to replace the background with the spec's colour. */
  cutout?: Cutout | null;
  /** Output size. Defaults to the spec's exact pixel dimensions. */
  width?: number;
  height?: number;
  watermark?: boolean;
};

/**
 * Draw the finished photo onto a new canvas.
 */
export function renderPhoto(options: RenderOptions): HTMLCanvasElement {
  const { source, rect, spec, cutout, watermark = false } = options;
  const width = options.width ?? spec.pixelWidth;
  const height = options.height ?? spec.pixelHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser did not provide a 2D canvas context.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // The spec's background colour shows wherever the subject is not.
  ctx.fillStyle = BACKGROUND_HEX[spec.background];
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (cutout) {
    // Keep the full-resolution colour and take only the alpha from the cutout,
    // which was traced on a smaller copy. Compositing this way means the export
    // is as sharp as the original photo, not as sharp as the segmentation pass.
    const layer = createCanvas(canvas.width, canvas.height);
    const layerCtx = layer.getContext("2d");
    if (!layerCtx) throw new Error("This browser did not provide a 2D canvas context.");
    layerCtx.imageSmoothingEnabled = true;
    layerCtx.imageSmoothingQuality = "high";

    drawCropped(layerCtx, source, rect, 1, canvas.width, canvas.height);
    layerCtx.globalCompositeOperation = "destination-in";
    drawCropped(layerCtx, cutout.bitmap, rect, cutout.scale, canvas.width, canvas.height);
    layerCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(layer, 0, 0);
  } else {
    drawCropped(ctx, source, rect, 1, canvas.width, canvas.height);
  }

  if (watermark) drawWatermark(ctx, canvas.width, canvas.height);

  return canvas;
}

/**
 * Draw `rect` of a source image, scaled to fill the destination. `scale` maps
 * the rect from source coordinates onto whatever this particular image is.
 */
function drawCropped(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  rect: CropRect,
  scale: number,
  destWidth: number,
  destHeight: number,
): void {
  // Stay inside the image: drawImage with an out-of-bounds source rect silently
  // shrinks the drawn area on some browsers, which would shift the face.
  const sx = Math.max(0, rect.x * scale);
  const sy = Math.max(0, rect.y * scale);
  const sw = Math.min(rect.width * scale, image.width - sx);
  const sh = Math.min(rect.height * scale, image.height - sy);
  if (sw <= 0 || sh <= 0) return;

  // If clamping trimmed the rect, shrink the destination by the same fraction
  // so the head stays where the crop maths put it.
  const dx = ((sx - rect.x * scale) / (rect.width * scale)) * destWidth;
  const dy = ((sy - rect.y * scale) / (rect.height * scale)) * destHeight;
  const dw = (sw / (rect.width * scale)) * destWidth;
  const dh = (sh / (rect.height * scale)) * destHeight;

  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

const WATERMARK_TEXT = "EveryKit preview";

/**
 * A light diagonal repeat. Readable enough to be a real watermark, faint enough
 * that the preview still shows whether the photo is right.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const step = Math.max(56, Math.round(Math.min(width, height) / 4));
  const fontSize = Math.max(11, Math.round(Math.min(width, height) / 26));

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#0f172a";
  ctx.font = `600 ${fontSize}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const reach = Math.hypot(width, height);
  for (let y = -reach; y < reach; y += step) {
    for (let x = -reach; x < reach; x += step * 2.4) {
      ctx.fillText(WATERMARK_TEXT, x, y);
    }
  }
  ctx.restore();
}

export type ExportFormat = "image/jpeg" | "image/png";

export const JPEG_QUALITY = 0.95;

/**
 * Encode a canvas and stamp the spec's DPI into the file, so the photo opens at
 * its true physical size rather than as a 72 DPI web image.
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  dpi: number,
): Promise<Blob> {
  const blob = await canvasToBlob(
    canvas,
    format,
    format === "image/jpeg" ? JPEG_QUALITY : undefined,
  );
  return setBlobDpi(blob, dpi);
}

export function fileExtension(format: ExportFormat): string {
  return format === "image/jpeg" ? "jpg" : "png";
}

/** "us-passport-photo.jpg" */
export function outputFilename(spec: PhotoSpec, format: ExportFormat, suffix?: string): string {
  const parts = [spec.slug, "photo"];
  if (suffix) parts.push(suffix);
  return `${parts.join("-")}.${fileExtension(format)}`;
}
