/**
 * Background removal, loaded only when the user asks for it.
 *
 * `@imgly/background-removal` pulls down a segmentation model and an ONNX
 * runtime the first time it runs. That is tens of megabytes, so nothing here is
 * imported at module scope — the dynamic import inside `removeBackgroundCutout`
 * is what keeps the landing page light.
 *
 * The photo itself still never leaves the device. The downloads are model
 * weights and runtime code; inference happens locally.
 */

/**
 * Which segmentation model to fetch.
 *
 * `isnet_fp16` gives slightly cleaner hair edges but is roughly four times the
 * download. Most people reach this tool on a phone, often on mobile data, so
 * the smaller quantised model is the default. Change this one constant to trade
 * back the other way.
 */
const MODEL: "isnet" | "isnet_fp16" | "isnet_quint8" = "isnet_quint8";

/**
 * Segmentation runs on a downscaled copy. The result is used as an alpha mask
 * over the full-resolution photo, so this only limits how finely the outline is
 * traced, not the resolution of the exported file.
 */
const SEGMENTATION_EDGE = 1600;

export type RemovalPhase = "loading" | "working" | "done";

export type RemovalProgress = {
  phase: RemovalPhase;
  /** 0 to 1. Approximate — it is a download plus an inference pass. */
  ratio: number;
  message: string;
};

export type Cutout = {
  /** The subject on transparent pixels, at segmentation resolution. */
  bitmap: ImageBitmap;
  /** Cutout size divided by source size, for mapping crop rects across. */
  scale: number;
};

export class BackgroundRemovalError extends Error {
  constructor(cause?: unknown) {
    super("The background could not be removed on this device.");
    this.name = "BackgroundRemovalError";
    this.cause = cause;
  }
}

function describe(key: string): { phase: RemovalPhase; message: string } {
  if (key.startsWith("fetch")) {
    return { phase: "loading", message: "Getting the model. This happens once." };
  }
  return { phase: "working", message: "Separating you from the background." };
}

/**
 * Produce a transparent-background version of the photo.
 *
 * The caller keeps the result and reuses it, so toggling the background on and
 * off after the first run costs nothing.
 */
export async function removeBackgroundCutout(
  source: ImageBitmap,
  onProgress?: (progress: RemovalProgress) => void,
): Promise<Cutout> {
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
    const canvas = document.createElement("canvas");
    canvas.width = input.width;
    canvas.height = input.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D canvas context");
    ctx.drawImage(input, 0, 0);

    const sourceBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the working copy"))),
        "image/png",
      );
    });

    const { removeBackground } = await import("@imgly/background-removal");

    const resultBlob = await removeBackground(sourceBlob, {
      model: MODEL,
      output: { format: "image/png" },
      progress: (key: string, current: number, total: number) => {
        if (!onProgress) return;
        const { phase, message } = describe(key);
        const ratio = total > 0 ? Math.min(1, current / total) : 0;
        onProgress({ phase, ratio, message });
      },
    });

    onProgress?.({ phase: "done", ratio: 1, message: "Background replaced." });

    const bitmap = await createImageBitmap(resultBlob);
    return { bitmap, scale };
  } catch (error) {
    throw new BackgroundRemovalError(error);
  } finally {
    if (input !== source) input.close();
  }
}
