import { describe, expect, it } from "vitest";
import {
  aspectRatio,
  computeCrop,
  fallbackCrop,
  measureCrop,
  type CropRect,
  type FaceGeometry,
  type ImageSize,
} from "./cropMath";
import { evaluateCompliance } from "./compliance";
import { stageLayout, visibleRegion, windowFullyCovered } from "./stageLayout";
import { specs } from "@/data/specs";

/**
 * The three consumers of the crop rect have to agree.
 *
 * The stage draws a region of the photo, the compliance panel judges a region,
 * and the renderer exports a region. Nothing in the types stops those being
 * three different regions, and when they diverge the tool is convincingly
 * wrong: each half is internally consistent, so it looks like a rendering
 * glitch rather than a disagreement about coordinates.
 *
 * The renderer's region is the rect itself, since renderPhoto passes rect
 * straight to drawImage as the source rectangle. So "agreeing with the export"
 * means "equal to the rect", and that is what is asserted here.
 */

const STAGE_WIDTHS = [340, 552, 900];
const STAGE_HEIGHT = 420;
const WINDOW_FILL = 0.84;

const IMAGES: ImageSize[] = [
  { width: 900, height: 1200 },
  { width: 1200, height: 900 },
  { width: 3024, height: 4032 },
  { width: 4032, height: 3024 },
  { width: 1000, height: 1000 },
];

const face = (x: number, y: number, w: number, h: number): FaceGeometry => ({
  box: { x, y, width: w, height: h },
});

function closeTo(a: CropRect, b: CropRect, tolerance = 0.01): boolean {
  return (
    Math.abs(a.x - b.x) <= tolerance &&
    Math.abs(a.y - b.y) <= tolerance &&
    Math.abs(a.width - b.width) <= tolerance &&
    Math.abs(a.height - b.height) <= tolerance
  );
}

