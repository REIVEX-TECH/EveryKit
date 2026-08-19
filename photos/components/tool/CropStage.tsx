"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { clamp, type CropRect, type ImageSize } from "@/lib/imaging/cropMath";
import { stageLayout } from "@/lib/imaging/stageLayout";
import type { PhotoSpec } from "@/data/specs";
import { SpecOverlay } from "./SpecOverlay";

type Props = {
  /** A displayable copy of the photo. */
  previewUrl: string;
  /** Full-resolution size. The crop rect is in these coordinates. */
  sourceSize: ImageSize;
  spec: PhotoSpec;
  rect: CropRect;
  /**
   * Takes an updater rather than a value. Zoom clicks, held arrow keys and
   * wheel bursts all fire faster than React re-renders, and a handler closing
   * over the current `rect` would compute every one of them from the same
   * stale value — twenty clicks would move the crop once.
   */
  onRectChange: (update: (previous: CropRect) => CropRect) => void;
  onReset: () => void;
};

const STAGE_HEIGHT = 420;
/** Share of the stage the crop window takes, leaving the rest as context. */
const WINDOW_FILL = 0.84;

/** Resize a rect to a new height about its own centre, keeping the spec shape. */
function zoomedTo(previous: CropRect, height: number, aspect: number): CropRect {
  const width = height * aspect;
  return {
    width,
    height,
    x: previous.x + previous.width / 2 - width / 2,
    y: previous.y + previous.height / 2 - height / 2,
  };
}

/**
 * Drag to move, pinch or scroll to zoom, with the spec drawn on top.
 *
 * The crop rect stays in source-image coordinates throughout. That is the same
 * space `computeCrop` works in and the same space `renderPhoto` reads, so no
 * conversion happens between what you see here and what gets exported.
 */
