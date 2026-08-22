"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import {
  context2d,
  decodeUpright,
  download,
  encodeCanvas,
  makeCanvas,
  rename,
  whiteGround,
  type Encodable,
} from "@/lib/images/canvas";
import { formatBytes } from "@/lib/images/resize";
import { applyRatio, clampRect, largestRectOfRatio, RATIOS, type AspectRatio, type Rect } from "@/lib/images/crop";
import { FormatChoice } from "./FlipRotateTool";
import { ImagePicker } from "./ImagePicker";

const VIEW_MAX = 460;

type Drag =
  | { kind: "move"; startX: number; startY: number; rect: Rect }
  | { kind: "resize"; startX: number; startY: number; rect: Rect }
  | null;

export function CropTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [ratio, setRatio] = useState<AspectRatio>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [format, setFormat] = useState<Encodable>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<Drag>(null);

  const bounds = bitmap ? { width: bitmap.width, height: bitmap.height } : null;
  const scale = bounds ? Math.min(1, VIEW_MAX / Math.max(bounds.width, bounds.height)) : 1;

  const pick = useCallback(async (picked: File) => {
    setError(null);
    try {
      const bmp = await decodeUpright(picked);
      setBitmap((old) => {
        old?.close();
        return bmp;
      });
      setFile(picked);
      setRatio(null);
      setRect(largestRectOfRatio({ width: bmp.width, height: bmp.height }, null));
    } catch {
      setError("That image could not be read. JPG, PNG and WebP are what this handles.");
    }
  }, []);

  // Draw the image into the preview canvas once per image.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !bitmap) return;
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }, [bitmap, scale]);

  function chooseRatio(next: AspectRatio) {
    setRatio(next);
    if (bounds) setRect(largestRectOfRatio(bounds, next));
  }

  const onPointerDown = (event: React.PointerEvent, kind: "move" | "resize") => {
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    dragRef.current = { kind, startX: event.clientX, startY: event.clientY, rect };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !bounds) return;
    // Screen delta back into image pixels.
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;

    if (drag.kind === "move") {
      setRect(clampRect({ ...drag.rect, x: drag.rect.x + dx, y: drag.rect.y + dy }, bounds));
    } else {
      const next = { ...drag.rect, width: drag.rect.width + dx, height: drag.rect.height + dy };
      setRect(applyRatio(next, bounds, ratio));
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const save = useCallback(async () => {
    if (!bitmap || !file || !rect) return;
    try {
      const canvas = makeCanvas(rect.width, rect.height);
      const ctx = context2d(canvas);
      if (format === "image/jpeg") whiteGround(ctx, rect.width, rect.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      const blob = await encodeCanvas(canvas, format, quality / 100);
      download(blob, rename(file.name, format));
    } catch {
      setError("That crop could not be saved. Try a different format.");
    }
  }, [bitmap, file, rect, format, quality]);

  function take() {
    if (hasGivenEmail()) {
      void save();
      return;
    }
    setGateFor(() => () => void save());
  }

  return (
    <div className="flex flex-col gap-6">
      <ImagePicker onPick={pick} current={file} />

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      {bitmap && rect ? (
        <>
          <fieldset>
            <legend className="text-[14px] font-semibold">Shape</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {RATIOS.map((option) => (
                <label
                  key={option.label}
                  title={option.hint}
                  className={[
                    "cursor-pointer rounded-full border px-4 py-2 text-[14px]",
                    ratio === option.value ? "border-primary bg-primary/5" : "border-line",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="ratio"
                    checked={ratio === option.value}
                    onChange={() => chooseRatio(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="ek-card flex flex-col items-center gap-2 bg-bg-soft p-4">
            <div
              className="relative touch-none"
              style={{ width: Math.round(bitmap.width * scale), maxWidth: "100%" }}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <canvas ref={previewRef} className="block w-full rounded-[8px]" />
              {/* The crop box, in screen pixels derived from the image rect. */}
              <div
                role="group"
                aria-label="Crop area, drag to move"
                onPointerDown={(event) => onPointerDown(event, "move")}
                className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                style={{
                  left: rect.x * scale,
                  top: rect.y * scale,
                  width: rect.width * scale,
                  height: rect.height * scale,
                }}
              >
                <span
                  role="button"
                  aria-label="Resize the crop area"
                  onPointerDown={(event) => onPointerDown(event, "resize")}
                  className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize rounded-full border-2 border-white bg-primary"
                />
              </div>
            </div>
            <p className="text-[13px] text-text-light">
              {rect.width} x {rect.height} px
            </p>
          </div>

          <FormatChoice format={format} setFormat={setFormat} quality={quality} setQuality={setQuality} />

          <div>
            <button type="button" onClick={take} className="ek-btn ek-btn-accent">
              Crop and save
            </button>
            {file ? (
              <p className="mt-2 text-[13px] text-text-light">From {formatBytes(file.size)}.</p>
            ) : null}
          </div>

          {gateFor ? (
            <EmailGate
              actionLabel="Save"
              onDone={() => {
                gateFor();
                setGateFor(null);
              }}
              onCancel={() => setGateFor(null)}
            />
          ) : null}

          <MoreFromEveryKit />
        </>
      ) : null}
    </div>
  );
}