describe("the stage shows exactly what the renderer exports", () => {
  it("holds for every spec, image shape, face position, face size and stage width", () => {
    const disagreements: string[] = [];
    let checked = 0;

    for (const spec of specs) {
      const aspect = aspectRatio(spec);
      for (const image of IMAGES) {
        for (let fx = 0; fx <= 1; fx += 0.5) {
          for (let fy = 0; fy <= 1; fy += 0.5) {
            for (const rel of [0.05, 0.18, 0.5]) {
              const h = image.height * rel;
              const w = h * 0.78;
              const f = face(fx * (image.width - w), fy * (image.height - h), w, h);
              const rect = computeCrop(f, image, spec).rect;

              for (const stageWidth of STAGE_WIDTHS) {
                checked++;
                const layout = stageLayout(
                  rect, image, aspect, stageWidth, STAGE_HEIGHT, WINDOW_FILL,
                );
                const shown = visibleRegion(layout);
                if (!closeTo(shown, rect)) {
                  disagreements.push(
                    `${spec.slug} ${image.width}x${image.height} stage=${stageWidth} ` +
                      `rect=(${rect.x.toFixed(1)},${rect.y.toFixed(1)},${rect.width.toFixed(1)}x${rect.height.toFixed(1)}) ` +
                      `stageShows=(${shown.x.toFixed(1)},${shown.y.toFixed(1)},${shown.width.toFixed(1)}x${shown.height.toFixed(1)})`,
                  );
                }
              }
            }
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(500);
    expect(disagreements).toEqual([]);
  });

  it("keeps the aspect the spec asks for, so the window is never letterboxed", () => {
    for (const spec of specs) {
      const aspect = aspectRatio(spec);
      const layout = stageLayout(
        { x: 0, y: 0, width: 600, height: 600 / aspect },
        { width: 3024, height: 4032 },
        aspect, 552, STAGE_HEIGHT, WINDOW_FILL,
      );
      expect(layout.windowWidth / layout.windowHeight).toBeCloseTo(aspect, 6);
      expect(layout.windowWidth).toBeLessThanOrEqual(552 * WINDOW_FILL + 0.001);
      expect(layout.windowHeight).toBeLessThanOrEqual(STAGE_HEIGHT * WINDOW_FILL + 0.001);
    }
  });

  it("fills the crop window with photo whenever the rect is inside the image", () => {
    // Blank inside the guides means the transform put the photo somewhere the
    // rect does not say it is. That is the reported symptom, so it gets its own
    // assertion rather than being implied by the region check.
    const spec = specs[0];
    const image = { width: 3024, height: 4032 };
    for (const rect of [
      { x: 0, y: 0, width: 900, height: 900 },
      { x: 592, y: 559, width: 1837, height: 1837 },
      { x: 3024 - 800, y: 4032 - 800, width: 800, height: 800 },
      { x: 1200, y: 2000, width: 400, height: 400 },
    ]) {
      for (const stageWidth of STAGE_WIDTHS) {
        const layout = stageLayout(
          rect, image, aspectRatio(spec), stageWidth, STAGE_HEIGHT, WINDOW_FILL,
        );
        expect([rect.width, stageWidth, windowFullyCovered(layout)]).toEqual([
          rect.width, stageWidth, true,
        ]);
      }
    }
  });

  it("agrees for the fallback crop too, not only the detected one", () => {
    for (const spec of specs) {
      for (const image of IMAGES) {
        const rect = fallbackCrop(image, spec).rect;
        const layout = stageLayout(
          rect, image, aspectRatio(spec), 552, STAGE_HEIGHT, WINDOW_FILL,
        );
        expect(closeTo(visibleRegion(layout), rect)).toBe(true);
        expect(windowFullyCovered(layout)).toBe(true);
      }
    }
  });
});

describe("compliance judges the same region the stage shows", () => {
  it("measures against the rect the stage is displaying, on every geometry", () => {
    const mismatches: string[] = [];

    for (const spec of specs) {
      for (const image of IMAGES) {
        for (const rel of [0.08, 0.25, 0.5]) {
          const h = image.height * rel;
          const w = h * 0.78;
          const f = face((image.width - w) / 2, (image.height - h) / 3, w, h);
          const rect = computeCrop(f, image, spec).rect;

          const layout = stageLayout(
            rect, image, aspectRatio(spec), 552, STAGE_HEIGHT, WINDOW_FILL,
          );
          const shown = visibleRegion(layout);

          // Compliance must be reading the same rectangle the stage draws.
          const fromRect = measureCrop(rect, f, spec);
          const fromStage = measureCrop(shown, f, spec);

          if (
            Math.abs(fromRect.headHeightMm - fromStage.headHeightMm) > 0.01 ||
            Math.abs(fromRect.headFraction - fromStage.headFraction) > 0.0001 ||
            Math.abs(fromRect.sourcePixelWidth - fromStage.sourcePixelWidth) > 0.01
          ) {
            mismatches.push(
              `${spec.slug} ${image.width}x${image.height} rel=${rel} ` +
                `rectHead=${fromRect.headHeightMm.toFixed(2)}mm stageHead=${fromStage.headHeightMm.toFixed(2)}mm`,
            );
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("does not fail a crop that computeCrop itself placed", () => {
    // The crop the tool chooses for a well proportioned face, in a photo with
    // pixels to spare, must satisfy the checks the tool then applies to it. If
    // this fails, the placer and the judge disagree about the same geometry,
    // which is the reported symptom: a preview that looks right beside a panel
    // saying it is wrong.
    const wrong: string[] = [];

    for (const spec of specs) {
      if (spec.headMinMm === undefined || spec.headMaxMm === undefined) continue;
      const image = { width: 3024, height: 4032 };

      // A head about a third of the frame: an ordinary selfie distance.
      const boxH = image.height * 0.18;
      const boxW = boxH * 0.78;
      const f = face((image.width - boxW) / 2, image.height * 0.22, boxW, boxH);

      const { rect } = computeCrop(f, image, spec);
      const measurement = measureCrop(rect, f, spec);
      const checks = evaluateCompliance({
        spec, face: f, measurement, faceCount: 1, detectionUnavailable: false,
      });
      const failed = checks.filter((c) => c.status === "fail");
      if (failed.length > 0) {
        wrong.push(
          `${spec.slug}: ${failed.map((c) => `${c.id} (${c.detail ?? ""})`).join(" ")} ` +
            `head=${measurement.headHeightMm.toFixed(1)}mm across=${Math.round(measurement.sourcePixelWidth)}px`,
        );
      }
    }

    expect(wrong).toEqual([]);
  });

  it("fails the detail check only when the crop really is short of pixels", () => {
    const spec = specs[0];
    const bigEnough = { x: 0, y: 0, width: spec.pixelWidth * 1.5, height: spec.pixelHeight * 1.5 };
    const tooSmall = { x: 0, y: 0, width: spec.pixelWidth * 0.4, height: spec.pixelHeight * 0.4 };

    const headFor = (rect: CropRect) => {
      const boxH = ((spec.headMinMm! + spec.headMaxMm!) / 2 / spec.heightMm) * rect.height / 1.1;
      return face(rect.x + rect.width / 2 - boxH * 0.39, rect.y + rect.height * 0.22, boxH * 0.78, boxH);
    };

    for (const [rect, shouldPass] of [[bigEnough, true], [tooSmall, false]] as const) {
      const f = headFor(rect);
      const checks = evaluateCompliance({
        spec, face: f, measurement: measureCrop(rect, f, spec),
        faceCount: 1, detectionUnavailable: false,
      });
      const resolution = checks.find((c) => c.id === "resolution")!;
      expect([rect.width, resolution.status === "pass"]).toEqual([rect.width, shouldPass]);
      // And the head check must not be collateral damage of the size change.
      expect([rect.width, checks.find((c) => c.id === "head")!.status]).toEqual([
        rect.width, "pass",
      ]);
    }

  });
});
