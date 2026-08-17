import { describe, expect, it } from "vitest";
import { evaluateCompliance, hasBlockingFailure, type ComplianceCheck } from "./compliance";
import { computeCrop, measureCrop, type FaceGeometry, type ImageSize } from "./cropMath";
import { getSpec } from "@/data/specs";

const US = getSpec("us-passport")!;
/** A spec whose authority publishes no chin-to-crown range. */
const NO_RANGE = getSpec("india-passport")!;
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

function statusOf(checks: ComplianceCheck[], id: string) {
  return checks.find((c) => c.id === id)?.status;
}

function evaluateAutoCrop(spec = US, f = face(), image = IMAGE, faceCount = 1) {
  const plan = computeCrop(f, image, spec);
  return evaluateCompliance({
    spec,
    face: f,
    measurement: measureCrop(plan.rect, f, spec),
    faceCount,
  });
}

describe("evaluateCompliance on a good photo", () => {
  const checks = evaluateAutoCrop();

  it("passes the geometry checks the auto-crop is responsible for", () => {
    expect(statusOf(checks, "face")).toBe("pass");
    expect(statusOf(checks, "head")).toBe("pass");
    expect(statusOf(checks, "framing")).toBe("pass");
    expect(statusOf(checks, "eyeline")).toBe("pass");
    expect(statusOf(checks, "level")).toBe("pass");
    expect(statusOf(checks, "resolution")).toBe("pass");
  });

  it("does not block the download", () => {
    expect(hasBlockingFailure(checks)).toBe(false);
  });
});

describe("evaluateCompliance is honest about what it cannot see", () => {
  it("returns unknown, not a green tick, when the spec publishes no head range", () => {
    const checks = evaluateAutoCrop(NO_RANGE);
    expect(statusOf(checks, "head")).toBe("unknown");
    expect(checks.find((c) => c.id === "head")?.detail).toContain("does not publish");
  });

  it("omits the eye-line check for a spec that publishes no eye line", () => {
    expect(evaluateAutoCrop(NO_RANGE).find((c) => c.id === "eyeline")).toBeUndefined();
  });

  it("returns unknown for head level when there are no eye points", () => {
    const noEyes: FaceGeometry = { box: face().box };
    expect(statusOf(evaluateAutoCrop(US, noEyes), "level")).toBe("unknown");
  });

  it("returns unknown rather than failing when detection could not run", () => {
    const checks = evaluateCompliance({
      spec: US,
      face: null,
      measurement: null,
      faceCount: 0,
      detectionUnavailable: true,
    });
    expect(statusOf(checks, "face")).toBe("unknown");
    expect(hasBlockingFailure(checks)).toBe(false);
  });
});

describe("evaluateCompliance on problems", () => {
  it("fails when no face was found", () => {
    const checks = evaluateCompliance({ spec: US, face: null, measurement: null, faceCount: 0 });
    expect(statusOf(checks, "face")).toBe("fail");
    expect(hasBlockingFailure(checks)).toBe(true);
  });

  it("warns when there is more than one person in the photo", () => {
    expect(statusOf(evaluateAutoCrop(US, face(), IMAGE, 2), "face")).toBe("warn");
  });

  it("warns about a tilted head without blocking the download", () => {
    const tilted = face();
    tilted.leftEye = { x: tilted.leftEye!.x, y: tilted.leftEye!.y + 90 };
    const checks = evaluateAutoCrop(US, tilted);
    expect(statusOf(checks, "level")).toBe("warn");
    expect(hasBlockingFailure(checks)).toBe(false);
  });

  it("fails a head cropped too small and says which way to move", () => {
    const f = face();
    const plan = computeCrop(f, IMAGE, US);
    // Double the frame, halving the head's share of it.
    const wide = { ...plan.rect, width: plan.rect.width * 2, height: plan.rect.height * 2 };
    const checks = evaluateCompliance({
      spec: US,
      face: f,
      measurement: measureCrop(wide, f, US),
      faceCount: 1,
    });
    expect(statusOf(checks, "head")).toBe("fail");
    expect(checks.find((c) => c.id === "head")?.detail).toContain("Zoom in");
  });

  it("warns when the crop has fewer pixels than the output needs", () => {
    // A small face in a small photo: the crop covers ~370 px, well under the
    // 600 px the US spec needs.
    const smallImage: ImageSize = { width: 500, height: 650 };
    const smallFace = face({ box: { x: 150, y: 120, width: 170, height: 200 } });
    const plan = computeCrop(smallFace, smallImage, US);
    const checks = evaluateCompliance({
      spec: US,
      face: smallFace,
      measurement: measureCrop(plan.rect, smallFace, US),
      faceCount: 1,
    });
    expect(["warn", "fail"]).toContain(statusOf(checks, "resolution"));
  });

  it("fails framing when the crown sits above the top of the frame", () => {
    const f = face();
    const plan = computeCrop(f, IMAGE, US);
    // Push the crop window down past the top of the head.
    const shifted = { ...plan.rect, y: plan.rect.y + plan.rect.height * 0.3 };
    const checks = evaluateCompliance({
      spec: US,
      face: f,
      measurement: measureCrop(shifted, f, US),
      faceCount: 1,
    });
    expect(statusOf(checks, "framing")).toBe("fail");
    expect(checks.find((c) => c.id === "framing")?.detail).toContain("top of the head");
  });
});