export function CropStage({
  previewUrl,
  sourceSize,
  spec,
  rect,
  onRectChange,
  onReset,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageWidth(entry.contentRect.width);
    });
    observer.observe(node);
    setStageWidth(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  const aspect = spec.widthMm / spec.heightMm;

  /*
   * The geometry comes from `stageLayout`, which is a pure function so a test
   * can assert the region these layers actually show is the region the renderer
   * exports. Keeping the maths inline here is what made that untestable.
   */
  const layout = useMemo(
    () => stageLayout(rect, sourceSize, aspect, stageWidth, STAGE_HEIGHT, WINDOW_FILL),
    [rect, sourceSize, aspect, stageWidth],
  );
  const windowSize = { width: layout.windowWidth, height: layout.windowHeight };

  /** Smallest and largest the crop window may get, in source pixels. */
  const rectBounds = useMemo(() => {
    const maxHeight = Math.min(sourceSize.height, sourceSize.width / aspect);
    return { minHeight: maxHeight * 0.12, maxHeight };
  }, [sourceSize, aspect]);

  /** Correct a proposed rect to the spec's shape and the image's edges. */
  const normalise = useCallback(
    (next: CropRect): CropRect => {
      const height = clamp(next.height, rectBounds.minHeight, rectBounds.maxHeight);
      const width = height * aspect;
      // Keep the centre where the caller put it while the size is corrected.
      const cx = next.x + next.width / 2;
      const cy = next.y + next.height / 2;
      return {
        width,
        height,
        x: clamp(cx - width / 2, 0, Math.max(0, sourceSize.width - width)),
        y: clamp(cy - height / 2, 0, Math.max(0, sourceSize.height - height)),
      };
    },
    [aspect, rectBounds, sourceSize],
  );

  const update = useCallback(
    (change: (previous: CropRect) => CropRect) => {
      onRectChange((previous) => normalise(change(previous)));
    },
    [normalise, onRectChange],
  );

  const panBy = useCallback(
    (screenDx: number, screenDy: number) => {
      update((previous) => {
        // Derive the scale from the rect being changed, not the rendered one,
        // so a burst of moves stays consistent.
        const scale = windowSize.width > 0 ? windowSize.width / previous.width : 0;
        if (scale === 0) return previous;
        return { ...previous, x: previous.x - screenDx / scale, y: previous.y - screenDy / scale };
      });
    },
    [update, windowSize.width],
  );

  /** Zoom about the centre of the crop window. */
  const zoomBy = useCallback(
    (factor: number) => {
      update((previous) => zoomedTo(previous, previous.height / factor, aspect));
    },
    [update, aspect],
  );

  const zoomTo = useCallback(
    (height: number) => {
      update((previous) => zoomedTo(previous, height, aspect));
    },
    [update, aspect],
  );

  // Pointer handling. One pointer pans, two pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; height: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      pinchStart.current = { distance: pointerDistance(), height: rect.height };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const distance = pointerDistance();
      if (distance > 0) {
        zoomTo((pinchStart.current.height * pinchStart.current.distance) / distance);
      }
      return;
    }

    panBy(event.clientX - previous.x, event.clientY - previous.y);
  };

  const endPointer = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  function pointerDistance(): number {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 24 : 6;
    const handlers: Record<string, () => void> = {
      ArrowLeft: () => panBy(step, 0),
      ArrowRight: () => panBy(-step, 0),
      ArrowUp: () => panBy(0, step),
      ArrowDown: () => panBy(0, -step),
      "+": () => zoomBy(1.06),
      "=": () => zoomBy(1.06),
      "-": () => zoomBy(1 / 1.06),
      _: () => zoomBy(1 / 1.06),
    };
    const handler = handlers[event.key];
    if (!handler) return;
    event.preventDefault();
    handler();
  };

  // Wheel zoom needs a non-passive listener, which React's onWheel does not give.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // Image position, in screen pixels, for the two layers below.
  const { displayWidth, displayHeight, originX, originY } = layout;

  // 100 is the whole photo in frame; higher is closer in.
  const minZoom = 100;
  const maxZoom = Math.round((rectBounds.maxHeight / rectBounds.minHeight) * 100);
  const zoomPercent = clamp(
    Math.round((rectBounds.maxHeight / rect.height) * 100),
    minZoom,
    maxZoom,
  );

  return (
    <div>
      <div
        ref={stageRef}
        role="application"
        aria-label="Position your face inside the guides. Drag to move, arrow keys to nudge, plus and minus to zoom."
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={onKeyDown}
        style={{ height: STAGE_HEIGHT, touchAction: "none" }}
        className="relative w-full cursor-grab overflow-hidden rounded-[var(--radius-card)] border border-line bg-[#0f172a] active:cursor-grabbing"
      >
        {stageWidth > 0 && (
          <>
            {/* Context outside the crop, dimmed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                position: "absolute",
                left: originX,
                top: originY,
                width: displayWidth,
                height: displayHeight,
                opacity: 0.34,
              }}
            />

            {/* The crop itself, at full strength. */}
            <div
              style={{
                position: "absolute",
                left: layout.windowLeft,
                top: layout.windowTop,
                width: windowSize.width,
                height: windowSize.height,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Your photo, positioned inside the crop guides"
                draggable={false}
                style={{
                  position: "absolute",
                  left: originX - layout.windowLeft,
                  top: originY - layout.windowTop,
                  width: displayWidth,
                  height: displayHeight,
                }}
              />
              <SpecOverlay spec={spec} width={windowSize.width} height={windowSize.height} />
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="ek-btn ek-btn-quiet px-3 py-2"
          onClick={() => zoomBy(1 / 1.12)}
          aria-label="Zoom out"
        >
          <Minus size={16} aria-hidden="true" />
        </button>

        <input
          type="range"
          min={minZoom}
          max={maxZoom}
          step={1}
          value={zoomPercent}
          aria-label="Zoom"
          aria-valuetext={`${zoomPercent} percent`}
          onChange={(event) =>
            zoomTo(rectBounds.maxHeight / (Number(event.target.value) / 100))
          }
          className="h-1 flex-1 cursor-pointer accent-primary"
        />

        <button
          type="button"
          className="ek-btn ek-btn-quiet px-3 py-2"
          onClick={() => zoomBy(1.12)}
          aria-label="Zoom in"
        >
          <Plus size={16} aria-hidden="true" />
        </button>

        <button type="button" className="ek-btn ek-btn-quiet py-2 text-[14px]" onClick={onReset}>
          <RotateCcw size={15} aria-hidden="true" />
          Reset crop
        </button>
      </div>
    </div>
  );
}
