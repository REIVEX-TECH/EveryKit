import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  computeCrop,
  estimateHeadMetrics,
  fallbackCrop,
  type CropRect,
  type FaceGeometry,
  type ImageSize,
} from "./cropMath";
import { specs } from "@/data/specs";

/**
 * The invariant the crop stage depends on: whatever the detector reports, the
 * head it reported must end up inside the frame the user is shown.
 *
 * When this breaks, the symptom is the one from the bug report — the guides sit
 * over empty background while the subject is somewhere else. The stage and the
 * export both read the same rect, so they stay in agreement with each other
 * while agreeing on the wrong place, which is why it looks like a coordinate
 * mismatch and is not one.
 */

const face = (x: number, y: number, w: number, h: number): FaceGeometry => ({
  box: { x, y, width: w, height: h },
});

function contains(f: FaceGeometry, rect: CropRect) {
  const head = estimateHeadMetrics(f);
  return {
    left: f.box.x >= rect.x - 0.5,
    right: f.box.x + f.box.width <= rect.x + rect.width + 0.5,
    crown: head.crownY >= rect.y - 0.5,
    chin: head.chinY <= rect.y + rect.height + 0.5,
  };
}

const held = { left: true, right: true, crown: true, chin: true };

/**
 * Whether any crop of this spec's shape could contain this head at all. A head
 * taller than the photo, or wider than the widest legal frame, cannot be framed
 * by anything — that is a retake, not a bug.
 */
function headCouldFit(f: FaceGeometry, image: ImageSize, ratio: number): boolean {
  const head = estimateHeadMetrics(f);
  const maxHeight = Math.min(image.height, image.width / ratio);
  return (
    head.crownY >= 0 &&
    head.chinY <= image.height &&
    head.headHeightPx <= maxHeight &&
    f.box.width <= maxHeight * ratio
  );
}

const IMAGES: ImageSize[] = [
  { width: 900, height: 1200 },
  { width: 1200, height: 900 },
  { width: 3024, height: 4032 },
  { width: 1000, height: 1000 },
];

describe("computeCrop keeps the detected head inside the crop", () => {
  it("holds for an ordinary face in the middle of the frame", () => {
    const f = face(350, 300, 200, 260);
    const { rect } = computeCrop(f, { width: 900, height: 1200 }, specs[0]);
    expect(contains(f, rect)).toEqual(held);
  });

  it("holds for the close-up selfie that used to break it", () => {
    // The exact geometry from the sweep: a head filling most of the photo, so
    // the ideal frame is larger than the image and has to shrink. The old code
    // shrank about the frame's centre and pushed the crown out of shot.
    const f = face(0, 120, 749, 960);
    const spec = specs.find((s) => s.slug === "uk-passport")!;
    const { rect, shrunk } = computeCrop(f, { width: 900, height: 1200 }, spec);
    expect(shrunk).toBe(true);
    expect(contains(f, rect)).toEqual(held);
    // Specifically: the crown, which is what used to fall out.
    expect(estimateHeadMetrics(f).crownY).toBeGreaterThanOrEqual(rect.y - 0.5);
  });

  /**
   * A sweep rather than a handful of cases. The reported failure was a real
   * photo nobody had thought to try, so the test tries the space instead of
   * guessing which photo is next.
   */
  it("holds across every spec, image shape, face position and face size", () => {
    const missed: string[] = [];
    let checked = 0;

    for (const spec of specs) {
      const ratio = aspectRatio(spec);
      for (const image of IMAGES) {
        for (let fx = 0; fx <= 1; fx += 0.25) {
          for (let fy = 0; fy <= 1; fy += 0.25) {
            for (const rel of [0.08, 0.2, 0.45, 0.8]) {
              const h = image.height * rel;
              const w = h * 0.78;
              const f = face(fx * (image.width - w), fy * (image.height - h), w, h);
              if (!headCouldFit(f, image, ratio)) continue;

              checked++;
              const { rect } = computeCrop(f, image, spec);
              const inside = contains(f, rect);
              if (inside.left && inside.right && inside.crown && inside.chin) continue;

              const head = estimateHeadMetrics(f);
              missed.push(
                `${spec.slug} ${image.width}x${image.height} ` +
                  `face=(${Math.round(f.box.x)},${Math.round(f.box.y)},${Math.round(w)}x${Math.round(h)}) ` +
                  `crownY=${Math.round(head.crownY)} chinY=${Math.round(head.chinY)} ` +
                  `rect=(${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)}x${Math.round(rect.height)}) ` +
                  `outside=${Object.entries(inside).filter(([, v]) => !v).map(([k]) => k).join(",")}`,
              );
            }
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(500);
    expect(missed).toEqual([]);
  });

  it("says so when the head genuinely cannot be framed, rather than cropping it silently", () => {
    // A head taller than the photo: no crop can hold it, and the plan has to
    // report that so the UI can ask for a retake.
    const image = { width: 1000, height: 1000 };
    const f = face(100, -100, 700, 900);
    const plan = computeCrop(f, image, specs[0]);
    expect(plan.crownCutOff).toBe(true);
  });
});

describe("fallbackCrop", () => {
  it("centres the crop, and never parks it in a corner", () => {
    for (const spec of specs) {
      for (const image of IMAGES) {
        const { rect } = fallbackCrop(image, spec);

        const centreX = rect.x + rect.width / 2;
        const centreY = rect.y + rect.height / 2;
        expect(centreX).toBeCloseTo(image.width / 2, 6);
        expect(centreY).toBeCloseTo(image.height / 2, 6);

        // Inside the image, the right shape, and not degenerate.
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(image.width + 0.001);
        expect(rect.y + rect.height).toBeLessThanOrEqual(image.height + 0.001);
        expect(rect.width / rect.height).toBeCloseTo(aspectRatio(spec), 6);
        expect(rect.width).toBeGreaterThan(0);
      }
    }
  });

  it("leaves room to zoom out rather than filling the frame edge to edge", () => {
    const image = { width: 1000, height: 1000 };
    const { rect } = fallbackCrop(image, specs[0]);
    expect(rect.width).toBeLessThan(image.width);
    expect(rect.height).toBeLessThan(image.height);
  });
});
