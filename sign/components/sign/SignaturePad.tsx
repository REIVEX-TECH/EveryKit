"use client";

import { useCallback, useEffect, useRef } from "react";
import { Eraser, Undo2 } from "lucide-react";
import {
  INK_COLOURS,
  inkHex,
  isEmpty,
  strokeBounds,
  strokesToSvg,
  strokeToPath,
  type InkId,
  type Stroke,
} from "@/lib/sign/strokes";

/** Pen width in canvas units. */
export const LINE_WIDTH = 3;

/** Exported at three times the drawn size, so it stays crisp when printed. */
export const EXPORT_SCALE = 3;

const HEIGHT = 220;

export type PadHandle = {
  toPngBlob: () => Promise<Blob | null>;
  toSvg: () => string;
  isEmpty: () => boolean;
};

export function SignaturePad({
  ink,
  onInkChange,
  onChange,
  onReady,
}: {
  ink: InkId;
  onInkChange: (ink: InkId) => void;
  onChange: (hasInk: boolean) => void;
  onReady: (handle: PadHandle) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);

  /*
   * The element is sized by CSS and the backing store follows the box it ends
   * up with, measured at draw time.
   *
   * Driving the CSS width from React state instead created a loop: the canvas
   * started at zero, the first measurement was taken before the stylesheet had
   * applied, and the pad latched a two pixel width that nothing ever corrected.
   * Letting CSS own the width removes the loop, and a resize simply redraws.
   */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const width = box.width;
    if (width < 1) return;

    // A backing store at device resolution, with the context scaled to match,
    // so the line is not soft on a phone.
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const nextWidth = Math.round(width * dpr);
    const nextHeight = Math.round(HEIGHT * dpr);
    // Assigning width or height clears the canvas, so only do it on a change.
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);
    ctx.strokeStyle = inkHex(ink);
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      ctx.stroke(new Path2D(strokeToPath(stroke)));
    }
  }, [ink]);

  useEffect(() => {
    redraw();
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => redraw());
    observer.observe(node);
    return () => observer.disconnect();
  }, [redraw]);

  const pointFrom = (event: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([pointFrom(event)]);
    redraw();
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const current = strokesRef.current[strokesRef.current.length - 1];
    current.push(pointFrom(event));
    redraw();
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(!isEmpty(strokesRef.current));
  };

  const undo = () => {
    strokesRef.current.pop();
    redraw();
    onChange(!isEmpty(strokesRef.current));
  };

  const clear = () => {
    strokesRef.current = [];
    redraw();
    onChange(false);
  };

  /**
   * The exported PNG, cropped to the ink and drawn at three times size.
   *
   * Exporting the whole drawing surface would give a signature surrounded by a
   * wide transparent margin, which then has to be dragged tiny to look right on
   * a document.
   */
  const toPngBlob = useCallback(async (): Promise<Blob | null> => {
    const strokes = strokesRef.current;
    const bounds = strokeBounds(strokes, LINE_WIDTH);
    if (!bounds) return null;

    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(bounds.width * EXPORT_SCALE));
    out.height = Math.max(1, Math.round(bounds.height * EXPORT_SCALE));
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, -bounds.x * EXPORT_SCALE, -bounds.y * EXPORT_SCALE);
    ctx.strokeStyle = inkHex(ink);
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.stroke(new Path2D(strokeToPath(stroke)));
    }

    return new Promise((resolve) => out.toBlob(resolve, "image/png"));
  }, [ink]);

  const toSvg = useCallback(
    () => strokesToSvg(strokesRef.current, { colour: inkHex(ink), lineWidth: LINE_WIDTH }),
    [ink],
  );

  useEffect(() => {
    onReady({
      toPngBlob,
      toSvg,
      isEmpty: () => isEmpty(strokesRef.current),
    });
  }, [onReady, toPngBlob, toSvg]);

  return (
    <div>
      <div ref={wrapRef} className="ek-card overflow-hidden p-0">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
          // touch-action none, or a finger scrolls the page instead of drawing.
          style={{
            touchAction: "none",
            display: "block",
            width: "100%",
            height: HEIGHT,
            cursor: "crosshair",
          }}
          aria-label="Draw your signature here with a finger, a stylus or the mouse"
          role="img"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Ink colour</legend>
          {INK_COLOURS.map((colour) => (
            <button
              key={colour.id}
              type="button"
              onClick={() => onInkChange(colour.id)}
              aria-pressed={ink === colour.id}
              aria-label={`${colour.label} ink`}
              className={[
                "inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-2 text-[14px] transition-colors",
                ink === colour.id
                  ? "border-primary-dark text-foreground"
                  : "border-line text-text-light hover:border-line-strong",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-line"
                style={{ background: colour.hex }}
              />
              {colour.label}
            </button>
          ))}
        </fieldset>

        <button type="button" onClick={undo} className="ek-btn ek-btn-quiet py-2 text-[14px]">
          <Undo2 size={15} aria-hidden="true" />
          Undo
        </button>
        <button type="button" onClick={clear} className="ek-btn ek-btn-quiet py-2 text-[14px]">
          <Eraser size={15} aria-hidden="true" />
          Clear
        </button>
      </div>
    </div>
  );
}
