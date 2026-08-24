/**
 * Perspective correction for the scan tool, hand-written rather than pulled
 * from a computer-vision library.
 *
 * A phone photo of a page is a quadrilateral, not a rectangle: the far edge is
 * shorter than the near one and the corners are not square. Correcting it is a
 * projective warp, which an affine canvas transform cannot do. Rather than add
 * a CV dependency for one function, this solves the eight-parameter homography
 * directly and samples the source image through it. It is a few dozen lines and
 * has no runtime cost beyond the pixels it touches.
 *
 * Corners are always in the order top-left, top-right, bottom-right,
 * bottom-left, the same order the overlay stores its handles in.
 */

export type Point = { x: number; y: number };

/** A small dense matrix type, just enough for the 8x8 solve. */
type Row = number[];

/**
 * Solve the homography mapping the four `src` points onto the four `dst`
 * points. Returns the nine coefficients of the 3x3 matrix in row-major order,
 * with the bottom-right fixed at 1.
 *
 * Each correspondence contributes two rows to an 8x8 linear system, which is
 * solved by Gaussian elimination with partial pivoting.
 */
export function solveHomography(src: Point[], dst: Point[]): number[] {
  if (src.length !== 4 || dst.length !== 4) {
    throw new Error("A homography needs exactly four point pairs.");
  }

  const a: Row[] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = src[i];
    const { x: X, y: Y } = dst[i];
    // x' = (h0 x + h1 y + h2) / (h6 x + h7 y + 1)
    a.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    b.push(X);
    // y' = (h3 x + h4 y + h5) / (h6 x + h7 y + 1)
    a.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    b.push(Y);
  }

  const h = gaussianSolve(a, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/** Apply a 3x3 homography (row-major, 9 entries) to a point. */
export function applyHomography(h: number[], x: number, y: number): Point {
  const denominator = h[6] * x + h[7] * y + h[8];
  return {
    x: (h[0] * x + h[1] * y + h[2]) / denominator,
    y: (h[3] * x + h[4] * y + h[5]) / denominator,
  };
}

/** Solve a square linear system by Gaussian elimination with partial pivoting. */
function gaussianSolve(matrix: Row[], vector: number[]): number[] {
  const n = vector.length;
  // Work on an augmented copy so the inputs are left alone.
  const m = matrix.map((row, i) => [...row, vector[i]]);

  for (let col = 0; col < n; col += 1) {
    // Pivot: the row with the largest magnitude in this column, for stability.
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) {
      throw new Error("Those corners are degenerate; they do not form a quad.");
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];

    // Eliminate this column from every other row.
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = m[row][col] / m[col][col];
      for (let k = col; k <= n; k += 1) m[row][k] -= factor * m[col][k];
    }
  }

  return m.map((row, i) => row[n] / row[i]);
}

export type Raster = { data: Uint8ClampedArray; width: number; height: number };

/**
 * Warp the quadrilateral `srcQuad` out of `src` into an upright `dstW` x `dstH`
 * rectangle, sampling with bilinear interpolation.
 *
 * The map is built from the output rectangle back to the source quad, so every
 * output pixel is filled from exactly one place in the source and there are no
 * holes. Pixels that fall outside the source are left white, which is the right
 * colour for a page and hides a corner dragged a little past the edge.
 */
export function warpPerspective(
  src: Raster,
  srcQuad: Point[],
  dstW: number,
  dstH: number,
): Raster {
  const rect: Point[] = [
    { x: 0, y: 0 },
    { x: dstW, y: 0 },
    { x: dstW, y: dstH },
    { x: 0, y: dstH },
  ];
  // Output pixel -> source pixel.
  const h = solveHomography(rect, srcQuad);

  const out = new Uint8ClampedArray(dstW * dstH * 4);
  const { data, width: sw, height: sh } = src;

  for (let y = 0; y < dstH; y += 1) {
    for (let x = 0; x < dstW; x += 1) {
      const p = applyHomography(h, x + 0.5, y + 0.5);
      const oi = (y * dstW + x) * 4;
      if (p.x < 0 || p.y < 0 || p.x >= sw || p.y >= sh) {
        out[oi] = out[oi + 1] = out[oi + 2] = 255;
        out[oi + 3] = 255;
        continue;
      }
      sampleBilinear(data, sw, sh, p.x, p.y, out, oi);
    }
  }

  return { data: out, width: dstW, height: dstH };
}

/** Bilinear sample of a source raster into an output slot. */
function sampleBilinear(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  fx: number,
  fy: number,
  out: Uint8ClampedArray,
  oi: number,
): void {
  const x0 = Math.floor(fx - 0.5);
  const y0 = Math.floor(fy - 0.5);
  const x1 = Math.min(x0 + 1, sw - 1);
  const y1 = Math.min(y0 + 1, sh - 1);
  const cx0 = Math.max(0, x0);
  const cy0 = Math.max(0, y0);
  const wx = fx - 0.5 - x0;
  const wy = fy - 0.5 - y0;

  for (let c = 0; c < 4; c += 1) {
    const p00 = data[(cy0 * sw + cx0) * 4 + c];
    const p10 = data[(cy0 * sw + x1) * 4 + c];
    const p01 = data[(y1 * sw + cx0) * 4 + c];
    const p11 = data[(y1 * sw + x1) * 4 + c];
    const top = p00 + (p10 - p00) * wx;
    const bottom = p01 + (p11 - p01) * wx;
    out[oi + c] = top + (bottom - top) * wy;
  }
}

/**
 * Estimate the upright size for a warped quad, from the average of its opposite
 * edge lengths. This keeps the corrected page close to the proportions it had
 * in the photo rather than squashing it to a fixed shape.
 */
export function estimateSize(quad: Point[], cap = 1600): { width: number; height: number } {
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const top = dist(quad[0], quad[1]);
  const bottom = dist(quad[3], quad[2]);
  const left = dist(quad[0], quad[3]);
  const right = dist(quad[1], quad[2]);
  let width = Math.max(1, Math.round((top + bottom) / 2));
  let height = Math.max(1, Math.round((left + right) / 2));

  // Cap the long edge so a big photo does not allocate an enormous canvas.
  const longEdge = Math.max(width, height);
  if (longEdge > cap) {
    const scale = cap / longEdge;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }
  return { width, height };
}
