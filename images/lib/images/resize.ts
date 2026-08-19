/**
 * Working out the size an image should come out at.
 *
 * Kept apart from the canvas work so it can be tested directly. Every awkward
 * case here — a portrait photo in a landscape box, an image already smaller
 * than the target, a width given with no height — is arithmetic, and
 * arithmetic is worth testing without a browser in the way.
 */

export type Fit =
  /** Fit inside the box, keeping proportions. The whole image survives. */
  | "inside"
  /** Fill the box, keeping proportions, cropping what overflows. */
  | "cover"
  /** Stretch to exactly the box, ignoring proportions. */
  | "exact";

export type Target = {
  width: number | null;
  height: number | null;
  fit: Fit;
  /**
   * Whether an image smaller than the target may be enlarged.
   *
   * Off by default. Enlarging invents detail that was never captured, and
   * someone resizing a batch to "1200px wide" almost never means "and make the
   * small ones blurry".
   */
  allowUpscale: boolean;
};

export type Plan = {
  /** The canvas size, which is the finished file's size. */
  width: number;
  height: number;
  /** Source rectangle to read from, for cropping under "cover". */
  crop: { x: number; y: number; width: number; height: number };
  /** True when the image was left at its original size. */
  unchanged: boolean;
};

const round = (n: number) => Math.max(1, Math.round(n));

export function planResize(
  source: { width: number; height: number },
  target: Target,
): Plan {
  const whole = {
    x: 0,
    y: 0,
    width: source.width,
    height: source.height,
  };

  const noTarget = target.width === null && target.height === null;
  if (noTarget) {
    return { width: source.width, height: source.height, crop: whole, unchanged: true };
  }

  // One dimension given: the other follows from the proportions, whatever the
  // fit mode says, because there is no box to fit inside.
  if (target.width === null || target.height === null) {
    const ratio =
      target.width !== null
        ? target.width / source.width
        : (target.height as number) / source.height;

    if (ratio > 1 && !target.allowUpscale) {
      return { width: source.width, height: source.height, crop: whole, unchanged: true };
    }

    return {
      width: round(source.width * ratio),
      height: round(source.height * ratio),
      crop: whole,
      unchanged: ratio === 1,
    };
  }

  const boxWidth = target.width;
  const boxHeight = target.height;

  if (target.fit === "exact") {
    if (!target.allowUpscale && boxWidth > source.width && boxHeight > source.height) {
      return { width: source.width, height: source.height, crop: whole, unchanged: true };
    }
    return { width: boxWidth, height: boxHeight, crop: whole, unchanged: false };
  }

  if (target.fit === "inside") {
    const ratio = Math.min(boxWidth / source.width, boxHeight / source.height);
    if (ratio >= 1 && !target.allowUpscale) {
      return { width: source.width, height: source.height, crop: whole, unchanged: true };
    }
    return {
      width: round(source.width * ratio),
      height: round(source.height * ratio),
      crop: whole,
      unchanged: false,
    };
  }

  // cover: fill the box and crop the overflow, taken from the centre.
  const ratio = Math.max(boxWidth / source.width, boxHeight / source.height);
  if (ratio > 1 && !target.allowUpscale) {
    // Cannot fill the box without enlarging, so crop to the box's shape at the
    // largest size the source actually has.
    const cropRatio = Math.min(source.width / boxWidth, source.height / boxHeight);
    const cropWidth = round(boxWidth * cropRatio);
    const cropHeight = round(boxHeight * cropRatio);
    return {
      width: cropWidth,
      height: cropHeight,
      crop: {
        x: Math.round((source.width - cropWidth) / 2),
        y: Math.round((source.height - cropHeight) / 2),
        width: cropWidth,
        height: cropHeight,
      },
      unchanged: false,
    };
  }

  const cropWidth = round(boxWidth / ratio);
  const cropHeight = round(boxHeight / ratio);
  return {
    width: boxWidth,
    height: boxHeight,
    crop: {
      x: Math.round((source.width - cropWidth) / 2),
      y: Math.round((source.height - cropHeight) / 2),
      width: Math.min(cropWidth, source.width),
      height: Math.min(cropHeight, source.height),
    },
    unchanged: false,
  };
}

/** A size in bytes, written the way a file manager writes it. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The change between two sizes, said plainly and without overclaiming. */
export function describeChange(before: number, after: number): string {
  if (after >= before) {
    const bigger = Math.round(((after - before) / before) * 100);
    if (bigger === 0) return "about the same size";
    return `${bigger}% larger`;
  }
  const saved = Math.round(((before - after) / before) * 100);
  if (saved === 0) return "about the same size";
  return `${saved}% smaller`;
}
