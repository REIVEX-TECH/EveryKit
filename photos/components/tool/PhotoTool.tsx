"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSpecOrDefault, type PhotoSpec } from "@/data/specs";
import {
  computeCrop,
  fallbackCrop,
  measureCrop,
  type CropRect,
  type FaceGeometry,
} from "@/lib/imaging/cropMath";
import { detectFace, warmUpFaceDetector } from "@/lib/imaging/faceDetect";
import {
  removeBackgroundCutout,
  type Cutout,
  type RemovalProgress,
} from "@/lib/imaging/backgroundRemoval";
import { evaluateCompliance, hasBlockingFailure } from "@/lib/imaging/compliance";
import {
  UnsupportedImageError,
  canvasToBlob,
  createCanvas,
  loadImageFile,
  makeWorkingCopy,
} from "@/lib/imaging/imageSource";
import { renderPhoto } from "@/lib/imaging/render";
import { Dropzone } from "./Dropzone";
import { SpecPicker } from "./SpecPicker";
import { CropStage } from "./CropStage";
import { BackgroundToggle } from "./BackgroundToggle";
import { ComplianceList } from "./ComplianceList";
import { ExportPanel } from "./ExportPanel";

type Props = {
  /** Preselected spec, used by the country pages. */
  initialSlug?: string;
  /**
   * The page heading and its opening lines. They live inside the tool because
   * the hero is the tool: the dropzone has to sit beside them, above the fold,
   * not below a separate marketing block.
   */
  heading: string;
  intro: React.ReactNode;
  /** The before/after diagram shown alongside the dropzone. */
  example: React.ReactNode;
};

type Loaded = {
  source: ImageBitmap;
  /** Downscaled copy used for detection, segmentation and on-screen display. */
  working: ImageBitmap;
  workingScale: number;
  previewUrl: string;
};

/**
 * The whole flow: upload, pick a spec, adjust the crop, choose a background,
 * read the checks, download.
 *
 * All of it happens in this browser. Nothing is uploaded, which is also why
 * there is no undo history to sync and no job to poll — the source bitmap sits
 * in memory and every view is derived from it.
 */
