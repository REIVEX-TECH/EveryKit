/**
 * Composing quarter turns and mirrors into one canvas transform.
 *
 * The EXIF orientation a camera writes is handled before this, by decoding
 * with `createImageBitmap(file, { imageOrientation: "from-image" })`, so the
 * bitmap that reaches the canvas is already the right way up. This is only the
 * turns and flips the user then asks for on top, which is the part worth
 * testing: getting the output size wrong on a 90-degree turn, or a flip that
 * silently does nothing, is invisible until someone looks at the result.
 *
 * Pure on purpose. A transform is six numbers, and the test maps the image's
 * corners through them and checks each lands where the eye expects, which is a
 * far surer thing than squinting at a rendered photo.
 */

export type Quarter = 0 | 90 | 180 | 270;

export type Orient = {
  /** Degrees clockwise. */
  rotate: Quarter;
  flipH: boolean;
  flipV: boolean;
};

export const IDENTITY: Orient = { rotate: 0, flipH: false, flipV: false };

/** Add a quarter turn clockwise. */
export function rotateCW(state: Orient): Orient {
  return { ...state, rotate: ((state.rotate + 90) % 360) as Quarter };
}

/** Add a quarter turn anticlockwise. */
export function rotateCCW(state: Orient): Orient {
  return { ...state, rotate: ((state.rotate + 270) % 360) as Quarter };
}

export function flipHorizontal(state: Orient): Orient {
  return { ...state, flipH: !state.flipH };
}

export function flipVertical(state: Orient): Orient {
  return { ...state, flipV: !state.flipV };
}

export function isIdentity(state: Orient): boolean {
  return state.rotate === 0 && !state.flipH && !state.flipV;
}

/** The output size, with width and height swapped for a quarter turn. */
export function outputSize(
  source: { width: number; height: number },
  state: Orient,
): { width: number; height: number } {
  const turned = state.rotate === 90 || state.rotate === 270;
  return turned
    ? { width: source.height, height: source.width }
    : { width: source.width, height: source.height };
}

export type Matrix = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

/**
 * The transform to hand to `ctx.setTransform` before drawing the source at
 * (0, 0). It maps source pixels into the output canvas, so the caller draws
 * the untransformed image and this places it.
 *
 * Flips are applied first, in the source's own frame, then the rotation, then
 * a translation that brings the result back into the positive quadrant so the
 * whole image lands on the canvas rather than off its edges. That order is why
 * "rotate then flip" and "flip then rotate" do not disagree here: the flip is
 * always in source space.
 */
export function transformFor(
  source: { width: number; height: number },
  state: Orient,
): Matrix {
  const { width: w, height: h } = source;
  const sx = state.flipH ? -1 : 1;
  const sy = state.flipV ? -1 : 1;

  // The linear part: a flip in source space, then a quarter turn. cos/sin for
  // 0/90/180/270 are exact integers, so these are written directly rather than
  // via Math, which keeps the matrix free of floating-point dust.
  let a: number, b: number, c: number, d: number;
  switch (state.rotate) {
    case 90:
      a = 0; b = sx; c = -sy; d = 0;
      break;
    case 180:
      a = -sx; b = 0; c = 0; d = -sy;
      break;
    case 270:
      a = 0; b = -sx; c = sy; d = 0;
      break;
    default:
      a = sx; b = 0; c = 0; d = sy;
  }

  // The translation is derived, not guessed: map the four corners through the
  // linear part alone, then shift by the most-negative corner so the whole
  // image sits in the positive quadrant. This is correct for every flip and
  // turn combination by construction, rather than by a table of signs that has
  // to be right eight times over.
  const corners = [
    [0, 0], [w, 0], [0, h], [w, h],
  ].map(([x, y]) => ({ x: a * x + c * y, y: b * x + d * y }));
  const minX = Math.min(...corners.map((p) => p.x));
  const minY = Math.min(...corners.map((p) => p.y));

  return { a, b, c, d, e: -minX, f: -minY };
}

/**
 * Map a point through a matrix. Only used by the tests, but it lives here so
 * the matrix and the thing that interprets it cannot drift apart.
 */
export function apply(m: Matrix, x: number, y: number): { x: number; y: number } {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}
