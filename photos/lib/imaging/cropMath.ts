/**
 * Crop geometry. Pure functions, no DOM, no canvas — everything here is
 * testable in Node and is the only place that decides where a head sits inside
 * a frame.
 *
 * How the crop is worked out, in one paragraph:
 *
 *   A face detector gives us a box around the face plus the two eye points. The
 *   box does not include hair, so the crown is estimated as the top of the box
 *   lifted by HAIR_ALLOWANCE of the box height, and the chin is taken as the
 *   bottom of the box. That gives a head height in source pixels. The spec says
 *   what fraction of the final frame the head should occupy, so the crop height
 *   follows directly: cropHeight = headHeightPx / headFraction. Crop width comes
 *   from the spec's aspect ratio. Vertical position is anchored on the eye line
 *   when the spec publishes one, otherwise on a top margin. Horizontal position
 *   centres on the face. Finally the rect is pushed back inside the image, and
 *   shrunk if it still does not fit.
 */

import type { PhotoSpec } from "@/data/specs";

/** Hair sits above the detector's box. Lift the crown by this share of box height. */
export const HAIR_ALLOWANCE = 0.1;

/** Where the eye line falls between crown (0) and chin (1) on an adult face. */
export const EYE_TO_CROWN_RATIO = 0.46;

/** Head share of frame height used when a spec publishes no chin-to-crown range. */
export const FALLBACK_HEAD_FRACTION = 0.65;

/** Spread applied around the fallback fraction to draw min/max guides. */
export const FALLBACK_HEAD_SPREAD = 0.05;

/** Of the space not taken by the head, this share goes above the crown. */
export const TOP_MARGIN_SHARE = 0.27;

/** The crown may never sit closer than this to the top edge. */
const MIN_CROWN_MARGIN = 0.03;

/** The chin may never sit lower than this in the frame. */
const MAX_CHIN_POSITION = 0.95;

export type Point = { x: number; y: number };

export type FaceBox = { x: number; y: number; width: number; height: number };

export type FaceGeometry = {
  /** Detector bounding box, in source-image pixels. */
  box: FaceBox;
  leftEye?: Point;
  rightEye?: Point;
};

export type ImageSize = { width: number; height: number };

export type CropRect = { x: number; y: number; width: number; height: number };

export type HeadMetrics = {
  crownY: number;
  chinY: number;
  headHeightPx: number;
  centerX: number;
  eyeY: number;
  /** True when eyeY was estimated from the head box rather than from eye points. */
  eyeEstimated: boolean;
};

export type CropPlan = {
  rect: CropRect;
  /** Head share of frame height the plan aims for. */
  targetHeadFraction: number;
  /** True when the spec published no head range and a generic ratio was used. */
  headFractionIsGeneric: boolean;
  /** The rect was moved to stay inside the image. */
  clamped: boolean;
  /** The rect had to be shrunk because the ideal one did not fit the image. */
  shrunk: boolean;
  /**
   * The estimated crown or chin falls outside the source photo, so no crop can
   * contain the whole head. The user has to retake the photo.
   */
  crownCutOff: boolean;
  chinCutOff: boolean;
};

export type CropMeasurement = {
  headHeightMm: number;
  headFraction: number;
  eyeFromBottomMm: number;
  /** Crown position as a fraction of frame height from the top. */
  crownFraction: number;
  chinFraction: number;
  /** Source pixels available across the crop, for the resolution check. */
  sourcePixelWidth: number;
  sourcePixelHeight: number;
};

export function aspectRatio(spec: PhotoSpec): number {
  return spec.widthMm / spec.heightMm;
}

/**
 * Turn a detector result into the measurements the crop actually needs.
 */
export function estimateHeadMetrics(face: FaceGeometry): HeadMetrics {
  const { box } = face;
  const crownY = box.y - HAIR_ALLOWANCE * box.height;
  const chinY = box.y + box.height;
  const headHeightPx = chinY - crownY;
  const centerX = box.x + box.width / 2;

  let eyeY: number;
  let eyeEstimated: boolean;
  if (face.leftEye && face.rightEye) {
    eyeY = (face.leftEye.y + face.rightEye.y) / 2;
    eyeEstimated = false;
  } else {
    eyeY = crownY + EYE_TO_CROWN_RATIO * headHeightPx;
    eyeEstimated = true;
  }

  return { crownY, chinY, headHeightPx, centerX, eyeY, eyeEstimated };
}

/**
 * Head height as a share of frame height, from the spec's chin-to-crown range.
 * Aims for the middle of the range so a bit of drift either way stays legal.
 */
export function targetHeadFraction(spec: PhotoSpec): {
  fraction: number;
  isGeneric: boolean;
} {
  const { headMinMm, headMaxMm, heightMm } = spec;
  if (headMinMm !== undefined && headMaxMm !== undefined) {
    return { fraction: (headMinMm + headMaxMm) / 2 / heightMm, isGeneric: false };
  }
  if (headMinMm !== undefined) {
    return { fraction: (headMinMm * 1.05) / heightMm, isGeneric: false };
  }
  if (headMaxMm !== undefined) {
    return { fraction: (headMaxMm * 0.95) / heightMm, isGeneric: false };
  }
  return { fraction: FALLBACK_HEAD_FRACTION, isGeneric: true };
}

