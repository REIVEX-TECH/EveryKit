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

/** The shape of an ordinary data module. */
export type ModuleShape = "square" | "rounded" | "dots";
/** The shape of the three finder patterns in the corners. */
export type FinderStyle = "square" | "rounded";

export type Style = { moduleShape: ModuleShape; finderStyle: FinderStyle };

export const DEFAULT_STYLE: Style = { moduleShape: "square", finderStyle: "square" };

/** The module-space origins of the three finder patterns (excluding quiet zone). */
function finderOrigins(size: number): Array<[number, number]> {
  return [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
}

/** True if a module falls inside one of the 7x7 finder patterns. */
function isFinderModule(mx: number, my: number, size: number): boolean {
  return finderOrigins(size).some(
    ([ox, oy]) => mx >= ox && mx < ox + 7 && my >= oy && my < oy + 7,
  );
}

/**
 * Inside-test for a rounded rectangle, used by both the raster and (implicitly)
 * the SVG. A point is inside when its distance to the rectangle shrunk by the
 * radius is within the radius.
 */
function insideRoundedRect(
  u: number,
  v: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
): boolean {
  const dx = Math.max(x0 + r - u, 0, u - (x1 - r));
  const dy = Math.max(y0 + r - v, 0, v - (y1 - r));
  return dx * dx + dy * dy <= r * r;
}

/**
 * Whether a rounded finder paints dark at finder-local coordinates (0..7).
 *
 * The finder is fixed geometry, so it is drawn from shapes rather than the
 * matrix: a rounded dark outer square, a rounded light gap, and a rounded dark
 * centre. The sizes match the standard finder, so a scanner still sees the
 * concentric structure it looks for.
 */
function roundedFinderDark(u: number, v: number): boolean {
  const outer = insideRoundedRect(u, v, 0, 0, 7, 7, 1.6);
  const gap = insideRoundedRect(u, v, 1, 1, 6, 6, 1.1);
  const centre = insideRoundedRect(u, v, 2, 2, 5, 5, 0.9);
  return (outer && !gap) || centre;
}

/** An SVG path for one module at (x,y) in the chosen data shape. */
function modulePath(x: number, y: number, shape: ModuleShape): string {
  if (shape === "square") return `M${x} ${y}h1v1h-1z`;
  if (shape === "dots") {
    // A circle of radius 0.45 centred in the module, as two arcs.
    return `M${x + 0.05} ${y + 0.5}a0.45 0.45 0 1 0 0.9 0a0.45 0.45 0 1 0 -0.9 0z`;
  }
  // rounded: a rounded square with radius 0.3.
  return roundRectPath(x, y, 1, 1, 0.3);
}

/** An SVG path for a rounded rectangle. */
function roundRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr} ${y}`,
    `h${w - 2 * rr}`,
    `a${rr} ${rr} 0 0 1 ${rr} ${rr}`,
    `v${h - 2 * rr}`,
    `a${rr} ${rr} 0 0 1 ${-rr} ${rr}`,
    `h${-(w - 2 * rr)}`,
    `a${rr} ${rr} 0 0 1 ${-rr} ${-rr}`,
    `v${-(h - 2 * rr)}`,
    `a${rr} ${rr} 0 0 1 ${rr} ${-rr}`,
    "z",
  ].join("");
}

/** The dark <path> data for the data modules and, when square, the finders. */
function bodyPath(matrix: Matrix, style: Style): string {
  const parts: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.modules[y * matrix.size + x]) continue;
      const finder = isFinderModule(x, y, matrix.size);
      // Rounded finders are drawn separately from their own geometry.
      if (finder && style.finderStyle === "rounded") continue;
      const shape = finder ? "square" : style.moduleShape;
      parts.push(modulePath(x + QUIET_ZONE, y + QUIET_ZONE, shape));
    }
  }
  return parts.join("");
}

/** The extra SVG elements for rounded finders, or "" for square ones. */
function finderSvg(matrix: Matrix, style: Style, colours: Colours): string {
  if (style.finderStyle !== "rounded") return "";
  const out: string[] = [];
  for (const [ox, oy] of finderOrigins(matrix.size)) {
    const x = ox + QUIET_ZONE;
    const y = oy + QUIET_ZONE;
    // Outer dark, gap light, centre dark, matching roundedFinderDark.
    out.push(`<path fill="${colours.dark}" d="${roundRectPath(x, y, 7, 7, 1.6)}"/>`);
    out.push(`<path fill="${colours.light}" d="${roundRectPath(x + 1, y + 1, 5, 5, 1.1)}"/>`);
    out.push(`<path fill="${colours.dark}" d="${roundRectPath(x + 2, y + 2, 3, 3, 0.9)}"/>`);
  }
  return out.join("");
}

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
  style: Style = DEFAULT_STYLE,
): string {
  const total = matrix.size + QUIET_ZONE * 2;
  // A shape other than a hard square is drawn without crispEdges, or its curves
  // are stepped; a plain square wants crispEdges so its sides land on pixels.
  const rendering =
    style.moduleShape === "square" && style.finderStyle === "square"
      ? ' shape-rendering="crispEdges"'
      : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${rendering}>`,
    `<rect width="${total}" height="${total}" fill="${colours.light}"/>`,
    `<path fill="${colours.dark}" d="${bodyPath(matrix, style)}"/>`,
    finderSvg(matrix, style, colours),
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
  style: Style = DEFAULT_STYLE,
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
      // Module-space coordinate, quiet zone removed. The fractional part places
      // the pixel within its module, which is what the shapes are cut from.
      const ux = px / scale - QUIET_ZONE;
      const uy = py / scale - QUIET_ZONE;
      const mx = Math.floor(ux);
      const my = Math.floor(uy);
      const fx = ux - mx;
      const fy = uy - my;

      const inside = mx >= 0 && my >= 0 && mx < matrix.size && my < matrix.size;
      const on = inside && matrix.modules[my * matrix.size + mx];
      const isDark = inside ? pixelIsDark(matrix, mx, my, fx, fy, on, style) : false;
      const [r, g, b] = isDark ? dark : light;

      const at = (py * total + px) * 4;
      data[at] = r;
      data[at + 1] = g;
      data[at + 2] = b;
      data[at + 3] = 255;
    }
  }

  return { data, width: total, height: total };
}

