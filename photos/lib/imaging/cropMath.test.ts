import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  clampRectToImage,
  computeCrop,
  estimateHeadMetrics,
  eyeTilt,
  eyeTiltDegrees,
  fallbackCrop,
  measureCrop,
  overlayGuides,
  targetHeadFraction,
  type FaceGeometry,
  type ImageSize,
} from "./cropMath";
import { getSpec, mmToPx, specs, type PhotoSpec } from "@/data/specs";

const US = getSpec("us-passport")!;
const UK = getSpec("uk-passport")!;
const PK = getSpec("pakistan-passport")!;

/**
 * A spec whose authority publishes no chin-to-crown range, used to exercise the
 * generic-framing path. Pakistan filled this role until its 70-80% rule was
 * verified and converted into millimetres.
 */
const NO_RANGE = getSpec("india-passport")!;

/** A 3000 x 4000 portrait selfie with a face roughly where a selfie puts one. */
const IMAGE: ImageSize = { width: 3000, height: 4000 };

function face(overrides: Partial<FaceGeometry> = {}): FaceGeometry {
  const box = { x: 1100, y: 900, width: 800, height: 1000 };
  const eyeY = box.y + box.height * 0.32;
  return {
    box,
    leftEye: { x: box.x + box.width * 0.68, y: eyeY },
    rightEye: { x: box.x + box.width * 0.32, y: eyeY },
    ...overrides,
  };
}

describe("specs data", () => {
  it("stores pixel dimensions that match the millimetre size at the stated DPI", () => {
    for (const spec of specs) {
      expect([spec.slug, spec.pixelWidth]).toEqual([
        spec.slug,
        mmToPx(spec.widthMm, spec.dpi),
      ]);
      expect([spec.slug, spec.pixelHeight]).toEqual([
        spec.slug,
        mmToPx(spec.heightMm, spec.dpi),
      ]);
    }
  });

  it("never publishes a head range that is inverted or larger than the frame", () => {
    for (const spec of specs) {
      if (spec.headMinMm === undefined || spec.headMaxMm === undefined) continue;
      expect(spec.headMinMm).toBeLessThan(spec.headMaxMm);
      expect(spec.headMaxMm).toBeLessThan(spec.heightMm);
    }
  });

  it("uses unique slugs", () => {
    expect(new Set(specs.map((s) => s.slug)).size).toBe(specs.length);
  });
});

describe("estimateHeadMetrics", () => {
  it("lifts the crown above the detector box and takes the chin at its base", () => {
    const m = estimateHeadMetrics(face());
    expect(m.crownY).toBeCloseTo(900 - 100, 6); // 10% hair allowance of 1000
    expect(m.chinY).toBe(1900);
    expect(m.headHeightPx).toBeCloseTo(1100, 6);
    expect(m.centerX).toBe(1500);
  });

  it("uses the eye points when present and estimates them when not", () => {
    expect(estimateHeadMetrics(face()).eyeEstimated).toBe(false);
    const noEyes = estimateHeadMetrics({ box: face().box });
    expect(noEyes.eyeEstimated).toBe(true);
    expect(noEyes.eyeY).toBeGreaterThan(noEyes.crownY);
    expect(noEyes.eyeY).toBeLessThan(noEyes.chinY);
  });
});

describe("targetHeadFraction", () => {
  it("aims at the middle of a published range", () => {
    // US: 25.4 to 34.9 mm inside a 50.8 mm frame.
    expect(targetHeadFraction(US).fraction).toBeCloseTo(30.15 / 50.8, 6);
    expect(targetHeadFraction(US).isGeneric).toBe(false);
  });

  it("falls back to a generic ratio when the spec publishes nothing", () => {
    const t = targetHeadFraction(NO_RANGE);
    expect(t.isGeneric).toBe(true);
    expect(t.fraction).toBeCloseTo(0.65, 6);
  });
});

/**
 * The important property: for any spec with a published range, the automatic
 * crop must land the head inside that range.
 */
