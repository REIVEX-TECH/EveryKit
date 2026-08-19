/**
 * Signature strokes: smoothing, bounds and the SVG path they become.
 *
 * All pure. The drawing surface samples pointer positions and hands them here,
 * so the maths that decides what a signature looks like can be tested without a
 * canvas, and the exported SVG is generated from the same path the canvas drew
 * rather than from a second implementation that might disagree.
 */

export type Point = { x: number; y: number };
export type Stroke = Point[];

export const INK_COLOURS = [
  { id: "black", label: "Black", hex: "#171717" },
  { id: "blue", label: "Blue", hex: "#1b3a8f" },
] as const;

export type InkId = (typeof INK_COLOURS)[number]["id"];

export function inkHex(id: InkId): string {
  return INK_COLOURS.find((ink) => ink.id === id)?.hex ?? INK_COLOURS[0].hex;
}

/**
 * Drop points that are too close together to matter.
 *
 * A pointer fires far faster than a hand moves, so a slow stroke arrives as a
 * cluster of near-identical points. Keeping them makes the smoothing wobble and
 * bloats the SVG for no visible gain.
 */
export function thin(points: Stroke, minDistance = 1.2): Stroke {
  if (points.length <= 2) return points.slice();
  const out: Stroke = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const last = out[out.length - 1];
    if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= minDistance) {
      out.push(points[i]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * The SVG path for one stroke, as quadratic curves through the sampled points.
 *
 * Each curve uses a sampled point as its control and the midpoint to the next
 * as its end. That is the standard trick for drawing a smooth line through
 * points you did not choose: joining them with straight lines shows every
 * sample as a corner, and fitting a curve through them exactly overshoots on
 * sharp turns, which on a signature looks like a shaky hand.
 *
 * Deliberately not pressure-sensitive. Pointer pressure is absent on a mouse,
 * inconsistent between styluses, and reported as a constant 0.5 on many
 * touchscreens, so varying the width by it makes a signature look different
 * depending on the hardware rather than the person.
 */
export function strokeToPath(stroke: Stroke): string {
  const points = thin(stroke);
  if (points.length === 0) return "";

  const round = (n: number) => Math.round(n * 100) / 100;

  if (points.length === 1) {
    // A tap: a dot, drawn as a zero-length line so the round cap shows it.
    const { x, y } = points[0];
    return `M${round(x)} ${round(y)}l0 0`;
  }

  if (points.length === 2) {
    return `M${round(points[0].x)} ${round(points[0].y)}L${round(points[1].x)} ${round(points[1].y)}`;
  }

  let path = `M${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += `Q${round(current.x)} ${round(current.y)} ${round(midX)} ${round(midY)}`;
  }
  const last = points[points.length - 1];
  path += `L${round(last.x)} ${round(last.y)}`;
  return path;
}

export type Bounds = { x: number; y: number; width: number; height: number };

/** The box every stroke fits inside, with room for the pen's own width. */
export function strokeBounds(strokes: Stroke[], lineWidth: number): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const point of stroke) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
  }
  if (minX === Infinity) return null;

  // The line is drawn centred on the path, so half of it hangs outside the
  // points on every side. Trimming to the points alone clips the ink.
  const pad = lineWidth / 2 + 1;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

export function isEmpty(strokes: Stroke[]): boolean {
  return strokes.every((stroke) => stroke.length === 0);
}

/**
 * A standalone SVG of the signature, cropped to the ink.
 *
 * Cropped rather than the full canvas, so the file drops into a document at a
 * sensible size instead of carrying a wide margin of nothing. Stroke rather
 * than fill, with round caps and joins, which is what makes a drawn line look
 * like a pen rather than a ribbon.
 */
export function strokesToSvg(
  strokes: Stroke[],
  options: { colour: string; lineWidth: number },
): string {
  const bounds = strokeBounds(strokes, options.lineWidth);
  if (!bounds) return "";

  const paths = strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) => {
      const shifted = stroke.map((point) => ({
        x: point.x - bounds.x,
        y: point.y - bounds.y,
      }));
      return `<path d="${strokeToPath(shifted)}"/>`;
    })
    .join("");

  const width = Math.round(bounds.width);
  const height = Math.round(bounds.height);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<g fill="none" stroke="${options.colour}" stroke-width="${options.lineWidth}" stroke-linecap="round" stroke-linejoin="round">`,
    paths,
    `</g>`,
    `</svg>`,
  ].join("");
}