export function PhotoTool({ initialSlug, heading, intro, example }: Props) {
  const [spec, setSpec] = useState<PhotoSpec>(() => getSpecOrDefault(initialSlug));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<{ message: string; hint: string } | null>(null);

  const [face, setFace] = useState<FaceGeometry | null>(null);
  const [faceCount, setFaceCount] = useState(0);
  const [detectionUnavailable, setDetectionUnavailable] = useState(false);
  const [rect, setRect] = useState<CropRect | null>(null);

  const [useReplacement, setUseReplacement] = useState(false);
  const [cutout, setCutout] = useState<Cutout | null>(null);
  const [removal, setRemoval] = useState<RemovalProgress | null>(null);
  const [removalError, setRemovalError] = useState<string | null>(null);

  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  // Held so a second upload can release the first one's memory and object URL.
  const loadedRef = useRef<Loaded | null>(null);
  loadedRef.current = loaded;

  useEffect(() => {
    return () => {
      const current = loadedRef.current;
      if (current) URL.revokeObjectURL(current.previewUrl);
    };
  }, []);

  const releaseLoaded = useCallback((value: Loaded | null) => {
    if (!value) return;
    URL.revokeObjectURL(value.previewUrl);
    value.source.close();
    if (value.working !== value.source) value.working.close();
  }, []);

  const onFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setLoadError(null);
      // A new photo invalidates everything derived from the old one.
      setCutout(null);
      setUseReplacement(false);
      setRemoval(null);
      setRemovalError(null);

      try {
        const image = await loadImageFile(file);
        const { bitmap: working, scale } = await makeWorkingCopy(image.bitmap);

        // Display from the working copy: it is already oriented and small
        // enough to move around smoothly.
        const canvas = createCanvas(working.width, working.height);
        canvas.getContext("2d")?.drawImage(working, 0, 0);
        const previewBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
        const previewUrl = URL.createObjectURL(previewBlob);

        const next: Loaded = {
          source: image.bitmap,
          working,
          workingScale: scale,
          previewUrl,
        };

        releaseLoaded(loadedRef.current);
        setLoaded(next);

        const outcome = await detectFace(working, scale);
        if (outcome.status === "found") {
          setFace(outcome.face);
          setFaceCount(outcome.faceCount);
          setDetectionUnavailable(false);
          setRect(computeCrop(outcome.face, image, spec).rect);
        } else {
          setFace(null);
          setFaceCount(0);
          setDetectionUnavailable(outcome.status === "unavailable");
          setRect(fallbackCrop(image, spec).rect);
        }
      } catch (error) {
        if (error instanceof UnsupportedImageError) {
          setLoadError({ message: error.message, hint: error.hint });
        } else {
          setLoadError({
            message: "That photo could not be opened.",
            hint: "Try a different file, or a JPG exported from your gallery.",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [releaseLoaded, spec],
  );

  // Changing the spec changes the frame shape, so the crop is recomputed.
  const onSpecChange = useCallback(
    (next: PhotoSpec) => {
      setSpec(next);
      if (!loaded) return;
      const size = { width: loaded.source.width, height: loaded.source.height };
      setRect(face ? computeCrop(face, size, next).rect : fallbackCrop(size, next).rect);
    },
    [face, loaded],
  );

  const resetCrop = useCallback(() => {
    if (!loaded) return;
    const size = { width: loaded.source.width, height: loaded.source.height };
    setRect(face ? computeCrop(face, size, spec).rect : fallbackCrop(size, spec).rect);
  }, [face, loaded, spec]);

  const onBackgroundChange = useCallback(
    async (next: boolean) => {
      setUseReplacement(next);
      setRemovalError(null);
      if (!next || cutout || !loaded) return;

      setRemoval({ phase: "loading", ratio: 0, message: "Getting the model." });
      try {
        const result = await removeBackgroundCutout(loaded.working, setRemoval);
        // The cutout was traced on the working copy, so its scale is relative
        // to the full-resolution source the crop rect uses.
        setCutout({ bitmap: result.bitmap, scale: result.scale * loaded.workingScale });
      } catch {
        setRemovalError(
          "The background could not be removed here. Keeping the original background still works.",
        );
        setUseReplacement(false);
      } finally {
        setRemoval(null);
      }
    },
    [cutout, loaded],
  );

  const measurement = useMemo(
    () => (rect && face ? measureCrop(rect, face, spec) : null),
    [rect, face, spec],
  );

  /** Checks about the head need a face; the resolution check does not. */
  const FACE_DEPENDENT = ["head", "framing", "eyeline"];

  const checks = useMemo(() => {
    if (!rect) return [];
    const all = evaluateCompliance({
      spec,
      face,
      measurement:
        measurement ??
        // No face, so only the pixel count is meaningful here.
        {
          headHeightMm: 0,
          headFraction: 0,
          eyeFromBottomMm: 0,
          crownFraction: 0,
          chinFraction: 0,
          sourcePixelWidth: rect.width,
          sourcePixelHeight: rect.height,
        },
      faceCount,
      detectionUnavailable,
    });
    return face ? all : all.filter((check) => !FACE_DEPENDENT.includes(check.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, face, measurement, faceCount, detectionUnavailable, rect]);

  const activeCutout = useReplacement ? cutout : null;

  const renderSingle = useMemo(() => {
    if (!loaded || !rect) return null;
    return ({ watermark }: { watermark: boolean }) =>
      renderPhoto({ source: loaded.source, rect, spec, cutout: activeCutout, watermark });
  }, [loaded, rect, spec, activeCutout]);

  const unconfirmed = ["expression", "accessories", "recent", "lighting"].filter(
    (id) => !confirmed[id],
  );

  const blockedReason = hasBlockingFailure(checks)
    ? "Something above is failing. You can still download, but fix it first if you can."
    : unconfirmed.length > 0
      ? "Tick the four things only you can confirm before you send this off."
      : null;

  return (
    <div>
      {/* The hero is the tool: the upload sits here, above the fold, with the
          measurement diagram beside it on desktop and below it on a phone. */}
      <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
        <div className="max-w-[560px]">
          <h1 className="text-[34px] sm:text-[40px]">{heading}</h1>
          {intro}

          <div className="mt-8">
            <p className="ek-step-number">Step 1</p>
            <h2 className="mb-3 mt-1 text-[18px]">Your photo</h2>
            {loaded ? (
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-[14px] text-text-light">
                  Loaded at {loaded.source.width} x {loaded.source.height} pixels.
                </p>
                <button
                  type="button"
                  className="ek-btn ek-btn-quiet py-2 text-[14px]"
                  onClick={() => {
                    releaseLoaded(loadedRef.current);
                    setLoaded(null);
                    setRect(null);
                    setFace(null);
                    setCutout(null);
                    setUseReplacement(false);
                  }}
                >
                  Use a different photo
                </button>
              </div>
            ) : (
              <Dropzone
                onFile={onFile}
                busy={loading}
                error={loadError}
                // Fetching the detector used to start on page load, which put
                // a WASM download and compile in the middle of first paint and
                // cost roughly half a second of blocking time. Hovering or
                // focusing the dropzone comes far enough ahead of a file being
                // chosen to hide the same latency, and costs nothing to anyone
                // who never uploads.
                onIntent={warmUpFaceDetector}
              />
            )}
          </div>
        </div>

        <div className="lg:pt-2">{example}</div>
      </div>

      <div className="mt-16 space-y-14 border-t border-line pt-14">
        <Step number={2} title="What it is for">
          <SpecPicker spec={spec} onChange={onSpecChange} />
        </Step>

        {loaded && rect ? (
          <>
            <Step
              number={3}
              title="Position"
              note={
                face
                  ? "Cropped for you. Drag to adjust."
                  : detectionUnavailable
                    ? "Face detection could not start here, so place your head inside the guides yourself."
                    : "No face was found in this photo. Place your head inside the guides yourself."
              }
            >
              <CropStage
                previewUrl={loaded.previewUrl}
                sourceSize={{ width: loaded.source.width, height: loaded.source.height }}
                spec={spec}
                rect={rect}
                onRectChange={(update) =>
                  setRect((previous) => (previous ? update(previous) : previous))
                }
                onReset={resetCrop}
              />
            </Step>

            <Step number={4} title="Background">
              <BackgroundToggle
                spec={spec}
                useReplacement={useReplacement}
                onChange={onBackgroundChange}
                progress={removal}
                error={removalError}
                ready={cutout !== null}
              />
            </Step>

            <Step number={5} title="Checks">
              <ComplianceList
                checks={checks}
                confirmed={confirmed}
                onConfirmChange={(id, value) =>
                  setConfirmed((previous) => ({ ...previous, [id]: value }))
                }
              />
            </Step>

            <Step number={6} title="Download">
              <ExportPanel spec={spec} renderSingle={renderSingle} blockedReason={blockedReason} />
            </Step>
          </>
        ) : null}
      </div>
    </div>
  );
}


function Step({
  number,
  title,
  note,
  children,
}: {
  number: number;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <p className="ek-step-number">Step {number}</p>
        <h2 className="mt-1 text-[20px] text-foreground">{title}</h2>
        {note ? <p className="mt-1 text-[14px] text-text-light">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}