/** Middle of the spec's eye-line band, as a fraction of frame height from the top. */
function eyeFractionFromTop(spec: PhotoSpec): number | null {
  const band = spec.eyeLineFromBottomMm;
  if (!band) return null;
  const midFromBottom = (band[0] + band[1]) / 2;
  return 1 - midFromBottom / spec.heightMm;
}

/**
 * Work out the crop rect in source-image pixels for a detected face.
 */
export function computeCrop(
  face: FaceGeometry,
  image: ImageSize,
  spec: PhotoSpec,
): CropPlan {
  const head = estimateHeadMetrics(face);
  const { fraction, isGeneric } = targetHeadFraction(spec);
  const ratio = aspectRatio(spec);

  /*
   * Size first, then place.
   *
   * The order matters and used to be the other way round: the frame was placed
   * against the head, and then — if it turned out larger than the photo — it was
   * shrunk about its own centre. A passport frame carries the head high, near
   * the top edge, so shrinking about the frame's centre pulls the top edge down
   * past the crown and the whole frame drifts off the subject. That is the
   * failure this ordering removes, and it fires on exactly the photo people
   * actually take: a close-up selfie, where the head is large enough that the
   * ideal frame does not fit.
   *
   * Working out the final size before placing anything means the anchor below
   * is computed against the height that is actually used.
   */
  const maxHeight = Math.min(image.height, image.width / ratio);
  const idealHeight = head.headHeightPx / fraction;
  const shrunk = idealHeight > maxHeight;
  const height = Math.min(idealHeight, maxHeight);
  const width = height * ratio;

  // Vertical anchor: the eye line where the spec gives one, a top margin otherwise.
  const eyeFrac = eyeFractionFromTop(spec);
  let top: number;
  if (eyeFrac !== null) {
    top = head.eyeY - eyeFrac * height;
  } else {
    const topMargin = (1 - fraction) * TOP_MARGIN_SHARE;
    top = head.crownY - topMargin * height;
  }

  /*
   * The two guards below pull in opposite directions, and on a large head they
   * cannot both be satisfied: keeping 3% clear above the crown and the chin no
   * lower than 95% needs a head shorter than 92% of the frame. Applying them in
   * order let the second one win and push the crown out of frame, which is the
   * worst outcome available — a passport photo missing the top of the head is
   * rejected, whereas one with a tight margin is merely not ideal.
   *
   * So when they conflict, both are dropped and the head is centred instead.
   * Containment first; the margins are a preference, not a requirement.
   */
  const marginBand = (MAX_CHIN_POSITION - MIN_CROWN_MARGIN) * height;
  if (head.headHeightPx > marginBand) {
    top = head.crownY - (height - head.headHeightPx) / 2;
  } else {
    // The crown must stay in frame even if that means missing the eye band.
    top = Math.min(top, head.crownY - MIN_CROWN_MARGIN * height);
    top = Math.max(top, head.chinY - MAX_CHIN_POSITION * height);
  }

  // Horizontal anchor is the head's own centre, not the frame's.
  const left = head.centerX - width / 2;

  // Then slide back inside the image.
  const clampedLeft = clamp(left, 0, Math.max(0, image.width - width));
  const clampedTop = clamp(top, 0, Math.max(0, image.height - height));
  const clamped = clampedLeft !== left || clampedTop !== top;

  return {
    rect: { x: clampedLeft, y: clampedTop, width, height },
    targetHeadFraction: fraction,
    headFractionIsGeneric: isGeneric,
    clamped,
    shrunk,
    crownCutOff: head.crownY < 0,
    chinCutOff: head.chinY > image.height,
  };
}

/**
 * A centred crop of the right shape, used when no face is found and the user
 * has to place the head themselves.
 */
export function fallbackCrop(image: ImageSize, spec: PhotoSpec): CropPlan {
  const ratio = aspectRatio(spec);
  let height = Math.min(image.height, image.width / ratio);
  let width = height * ratio;
  // Leave a little room to zoom out.
  height *= 0.9;
  width *= 0.9;
  const { fraction, isGeneric } = targetHeadFraction(spec);
  return {
    rect: {
      x: (image.width - width) / 2,
      y: (image.height - height) / 2,
      width,
      height,
    },
    targetHeadFraction: fraction,
    headFractionIsGeneric: isGeneric,
    clamped: false,
    shrunk: false,
    crownCutOff: false,
    chinCutOff: false,
  };
}

/**
 * Measure what a crop rect actually achieves, in the spec's own units. Called
 * on every drag so the compliance list stays live.
 */
