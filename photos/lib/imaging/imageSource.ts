/**
 * Getting a user's file into something canvas can draw, and saying something
 * useful when that is not possible.
 *
 * Everything here runs in the browser. The file is read with FileReader and
 * decoded with createImageBitmap — it is never sent anywhere.
 */

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/** Cap on the working copy. 12 MP selfies are common and slow to draw repeatedly. */
export const MAX_WORKING_EDGE = 2400;

export class UnsupportedImageError extends Error {
  constructor(
    message: string,
    readonly hint: string,
  ) {
    super(message);
    this.name = "UnsupportedImageError";
  }
}

export type LoadedImage = {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  /** The original file, kept so exports can use full resolution. */
  file: File;
};

function looksLikeHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

/**
 * Decode a file into an ImageBitmap, honouring the EXIF orientation flag so
 * phone photos are not sideways.
 */
export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (file.size === 0) {
    throw new UnsupportedImageError("That file is empty.", "Pick the photo again.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (looksLikeHeic(file)) {
      throw new UnsupportedImageError(
        "This browser cannot open HEIC photos.",
        "Take a screenshot of the photo and use that, or set your iPhone camera to Most Compatible in Settings, Camera, Formats.",
      );
    }
    throw new UnsupportedImageError(
      "That file could not be opened as an image.",
      "Try a JPG, PNG or WebP file.",
    );
  }

  if (bitmap.width < 200 || bitmap.height < 200) {
    bitmap.close();
    throw new UnsupportedImageError(
      "That photo is too small to work with.",
      "Use a photo at least 200 pixels on each side. A photo straight from your camera is fine.",
    );
  }

  return { bitmap, width: bitmap.width, height: bitmap.height, file };
}

/**
 * A smaller copy for face detection and background removal. Both are much
 * faster on a 2400 px image than a 4000 px one, and neither needs the detail.
 */
export async function makeWorkingCopy(
  bitmap: ImageBitmap,
  maxEdge = MAX_WORKING_EDGE,
): Promise<{ bitmap: ImageBitmap; scale: number }> {
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= maxEdge) return { bitmap, scale: 1 };

  const scale = maxEdge / longest;
  const resized = await createImageBitmap(bitmap, {
    resizeWidth: Math.round(bitmap.width * scale),
    resizeHeight: Math.round(bitmap.height * scale),
    resizeQuality: "high",
  });
  return { bitmap: resized, scale };
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode the image."))),
      type,
      quality,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before dropping the URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
