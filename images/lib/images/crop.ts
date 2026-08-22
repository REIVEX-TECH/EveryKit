/**
 * The geometry behind the crop box.
 *
 * Kept apart from the canvas and the pointer handling so the awkward parts are
 * testable without a browser: a box dragged past an edge, a ratio applied to a
 * box near a corner, a box that would round down to nothing. All of it is
 * arithmetic, and arithmetic is worth pinning down on its own.
 *
 * Every rectangle here is in image pixels, not screen pixels. The component
 * converts pointer positions into this space once, at the edge, so nothing
 * below ever has to know how big the picture is drawn on screen.
 */

export type Rect = { x: number; y: number; width: number; height: number };

/** width / height, or null for freeform. */
export type AspectRatio = number | null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Pull a rectangle fully inside the image, keeping its size where it can.
 *
 * Moving is preferred to shrinking: a box dragged off the right edge slides
 * back in at the same size rather than losing width, which is what a hand
 * expects. It only shrinks when the box is genuinely larger than the image.
 */
export function clampRect(rect: Rect, bounds: { width: number; height: number }): Rect {
  const width = clamp(rect.width, 1, bounds.width);
  const height = clamp(rect.height, 1, bounds.height);
  const x = clamp(rect.x, 0, bounds.width - width);
  const y = clamp(rect.y, 0, bounds.height - height);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * The largest rectangle of the given ratio that fits inside the image,
 * centred. This is where a locked crop starts before the user drags it.
 */
export function largestRectOfRatio(
  bounds: { width: number; height: number },
  ratio: AspectRatio,
): Rect {
  if (ratio === null) {
    return { x: 0, y: 0, width: bounds.width, height: bounds.height };
  }

  // Try full width first; if that is too tall, the height is the limit instead.
  let width = bounds.width;
  let height = width / ratio;
  if (height > bounds.height) {
    height = bounds.height;
    width = height * ratio;
  }

  return clampRect(
    {
      x: (bounds.width - width) / 2,
      y: (bounds.height - height) / 2,
      width,
      height,
    },
    bounds,
  );
}

/**
 * Force a rectangle to a ratio while keeping it inside the image.
 *
 * The width is treated as the intent and the height derived from it, then the
 * whole thing is shrunk to fit if the derived height overflows. Used while
 * dragging with a ratio locked.
 */
export function applyRatio(
  rect: Rect,
  bounds: { width: number; height: number },
  ratio: AspectRatio,
): Rect {
  if (ratio === null) return clampRect(rect, bounds);

  let width = rect.width;
  let height = width / ratio;

  // If deriving the height pushed the box past the bottom, let the height lead
  // instead so the ratio is kept rather than broken to fit.
  if (height > bounds.height) {
    height = bounds.height;
    width = height * ratio;
  }
  if (width > bounds.width) {
    width = bounds.width;
    height = width / ratio;
  }

  return clampRect({ x: rect.x, y: rect.y, width, height }, bounds);
}

export type NamedRatio = { label: string; value: AspectRatio; hint: string };

/**
 * The ratios offered. Passport-adjacent ones are deliberately absent: an ID
 * photo has rules a plain crop cannot meet, and offering "2x2" here would
 * imply otherwise. The copy points at ID Photos instead.
 */
export const RATIOS: NamedRatio[] = [
  { label: "Freeform", value: null, hint: "Any shape" },
  { label: "Square", value: 1, hint: "1:1, profile pictures" },
  { label: "4:3", value: 4 / 3, hint: "Classic photo" },
  { label: "3:2", value: 3 / 2, hint: "35mm and most cameras" },
  { label: "16:9", value: 16 / 9, hint: "Widescreen, banners" },
];