export function measureCrop(
  rect: CropRect,
  face: FaceGeometry,
  spec: PhotoSpec,
): CropMeasurement {
  const head = estimateHeadMetrics(face);
  const mmPerPx = spec.heightMm / rect.height;

  const crownFraction = (head.crownY - rect.y) / rect.height;
  const chinFraction = (head.chinY - rect.y) / rect.height;
  const eyeFraction = (head.eyeY - rect.y) / rect.height;

  return {
    headHeightMm: head.headHeightPx * mmPerPx,
    headFraction: head.headHeightPx / rect.height,
    eyeFromBottomMm: (1 - eyeFraction) * spec.heightMm,
    crownFraction,
    chinFraction,
    sourcePixelWidth: rect.width,
    sourcePixelHeight: rect.height,
  };
}

/**
 * Guide positions for the spec overlay, as fractions of frame height measured
 * from the top edge. This is what the diagram over the crop view draws.
 */
export type OverlayGuides = {
  crownMinFraction: number;
  crownMaxFraction: number;
  chinMinFraction: number;
  chinMaxFraction: number;
  eyeMinFraction: number;
  eyeMaxFraction: number;
  headMinMm: number;
  headMaxMm: number;
  /** True when the spec published nothing and these are a generic guide. */
  isGeneric: boolean;
};

export function overlayGuides(spec: PhotoSpec): OverlayGuides {
  const generic = spec.headMinMm === undefined || spec.headMaxMm === undefined;
  const { fraction } = targetHeadFraction(spec);

  const headMinFraction = generic
    ? fraction - FALLBACK_HEAD_SPREAD
    : spec.headMinMm! / spec.heightMm;
  const headMaxFraction = generic
    ? fraction + FALLBACK_HEAD_SPREAD
    : spec.headMaxMm! / spec.heightMm;

  const eyeFrac = eyeFractionFromTop(spec);

  let crownForMinHead: number;
  let crownForMaxHead: number;

  if (eyeFrac !== null && spec.eyeLineFromBottomMm) {
    // Anchor on the published eye band: crown = eye line minus the part of the
    // head that sits above the eyes.
    crownForMinHead = eyeFrac - EYE_TO_CROWN_RATIO * headMinFraction;
    crownForMaxHead = eyeFrac - EYE_TO_CROWN_RATIO * headMaxFraction;
  } else {
    // Anchor on the top margin instead. A smaller head gets a larger margin.
    crownForMinHead = (1 - headMinFraction) * TOP_MARGIN_SHARE;
    crownForMaxHead = (1 - headMaxFraction) * TOP_MARGIN_SHARE;
  }

  const chinForMinHead = crownForMinHead + headMinFraction;
  const chinForMaxHead = crownForMaxHead + headMaxFraction;

  const eyeForMinHead = crownForMinHead + EYE_TO_CROWN_RATIO * headMinFraction;
  const eyeForMaxHead = crownForMaxHead + EYE_TO_CROWN_RATIO * headMaxFraction;

  return {
    // A bigger head means the crown sits higher, so max head gives the min y.
    crownMinFraction: Math.min(crownForMaxHead, crownForMinHead),
    crownMaxFraction: Math.max(crownForMaxHead, crownForMinHead),
    chinMinFraction: Math.min(chinForMinHead, chinForMaxHead),
    chinMaxFraction: Math.max(chinForMinHead, chinForMaxHead),
    eyeMinFraction: Math.min(eyeForMinHead, eyeForMaxHead),
    eyeMaxFraction: Math.max(eyeForMinHead, eyeForMaxHead),
    headMinMm: headMinFraction * spec.heightMm,
    headMaxMm: headMaxFraction * spec.heightMm,
    isGeneric: generic,
  };
}

/**
 * How level the eyes are, as the vertical gap between them divided by the
 * distance between them. 0 is perfectly level.
 */
export function eyeTilt(face: FaceGeometry): number | null {
  if (!face.leftEye || !face.rightEye) return null;
  const dx = face.leftEye.x - face.rightEye.x;
  const dy = face.leftEye.y - face.rightEye.y;
  const spread = Math.hypot(dx, dy);
  if (spread < 1e-6) return null;
  return Math.abs(dy) / spread;
}

/** Degrees of head roll, derived from the eye points. */
export function eyeTiltDegrees(face: FaceGeometry): number | null {
  if (!face.leftEye || !face.rightEye) return null;
  const dx = face.leftEye.x - face.rightEye.x;
  const dy = face.leftEye.y - face.rightEye.y;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return null;
  return Math.abs((Math.atan2(dy, dx) * 180) / Math.PI) % 180;
}

/**
 * Move a crop rect back inside the image without changing its size.
 */
export function clampRectToImage(rect: CropRect, image: ImageSize): CropRect {
  return {
    ...rect,
    x: clamp(rect.x, 0, Math.max(0, image.width - rect.width)),
    y: clamp(rect.y, 0, Math.max(0, image.height - rect.height)),
  };
}

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
