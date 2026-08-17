/**
 * Face detection with MediaPipe's BlazeFace short-range model.
 *
 * The model runs on the user's own device through WebAssembly. The photo is
 * never uploaded. The only network requests are for the model weights and the
 * WASM runtime, which are static files and carry no image data.
 *
 * The detector is created once and reused. It loads on first upload, not on
 * page load, so the landing page stays light.
 */

import type { FaceGeometry, Point } from "./cropMath";

/**
 * Where the runtime and model are fetched from. Both are free public CDNs.
 * To self-host instead, copy `node_modules/@mediapipe/tasks-vision/wasm` into
 * `public/mediapipe/wasm`, drop the model beside it, and point these at
 * `/mediapipe/wasm` and `/mediapipe/blaze_face_short_range.tflite`.
 */
export const WASM_FILESET_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

export const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

/** BlazeFace returns six keypoints in this order. */
const KEYPOINT_RIGHT_EYE = 0;
const KEYPOINT_LEFT_EYE = 1;

export class FaceDetectionUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Face detection could not start in this browser.");
    this.name = "FaceDetectionUnavailableError";
    this.cause = cause;
  }
}

type Detector = import("@mediapipe/tasks-vision").FaceDetector;

let detectorPromise: Promise<Detector> | null = null;

/**
 * MediaPipe's bundle posts usage statistics to odml.pa.googleapis.com and
 * offers no setting to turn it off. The content security policy in
 * next.config.ts blocks it, which is the only mechanism that reaches it: the
 * request is issued from the WASM runtime's own worker, so patching `fetch` on
 * the main thread does nothing. The block logs a CSP violation to the console
 * each time detection starts. That noise is the privacy promise being kept.
 */

async function createDetector(): Promise<Detector> {
  const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_FILESET_PATH);

  const options = {
    baseOptions: { modelAssetPath: FACE_MODEL_URL },
    runningMode: "IMAGE" as const,
    minDetectionConfidence: 0.4,
  };

  try {
    return await FaceDetector.createFromOptions(fileset, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: "GPU" as const },
    });
  } catch {
    // Some Android GPUs reject the delegate. CPU is slower but always works,
    // and one still image is well within budget.
    return FaceDetector.createFromOptions(fileset, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: "CPU" as const },
    });
  }
}

/** Start loading the detector without waiting for it. */
export function warmUpFaceDetector(): void {
  if (!detectorPromise) {
    detectorPromise = createDetector().catch((error) => {
      detectorPromise = null;
      throw new FaceDetectionUnavailableError(error);
    });
  }
}

async function getDetector(): Promise<Detector> {
  warmUpFaceDetector();
  return detectorPromise!;
}

export type DetectionOutcome =
  | { status: "found"; face: FaceGeometry; confidence: number; faceCount: number }
  | { status: "none" }
  | { status: "unavailable"; error: unknown };

/**
 * Detect the largest face in an image. More than one face is reported through
 * `faceCount` so the UI can point out that passport photos need only one
 * person in frame.
 *
 * `scale` maps detector coordinates back onto the full-resolution image when
 * detection ran on a downscaled working copy.
 */
export async function detectFace(
  image: ImageBitmap | HTMLCanvasElement,
  scale = 1,
): Promise<DetectionOutcome> {
  let detector: Detector;
  try {
    detector = await getDetector();
  } catch (error) {
    return { status: "unavailable", error };
  }

  let detections: import("@mediapipe/tasks-vision").Detection[];
  try {
    detections = detector.detect(image).detections;
  } catch (error) {
    return { status: "unavailable", error };
  }

  const usable = detections.filter((d) => d.boundingBox);
  if (usable.length === 0) return { status: "none" };

  // Largest box wins: in a photo with a bystander, the subject is the near one.
  const best = usable.reduce((a, b) =>
    b.boundingBox!.width * b.boundingBox!.height >
    a.boundingBox!.width * a.boundingBox!.height
      ? b
      : a,
  );

  const box = best.boundingBox!;
  const imageWidth = image.width;
  const imageHeight = image.height;

  const toSource = (keypointIndex: number): Point | undefined => {
    const kp = best.keypoints?.[keypointIndex];
    if (!kp) return undefined;
    // Keypoints are normalised to the image the detector saw.
    return { x: (kp.x * imageWidth) / scale, y: (kp.y * imageHeight) / scale };
  };

  const face: FaceGeometry = {
    box: {
      x: box.originX / scale,
      y: box.originY / scale,
      width: box.width / scale,
      height: box.height / scale,
    },
    rightEye: toSource(KEYPOINT_RIGHT_EYE),
    leftEye: toSource(KEYPOINT_LEFT_EYE),
  };

  return {
    status: "found",
    face,
    confidence: best.categories?.[0]?.score ?? 0,
    faceCount: usable.length,
  };
}

/** Free the detector, for example when the user starts over. */
export function releaseFaceDetector(): void {
  const pending = detectorPromise;
  detectorPromise = null;
  pending?.then((d) => d.close()).catch(() => {});
}