/** Whether a pixel inside the code is dark, given the module and the style. */
function pixelIsDark(
  matrix: Matrix,
  mx: number,
  my: number,
  fx: number,
  fy: number,
  on: boolean,
  style: Style,
): boolean {
  if (isFinderModule(mx, my, matrix.size)) {
    if (style.finderStyle === "square") return on;
    // Rounded finder: geometry in finder-local coordinates (0..7).
    for (const [ox, oy] of finderOrigins(matrix.size)) {
      if (mx >= ox && mx < ox + 7 && my >= oy && my < oy + 7) {
        return roundedFinderDark(mx - ox + fx, my - oy + fy);
      }
    }
    return on;
  }

  if (!on) return false;
  if (style.moduleShape === "square") return true;
  if (style.moduleShape === "dots") {
    const dx = fx - 0.5;
    const dy = fy - 0.5;
    return dx * dx + dy * dy <= 0.45 * 0.45;
  }
  // rounded
  return insideRoundedRect(fx, fy, 0, 0, 1, 1, 0.3);
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


/**
 * Where a centre logo sits, in the SVG's coordinate space (modules, including
 * the quiet zone).
 *
 * The size is a fraction of the whole code. Kept at or under a fifth, and only
 * ever paired with the H error-correction level, because a logo covers modules
 * and H is what lets the code survive that: it can lose up to about 30% and
 * still decode. A white pad sits behind the logo so it never bleeds into the
 * modules around it.
 *
 * Pure and returned as numbers so the placement is tested rather than trusted:
 * a logo drawn off-centre, or large enough to bury a finder pattern, is how a
 * pretty code becomes an unscannable one.
 */
export type LogoBox = { x: number; y: number; size: number; pad: number };

export function logoPlacement(matrix: Matrix, fraction = 0.2): LogoBox {
  const total = matrix.size + QUIET_ZONE * 2;
  // Clamp so an overeager caller cannot swallow the finder patterns.
  const safe = Math.min(Math.max(fraction, 0.05), 0.22);
  const size = Math.round(total * safe);
  const pad = Math.max(1, Math.round(size * 0.12));
  const x = (total - size) / 2;
  const y = (total - size) / 2;
  return { x, y, size, pad };
}

/**
 * The SVG with a centre logo embedded as a data URI.
 *
 * The image is drawn on top of a white rounded rectangle so it reads cleanly
 * whatever the module colour is. The caller is responsible for having built
 * the matrix at level H; this only draws.
 */
export function toSvgWithLogo(
  matrix: Matrix,
  logoDataUri: string,
  colours: Colours = DEFAULT_COLOURS,
  fraction = 0.2,
  style: Style = DEFAULT_STYLE,
): string {
  const total = matrix.size + QUIET_ZONE * 2;
  const box = logoPlacement(matrix, fraction);
  const outer = box.size + box.pad * 2;
  const rendering =
    style.moduleShape === "square" && style.finderStyle === "square"
      ? ' shape-rendering="crispEdges"'
      : "";

  const radius = Math.max(1, Math.round(outer * 0.14));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${rendering}>`,
    `<rect width="${total}" height="${total}" fill="${colours.light}"/>`,
    `<path fill="${colours.dark}" d="${bodyPath(matrix, style)}"/>`,
    finderSvg(matrix, style, colours),
    `<rect x="${(total - outer) / 2}" y="${(total - outer) / 2}" width="${outer}" height="${outer}" rx="${radius}" fill="${colours.light}"/>`,
    // preserveAspectRatio keeps a non-square logo from being stretched.
    `<image href="${logoDataUri}" x="${box.x}" y="${box.y}" width="${box.size}" height="${box.size}" preserveAspectRatio="xMidYMid meet"/>`,
    `</svg>`,
  ].join("");
}
