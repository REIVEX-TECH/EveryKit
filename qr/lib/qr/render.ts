/**
 * Turning a payload string into a QR code.
 *
 * The module matrix comes from `qrcode`; the drawing is done here, because the
 * library's own renderers do not give the control this needs (a quiet zone in
 * modules rather than pixels, and an SVG that scales without resampling).
 *
 * Kept free of the DOM so the tests can render a matrix to raw pixels in Node
 * and hand it to a real decoder.
 */

import QRCode from "qrcode";

/**
 * How much of the code can be damaged and still read.
 *
 * "M" is the default because it is the one that survives a phone camera at an
 * angle without making the code noticeably denser. "H" exists for codes that
 * will be printed small or stuck on something that gets scuffed.
 */
export type ErrorCorrection = "L" | "M" | "Q" | "H";

/** Modules of blank space around the code. Four is what the spec requires. */
export const QUIET_ZONE = 4;

export type Matrix = {
  /** Width and height in modules, excluding the quiet zone. */
  size: number;
  /** Row-major, true where a module is dark. */
  modules: boolean[];
  /** The version the encoder settled on, which is how dense the code is. */
  version: number;
};

export function toMatrix(payload: string, level: ErrorCorrection = "M"): Matrix {
  const code = QRCode.create(payload, { errorCorrectionLevel: level });
  const size = code.modules.size;
  const data = code.modules.data;

  const modules: boolean[] = new Array(size * size);
  for (let i = 0; i < size * size; i++) modules[i] = Boolean(data[i]);

  return { size, modules, version: code.version };
}

export type Colours = { dark: string; light: string };

export const DEFAULT_COLOURS: Colours = { dark: "#171717", light: "#ffffff" };

/**
 * An SVG of the code.
 *
 * One <path> of rectangles rather than one <rect> per module: a version 10 code
 * is 3,481 modules, and that many elements makes a page visibly slower to
 * render and produces a file too big to paste anywhere.
 */
export function toSvg(
  matrix: Matrix,
  colours: Colours = DEFAULT_COLOURS,
): string {
  const total = matrix.size + QUIET_ZONE * 2;
  const parts: string[] = [];

  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.modules[y * matrix.size + x]) continue;
      parts.push(`M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="${colours.light}"/>`,
    `<path fill="${colours.dark}" d="${parts.join("")}"/>`,
    `</svg>`,
  ].join("");
}

/**
 * Raw RGBA pixels, which is what an image decoder takes.
 *
 * Used by the tests to scan back what was encoded, and by the PNG export to
 * fill a canvas at an exact pixel size.
 */
export function toRgba(
  matrix: Matrix,
  scale: number,
  colours: Colours = DEFAULT_COLOURS,
): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  // The buffer type is pinned rather than left as ArrayBufferLike so this can
  // be handed straight to ImageData, which will not accept an array that might
  // be backed by a SharedArrayBuffer.
  const total = (matrix.size + QUIET_ZONE * 2) * scale;
  const data = new Uint8ClampedArray(total * total * 4);

  const dark = hexToRgb(colours.dark);
  const light = hexToRgb(colours.light);

  for (let py = 0; py < total; py++) {
    for (let px = 0; px < total; px++) {
      const mx = Math.floor(px / scale) - QUIET_ZONE;
      const my = Math.floor(py / scale) - QUIET_ZONE;

      const inside = mx >= 0 && my >= 0 && mx < matrix.size && my < matrix.size;
      const on = inside && matrix.modules[my * matrix.size + mx];
      const [r, g, b] = on ? dark : light;

      const at = (py * total + px) * 4;
      data[at] = r;
      data[at + 1] = g;
      data[at + 2] = b;
      data[at + 3] = 255;
    }
  }

  return { data, width: total, height: total };
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * The pixel size each module gets so the finished PNG lands near a target.
 *
 * Rounded to a whole number: a fractional module width makes the edges land
 * between pixels, and a blurry QR code is a QR code that some scanners refuse.
 */
export function scaleFor(matrix: Matrix, targetPixels: number): number {
  const total = matrix.size + QUIET_ZONE * 2;
  return Math.max(1, Math.round(targetPixels / total));
}