describe.each([
  ["US passport", US],
  ["UK passport", UK],
  ["Pakistan passport", PK],
])("computeCrop for %s", (_name, spec: PhotoSpec) => {
  const plan = computeCrop(face(), IMAGE, spec);
  const measured = measureCrop(plan.rect, face(), spec);

  it("produces a rect with the spec's aspect ratio", () => {
    expect(plan.rect.width / plan.rect.height).toBeCloseTo(aspectRatio(spec), 6);
  });

  it("keeps the rect inside the source image", () => {
    expect(plan.rect.x).toBeGreaterThanOrEqual(0);
    expect(plan.rect.y).toBeGreaterThanOrEqual(0);
    expect(plan.rect.x + plan.rect.width).toBeLessThanOrEqual(IMAGE.width + 1e-6);
    expect(plan.rect.y + plan.rect.height).toBeLessThanOrEqual(IMAGE.height + 1e-6);
  });

  it("lands the head height inside the published range", () => {
    if (spec.headMinMm === undefined || spec.headMaxMm === undefined) {
      // No published range, so only the generic framing is asserted.
      expect(measured.headFraction).toBeCloseTo(0.65, 2);
      return;
    }
    expect(measured.headHeightMm).toBeGreaterThanOrEqual(spec.headMinMm);
    expect(measured.headHeightMm).toBeLessThanOrEqual(spec.headMaxMm);
  });

  it("keeps the whole head in frame with room above the crown", () => {
    expect(measured.crownFraction).toBeGreaterThan(0);
    expect(measured.chinFraction).toBeLessThan(1);
    expect(measured.crownFraction).toBeLessThan(measured.chinFraction);
  });

  it("centres the face horizontally", () => {
    const faceCenter = 1500;
    expect(plan.rect.x + plan.rect.width / 2).toBeCloseTo(faceCenter, 6);
  });
});

describe("computeCrop vertical anchoring", () => {
  it("puts the eyes inside the published band for the US spec", () => {
    const plan = computeCrop(face(), IMAGE, US);
    const measured = measureCrop(plan.rect, face(), US);
    const [minMm, maxMm] = US.eyeLineFromBottomMm!;
    expect(measured.eyeFromBottomMm).toBeGreaterThanOrEqual(minMm);
    expect(measured.eyeFromBottomMm).toBeLessThanOrEqual(maxMm);
  });

  it("uses a top margin for the UK spec, which publishes no eye line", () => {
    const plan = computeCrop(face(), IMAGE, UK);
    const measured = measureCrop(plan.rect, face(), UK);
    // Head is ~31.5 of 45 mm, so the margin above the crown is the remaining
    // 30% of the frame times TOP_MARGIN_SHARE.
    expect(measured.crownFraction).toBeCloseTo((1 - 31.5 / 45) * 0.27, 2);
  });
});

describe("computeCrop under awkward inputs", () => {
  it("shrinks rather than overflowing when the ideal frame is too large", () => {
    const tiny: ImageSize = { width: 400, height: 500 };
    const smallFace: FaceGeometry = {
      box: { x: 60, y: 40, width: 280, height: 360 },
    };
    const plan = computeCrop(smallFace, tiny, UK);
    expect(plan.shrunk).toBe(true);
    expect(plan.rect.width).toBeLessThanOrEqual(tiny.width + 1e-6);
    expect(plan.rect.height).toBeLessThanOrEqual(tiny.height + 1e-6);
  });

  it("slides the rect inside the image for a face at the very edge", () => {
    const edgeFace = face({ box: { x: 20, y: 30, width: 500, height: 620 } });
    const plan = computeCrop(edgeFace, IMAGE, US);
    expect(plan.clamped).toBe(true);
    expect(plan.rect.x).toBe(0);
  });

  it("keeps the crown in frame when the eye-line anchor would push it off the top", () => {
    // Crown lands at y=50, still inside the image, but the US eye-line anchor
    // on its own would place the crop top below it.
    const highFace = face({ box: { x: 1100, y: 150, width: 800, height: 1000 } });
    const plan = computeCrop(highFace, IMAGE, US);
    const measured = measureCrop(plan.rect, highFace, US);
    expect(plan.crownCutOff).toBe(false);
    expect(measured.crownFraction).toBeGreaterThanOrEqual(0);
    expect(measured.chinFraction).toBeLessThanOrEqual(1);
  });

  it("reports a cut-off crown rather than pretending the head fits", () => {
    // The top of the head is outside the source photo, so no crop can contain it.
    const cropped = face({ box: { x: 1100, y: 40, width: 800, height: 1000 } });
    const plan = computeCrop(cropped, IMAGE, US);
    expect(plan.crownCutOff).toBe(true);
  });

  it("reports a cut-off chin", () => {
    const low = face({ box: { x: 1100, y: 3400, width: 800, height: 1000 } });
    expect(computeCrop(low, IMAGE, US).chinCutOff).toBe(true);
  });
});

