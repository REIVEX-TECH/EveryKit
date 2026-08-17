/**
 * The compliance checks.
 *
 * Two rules govern this file. Only claim what the pixels actually show — a
 * check that cannot be made returns "unknown" rather than a green tick. And
 * never promise acceptance: the wording throughout is that the photo meets the
 * published size requirements, which is a fact about geometry, not a prediction
 * about what an official will decide.
 */

import type { PhotoSpec } from "@/data/specs";
import { eyeTiltDegrees, type CropMeasurement, type FaceGeometry } from "./cropMath";

export type CheckStatus = "pass" | "warn" | "fail" | "unknown";

export type ComplianceCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  /** Shown under the label when there is something worth saying. */
  detail?: string;
};

/** Eyes within this many degrees of level read as straight-on. */
const EYE_LEVEL_TOLERANCE_DEGREES = 4;

/** Below this share of the required pixels, the photo is being enlarged too far. */
const RESOLUTION_WARN_RATIO = 1;
const RESOLUTION_FAIL_RATIO = 0.75;

export type ComplianceInput = {
  spec: PhotoSpec;
  face: FaceGeometry | null;
  measurement: CropMeasurement | null;
  /** Number of faces the detector found in the photo. */
  faceCount: number;
  /** True when the detector could not run at all in this browser. */
  detectionUnavailable?: boolean;
};

export function evaluateCompliance(input: ComplianceInput): ComplianceCheck[] {
  const { spec, face, measurement, faceCount, detectionUnavailable } = input;
  const checks: ComplianceCheck[] = [];

  // 1. Is there exactly one face.
  if (detectionUnavailable) {
    checks.push({
      id: "face",
      label: "One face, facing the camera",
      status: "unknown",
      detail: "Face detection could not run here, so you are placing the head yourself.",
    });
  } else if (!face) {
    checks.push({
      id: "face",
      label: "One face, facing the camera",
      status: "fail",
      detail: "No face found. Position the head inside the guides yourself, or try a clearer photo.",
    });
  } else if (faceCount > 1) {
    checks.push({
      id: "face",
      label: "One face, facing the camera",
      status: "warn",
      detail: `${faceCount} faces found. The photo must show only you.`,
    });
  } else {
    checks.push({ id: "face", label: "One face, facing the camera", status: "pass" });
  }

  // 2. Head height against the published range.
  const headLabel = "Head height inside the required range";
  if (!measurement) {
    checks.push({ id: "head", label: headLabel, status: "unknown" });
  } else if (spec.headMinMm === undefined || spec.headMaxMm === undefined) {
    checks.push({
      id: "head",
      label: headLabel,
      status: "unknown",
      detail: `${spec.country} does not publish a chin-to-crown measurement, so this cannot be checked. Your head measures about ${measurement.headHeightMm.toFixed(1)} mm here.`,
    });
  } else {
    const mm = measurement.headHeightMm;
    const inRange = mm >= spec.headMinMm && mm <= spec.headMaxMm;
    checks.push({
      id: "head",
      label: headLabel,
      status: inRange ? "pass" : "fail",
      detail: inRange
        ? `${mm.toFixed(1)} mm, inside the ${spec.headMinMm} to ${spec.headMaxMm} mm range.`
        : `${mm.toFixed(1)} mm. It needs to be between ${spec.headMinMm} and ${spec.headMaxMm} mm. ${
            mm < spec.headMinMm ? "Zoom in." : "Zoom out."
          }`,
    });
  }

  // 3. Whole head in frame.
  if (measurement) {
    const crownIn = measurement.crownFraction >= 0;
    const chinIn = measurement.chinFraction <= 1;
    checks.push({
      id: "framing",
      label: "Whole head inside the frame",
      status: crownIn && chinIn ? "pass" : "fail",
      detail:
        crownIn && chinIn
          ? undefined
          : !crownIn
            ? "The top of the head is cut off."
            : "The chin is cut off.",
    });
  }

  // 4. Eye line, where the spec publishes one.
  if (measurement && spec.eyeLineFromBottomMm) {
    const [min, max] = spec.eyeLineFromBottomMm;
    const mm = measurement.eyeFromBottomMm;
    const inBand = mm >= min && mm <= max;
    checks.push({
      id: "eyeline",
      label: "Eyes at the required height",
      status: inBand ? "pass" : "fail",
      detail: inBand
        ? `${mm.toFixed(1)} mm from the bottom edge.`
        : `${mm.toFixed(1)} mm from the bottom edge. It needs to be between ${min} and ${max} mm.`,
    });
  }

  // 5. Head roll, from the two eye points.
  const tilt = face ? eyeTiltDegrees(face) : null;
  if (tilt === null) {
    checks.push({ id: "level", label: "Head straight, eyes level", status: "unknown" });
  } else {
    checks.push({
      id: "level",
      label: "Head straight, eyes level",
      status: tilt <= EYE_LEVEL_TOLERANCE_DEGREES ? "pass" : "warn",
      detail:
        tilt <= EYE_LEVEL_TOLERANCE_DEGREES
          ? undefined
          : `The head is tilted about ${Math.round(tilt)} degrees. Straighten up and retake if you can.`,
    });
  }

  // 6. Enough real pixels for the output size.
  if (measurement) {
    const ratio = Math.min(
      measurement.sourcePixelWidth / spec.pixelWidth,
      measurement.sourcePixelHeight / spec.pixelHeight,
    );
    checks.push({
      id: "resolution",
      label: `Enough detail for ${spec.pixelWidth} x ${spec.pixelHeight} pixels`,
      status: ratio >= RESOLUTION_WARN_RATIO ? "pass" : ratio >= RESOLUTION_FAIL_RATIO ? "warn" : "fail",
      detail:
        ratio >= RESOLUTION_WARN_RATIO
          ? undefined
          : `The crop covers about ${Math.round(measurement.sourcePixelWidth)} pixels across, so it is being enlarged to reach ${spec.pixelWidth}. A photo taken closer, or a higher resolution one, would print sharper.`,
    });
  }

  return checks;
}

/** True when nothing is failing. Warnings do not block the download. */
export function hasBlockingFailure(checks: ComplianceCheck[]): boolean {
  return checks.some((c) => c.status === "fail");
}

export type SelfConfirmItem = {
  id: string;
  label: string;
};

/**
 * What a browser cannot see. These are the user's to confirm, and the UI says
 * plainly that nobody here is checking them.
 */
export const SELF_CONFIRM_ITEMS: SelfConfirmItem[] = [
  { id: "expression", label: "Neutral expression, mouth closed, both eyes open" },
  { id: "accessories", label: "No glasses, no hat, nothing covering the face" },
  { id: "recent", label: "Taken within the last 6 months" },
  { id: "lighting", label: "Even light, no shadow on the face or behind me" },
];
