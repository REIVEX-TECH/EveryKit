/**
 * Finding the quality that lands a file under a size the user asked for.
 *
 * The encoder is passed in rather than reached for, so the search is pure and
 * testable: the tests hand it a stand-in that maps quality to a size the way a
 * real encoder roughly does, monotonically, and check the search lands on the
 * right side of the target every time. The component passes the real canvas
 * encoder.
 *
 * The search assumes size rises with quality, which is true for JPEG and WebP.
 * It does not assume the relationship is smooth, so it binary-searches a grid
 * of quality steps rather than interpolating, and always returns a real
 * encode rather than a predicted size.
 */

export type Encoded = { quality: number; size: number; blob: Blob };

export type TargetResult = {
  encoded: Encoded;
  /** False when even the lowest quality was still over the target. */
  metTarget: boolean;
  /** How many encodes it took, so the UI can say a batch will be slower. */
  attempts: number;
};

/** Quality steps, coarse enough to be quick and fine enough to be useful. */
const STEPS = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];

/**
 * Binary-search the steps for the highest quality whose encode is at or under
 * `targetBytes`.
 *
 * Returns the best fit if one exists, otherwise the smallest file it could
 * make, flagged so the caller can say the target was not reachable rather than
 * implying it was. Never returns a predicted size: `encoded` is always a real
 * encode that actually happened.
 */
export async function searchForTarget(
  targetBytes: number,
  encode: (quality: number) => Promise<Blob>,
): Promise<TargetResult> {
  let attempts = 0;
  const run = async (quality: number): Promise<Encoded> => {
    const blob = await encode(quality);
    attempts += 1;
    return { quality, size: blob.size, blob };
  };

  // The lowest step is the floor: if even that is over target, nothing will do
  // and there is no point searching above it.
  const floor = await run(STEPS[0]);
  if (floor.size > targetBytes) {
    return { encoded: floor, metTarget: false, attempts };
  }

  // Binary search for the boundary: the highest step still at or under target.
  let lo = 0;
  let hi = STEPS.length - 1;
  let best = floor;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const here = await run(STEPS[mid]);
    if (here.size <= targetBytes) {
      best = here;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return { encoded: best, metTarget: true, attempts };
}