describe("fallbackCrop", () => {
  it("returns a centred rect of the right shape that fits the image", () => {
    const plan = fallbackCrop(IMAGE, UK);
    expect(plan.rect.width / plan.rect.height).toBeCloseTo(aspectRatio(UK), 6);
    expect(plan.rect.x + plan.rect.width).toBeLessThanOrEqual(IMAGE.width);
    expect(plan.rect.y + plan.rect.height).toBeLessThanOrEqual(IMAGE.height);
    expect(plan.rect.x + plan.rect.width / 2).toBeCloseTo(IMAGE.width / 2, 6);
  });
});

describe("overlayGuides", () => {
  it("orders the guide lines crown, eye, chin down the frame", () => {
    for (const spec of [US, UK, NO_RANGE]) {
      const g = overlayGuides(spec);
      expect(g.crownMinFraction).toBeLessThanOrEqual(g.crownMaxFraction);
      expect(g.crownMaxFraction).toBeLessThan(g.eyeMinFraction);
      expect(g.eyeMaxFraction).toBeLessThan(g.chinMinFraction);
      expect(g.chinMaxFraction).toBeLessThanOrEqual(1);
      expect(g.crownMinFraction).toBeGreaterThanOrEqual(0);
    }
  });

  it("reports published ranges where they exist and a generic one otherwise", () => {
    expect(overlayGuides(US).headMinMm).toBeCloseTo(25.4, 4);
    expect(overlayGuides(US).headMaxMm).toBeCloseTo(34.9, 4);
    expect(overlayGuides(US).isGeneric).toBe(false);
    expect(overlayGuides(PK).isGeneric).toBe(false);
    expect(overlayGuides(NO_RANGE).isGeneric).toBe(true);
  });

  it("agrees with where computeCrop actually puts the head", () => {
    for (const spec of [US, UK, PK, NO_RANGE]) {
      const plan = computeCrop(face(), IMAGE, spec);
      const measured = measureCrop(plan.rect, face(), spec);
      const g = overlayGuides(spec);
      expect(measured.crownFraction).toBeGreaterThanOrEqual(g.crownMinFraction - 0.02);
      expect(measured.crownFraction).toBeLessThanOrEqual(g.crownMaxFraction + 0.02);
    }
  });
});

describe("eye tilt", () => {
  it("is zero for level eyes", () => {
    expect(eyeTilt(face())).toBeCloseTo(0, 6);
    expect(eyeTiltDegrees(face())).toBeCloseTo(0, 6);
  });

  it("grows with a tilted head", () => {
    const tilted = face();
    tilted.leftEye = { x: tilted.leftEye!.x, y: tilted.leftEye!.y + 100 };
    expect(eyeTilt(tilted)!).toBeGreaterThan(0.15);
    expect(eyeTiltDegrees(tilted)!).toBeGreaterThan(8);
  });

  it("is null without eye points", () => {
    expect(eyeTilt({ box: face().box })).toBeNull();
  });
});

describe("clampRectToImage", () => {
  it("slides without resizing", () => {
    const r = clampRectToImage({ x: -50, y: 5000, width: 600, height: 600 }, IMAGE);
    expect(r.width).toBe(600);
    expect(r.x).toBe(0);
    expect(r.y).toBe(3400);
  });
});
