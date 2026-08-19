"use client";

/**
 * Background removal, loaded only when the user asks for it.
 *
 * `@imgly/background-removal` pulls down a segmentation model and an ONNX
 * runtime the first time it runs. That is tens of megabytes, so nothing here is
 * imported at module scope: the dynamic import inside `removeToTransparent` is
 * what keeps the landing page light. Same pattern and same model choice as
 * Photos, which has been running it in production.
 *
 * The image never leaves the device. What crosses the network is model weights
 * coming in; inference happens locally, and the CSP allows exactly the one host
 * that serves them.
 */

import { hexToRgb, type OutputMode } from "./output";

/**
 * `isnet_fp16` traces slightly cleaner hair but is roughly four times the
 * download. Most people reach this on a phone, often on mobile data, so the
 * quantised model is the default. One constant to trade the other way.
 */
const MODEL: "isnet" | "isnet_fp16" | "isnet_quint8" = "isnet_quint8";

/**
 * Segmentation runs on a downscaled copy. The mask is then applied to the
 * full-resolution image, so this limits how finely the outline is traced, not
 * the resolution of what gets saved.
 */
const SEGMENTATION_EDGE = 1600;

export type RemovalPhase = "loading" | "working" | "done";

export type RemovalProgress = {
  phase: RemovalPhase;
  /** 0 to 1. Approximate: it is a download followed by an inference pass. */
  ratio: number;
  message: string;
};

export class RemovalError extends Error {
  constructor(cause?: unknown) {
    super("The background could not be removed on this device.");
    this.name = "RemovalError";
    this.cause = cause;
  }
}

function describe(key: string): { phase: RemovalPhase; message: string } {
  if (key.startsWith("fetch")) {
    return { phase: "loading", message: "Getting the model. This happens once." };
  }
  return { phase: "working", message: "Finding the edges." };
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new RemovalError("encode failed"))),
      type,
    );
  });
}

/**
 * The subject on transparent pixels, at the image's own resolution.
 *
 * The mask is traced small and applied large: the segmentation pass runs on a
 * downscaled copy for speed, then `destination-in` composites that mask over
 * the full-resolution image. Saving the model's own output directly would cap
 * every download at 1600px regardless of what was uploaded.
 */
export async function removeToTransparent(
  source: ImageBitmap,
  onProgress?: (progress: RemovalProgress) => void,
): Promise<HTMLCanvasElement> {
  const longest = Math.max(source.width, source.height);
  const scale = longest > SEGMENTATION_EDGE ? SEGMENTATION_EDGE / longest : 1;

  const input =
    scale === 1
      ? source
      : await createImageBitmap(source, {
          resizeWidth: Math.round(source.width * scale),
          resizeHeight: Math.round(source.height * scale),
          resizeQuality: "high",
        });

  try {
    const small = makeCanvas(input.width, input.height);
    const smallCtx = small.getContext("2d");
    if (!smallCtx) throw new RemovalError("no 2D context");
    smallCtx.drawImage(input, 0, 0);

    const { removeBackground } = await import("@imgly/background-removal");

    const cutBlob = await removeBackground(await canvasToBlob(small), {
      model: MODEL,
      output: { format: "image/png" },
      progress: (key: string, current: number, total: number) => {
        if (!onProgress) return;
        const { phase, message } = describe(key);
        onProgress({ phase, ratio: total > 0 ? Math.min(1, current / total) : 0, message });
      },
    });

    const cut = await createImageBitmap(cutBlob);
    try {
      const full = makeCanvas(source.width, source.height);
      const ctx = full.getContext("2d");
      if (!ctx) throw new RemovalError("no 2D context");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(source, 0, 0);
      // Keep the full-resolution colour, take only the alpha from the mask.
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(cut, 0, 0, full.width, full.height);
      ctx.globalCompositeOperation = "source-over";

      onProgress?.({ phase: "done", ratio: 1, message: "Background removed." });
      return full;
    } finally {
      cut.close();
    }
  } catch (error) {
    throw new RemovalError(error);
  } finally {
    if (input !== source) input.close();
  }
}

/**
 * The finished image for a chosen output mode.
 *
 * Transparent hands back the cutout as it is. A colour paints the flat ground
 * first and draws the subject over it, which is ordinary source-over
 * compositing and keeps soft edges soft.
 */
export function applyMode(cutout: HTMLCanvasElement, mode: OutputMode): HTMLCanvasElement {
  if (mode.kind === "transparent") return cutout;

  const rgb = hexToRgb(mode.hex);
  if (!rgb) return cutout;

  const out = makeCanvas(cutout.width, cutout.height);
  const ctx = out.getContext("2d");
  if (!ctx) return cutout;
  ctx.fillStyle = `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(cutout, 0, 0);
  return out;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
