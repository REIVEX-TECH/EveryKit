/**
 * Putting a mark where the reader will actually see it.
 *
 * ## The problem this solves
 *
 * A PDF page carries a `/Rotate` value, and a viewer turns the page by that
 * many degrees clockwise before showing it. The page's own coordinate space is
 * not turned with it. So on a page with `/Rotate 90`, drawing at what the file
 * calls "bottom centre" puts the text up the side of what a person sees, and a
 * page number lands in the margin sideways.
 *
 * Scanned documents are full of these: a phone held the wrong way round, a
 * feeder that took the sheet landscape. They look upright on screen, which is
 * exactly why placing a number by the file's own coordinates looks broken.
 *
 * These functions are pure and have no pdf-lib in them, so the arithmetic can
 * be tested on its own rather than by squinting at a rendered page.
 */

import { normaliseRotation } from "./pageRanges";

export type Point = { x: number; y: number };

/** The page's size as a person sees it, with the rotation applied. */
export function displaySize(
  rotation: number,
  width: number,
  height: number,
): { width: number; height: number } {
  const turned = normaliseRotation(rotation) % 180 !== 0;
  return turned
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Convert a point in the frame the reader sees into the page's own coordinates.
 *
 * `display` is measured from the bottom-left of the page as displayed, which is
 * where "bottom" and "left" mean what they say.
 *
 * The four cases are the four quarter turns, derived by asking where each
 * corner of the unrotated page ends up:
 *
 * - 90 clockwise sends the bottom-left corner to the top-left, so a display x
 *   reads off the page's y, and a display y counts back down the page's width.
 * - 180 flips both axes.
 * - 270 is 90 the other way, so the roles swap again.
 */
export function toPageSpace(
  rotation: number,
  width: number,
  height: number,
  display: Point,
): Point {
  switch (normaliseRotation(rotation)) {
    case 90:
      return { x: width - display.y, y: display.x };
    case 180:
      return { x: width - display.x, y: height - display.y };
    case 270:
      return { x: display.y, y: height - display.x };
    default:
      return { x: display.x, y: display.y };
  }
}

export type Corner =
  | "bottom-left"
  | "bottom-centre"
  | "bottom-right"
  | "top-left"
  | "top-centre"
  | "top-right"
  | "centre";

/**
 * Where a box of `boxWidth` x `boxHeight` sits in the displayed frame, given a
 * corner to hang it off and a margin from the two nearest edges.
 *
 * Returned in display coordinates; feed it through `toPageSpace` to draw.
 */
export function cornerPosition(
  corner: Corner,
  frameWidth: number,
  frameHeight: number,
  boxWidth: number,
  boxHeight: number,
  margin: number,
): Point {
  const x = corner.endsWith("left")
    ? margin
    : corner.endsWith("right")
      ? frameWidth - margin - boxWidth
      : (frameWidth - boxWidth) / 2;

  const y = corner.startsWith("top")
    ? frameHeight - margin - boxHeight
    : corner === "centre"
      ? (frameHeight - boxHeight) / 2
      : margin;

  return { x, y };
}
