"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from "lucide-react";
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
import {
  IDENTITY,
  flipHorizontal,
  flipVertical,
  isIdentity,
  outputSize,
  rotateCCW,
  rotateCW,
  transformFor,
  type Orient,
} from "@/lib/images/transform";
import { ImagePicker } from "./ImagePicker";

const PREVIEW_MAX = 460;

export function FlipRotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [orient, setOrient] = useState<Orient>(IDENTITY);
  const [format, setFormat] = useState<Encodable>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pick = useCallback(async (picked: File) => {
    setError(null);
    setOrient(IDENTITY);
    try {
      const bmp = await decodeUpright(picked);
      setBitmap((old) => {
        old?.close();
        return bmp;
      });
      setFile(picked);
    } catch {
      setError("That image could not be read. JPG, PNG and WebP are what this handles.");
    }
  }, []);

  // Draw the preview whenever the picture or the orientation changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;

    const out = outputSize(bitmap, orient);
    const scale = Math.min(1, PREVIEW_MAX / Math.max(out.width, out.height));
    canvas.width = Math.max(1, Math.round(out.width * scale));
    canvas.height = Math.max(1, Math.round(out.height * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (format === "image/jpeg") whiteGround(ctx, canvas.width, canvas.height);
    const m = transformFor(bitmap, orient);
    ctx.setTransform(m.a * scale, m.b * scale, m.c * scale, m.d * scale, m.e * scale, m.f * scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [bitmap, orient, format]);

  const render = useCallback(async (): Promise<Blob> => {
    if (!bitmap) throw new Error("No image.");
    const out = outputSize(bitmap, orient);
    const canvas = makeCanvas(out.width, out.height);
    const ctx = context2d(canvas);
    if (format === "image/jpeg") whiteGround(ctx, out.width, out.height);
    const m = transformFor(bitmap, orient);
    ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0);
    return encodeCanvas(canvas, format, quality / 100);
  }, [bitmap, orient, format, quality]);

  const save = useCallback(async () => {
    if (!file) return;
    try {
      const blob = await render();
      download(blob, rename(file.name, format));
    } catch {
      setError("That image could not be saved. Try a different format.");
    }
  }, [file, format, render]);

  function take() {
    if (hasGivenEmail()) {
      void save();
      return;
    }
    setGateFor(() => () => void save());
  }

  const out = bitmap ? outputSize(bitmap, orient) : null;

  return (
    <div className="flex flex-col gap-6">
      <ImagePicker onPick={pick} current={file} />

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      {bitmap ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Action label="Rotate left" onClick={() => setOrient(rotateCCW)}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            </Action>
            <Action label="Rotate right" onClick={() => setOrient(rotateCW)}>
              <RotateCw aria-hidden="true" className="h-4 w-4" />
            </Action>
            <Action label="Flip left to right" onClick={() => setOrient(flipHorizontal)}>
              <FlipHorizontal2 aria-hidden="true" className="h-4 w-4" />
            </Action>
            <Action label="Flip top to bottom" onClick={() => setOrient(flipVertical)}>
              <FlipVertical2 aria-hidden="true" className="h-4 w-4" />
            </Action>
            <button
              type="button"
              onClick={() => setOrient(IDENTITY)}
              disabled={isIdentity(orient)}
              className="inline-flex min-h-[40px] items-center rounded-full px-4 text-[14px] text-text-light hover:text-primary-dark disabled:opacity-40"
            >
              Reset
            </button>
          </div>

          <div className="ek-card flex flex-col items-center gap-2 bg-bg-soft p-4">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Preview of the image after turning and flipping"
              className="max-w-full rounded-[8px]"
            />
            {out ? (
              <p className="text-[13px] text-text-light">
                {out.width} x {out.height} px
              </p>
            ) : null}
          </div>

          <FormatChoice
            format={format}
            setFormat={setFormat}
            quality={quality}
            setQuality={setQuality}
          />

          <div>
            <button type="button" onClick={take} className="ek-btn ek-btn-accent">
              Save the image
            </button>
            {file ? (
              <p className="mt-2 text-[13px] text-text-light">
                From {formatBytes(file.size)}. {isIdentity(orient) ? "Nothing turned yet, so this saves it as it is." : "The turns above are baked into the file."}
              </p>
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

function Action({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line px-4 text-[14px] hover:border-line-strong"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function FormatChoice({
  format,
  setFormat,
  quality,
  setQuality,
}: {
  format: Encodable;
  setFormat: (v: Encodable) => void;
  quality: number;
  setQuality: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="format" className="block text-[14px] font-semibold">
          Save as
        </label>
        <select
          id="format"
          value={format}
          onChange={(event) => setFormat(event.target.value as Encodable)}
          className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary sm:w-auto"
        >
          <option value="image/jpeg">JPG</option>
          <option value="image/png">PNG, keeps transparency</option>
          <option value="image/webp">WebP, smallest</option>
        </select>
      </div>
      {format !== "image/png" ? (
        <div>
          <label htmlFor="quality" className="block text-[14px] font-semibold">
            Quality: {quality}
          </label>
          <input
            id="quality"
            type="range"
            min={40}
            max={100}
            value={quality}
            onChange={(event) => setQuality(Number(event.target.value))}
            className="mt-2 w-full max-w-[320px] accent-[var(--color-primary)]"
          />
        </div>
      ) : null}
    </div>
  );
}
