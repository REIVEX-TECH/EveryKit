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
import { describeChange, formatBytes } from "@/lib/images/resize";
import { searchForTarget } from "@/lib/images/targetSize";
import { ImagePicker } from "./ImagePicker";

type Mode = "quality" | "target";

export function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [format, setFormat] = useState<Encodable>("image/jpeg");
  const [mode, setMode] = useState<Mode>("quality");
  const [quality, setQuality] = useState(70);
  const [targetKb, setTargetKb] = useState("500");
  const [liveSize, setLiveSize] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<{ blob: Blob; note: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const liveToken = useRef(0);

  const pick = useCallback(async (picked: File) => {
    setError(null);
    setOutcome(null);
    setLiveSize(null);
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

  const encodeAt = useCallback(
    async (q: number): Promise<Blob> => {
      if (!bitmap) throw new Error("No image.");
      const canvas = makeCanvas(bitmap.width, bitmap.height);
      const ctx = context2d(canvas);
      if (format === "image/jpeg") whiteGround(ctx, bitmap.width, bitmap.height);
      ctx.drawImage(bitmap, 0, 0);
      return encodeCanvas(canvas, format, q / 100);
    },
    [bitmap, format],
  );

  // Live size readout for the quality slider. PNG has no quality to trade, so
  // it is encoded once and its size shown flat.
  useEffect(() => {
    if (!bitmap || mode !== "quality") return;
    const token = ++liveToken.current;
    const q = format === "image/png" ? 100 : quality;
    void encodeAt(q).then((blob) => {
      if (token === liveToken.current) setLiveSize(blob.size);
    });
  }, [bitmap, mode, quality, format, encodeAt]);

  const compress = useCallback(async () => {
    if (!bitmap || !file) return;
    setBusy(true);
    setError(null);
    setOutcome(null);
    try {
      if (format === "image/png") {
        const blob = await encodeAt(100);
        setOutcome({
          blob,
          note: `${formatBytes(file.size)} to ${formatBytes(blob.size)}, ${describeChange(file.size, blob.size)}. PNG is lossless, so there is little to gain; convert to JPG or WebP for a real reduction.`,
        });
        return;
      }

      if (mode === "target") {
        const target = Math.round(Number(targetKb) * 1024);
        if (!Number.isFinite(target) || target <= 0) {
          setError("Type a target size in kilobytes, such as 500.");
          return;
        }
        const result = await searchForTarget(target, (q) => encodeAt(q * 100));
        setOutcome({
          blob: result.encoded.blob,
          note: result.metTarget
            ? `Landed at ${formatBytes(result.encoded.size)}, under your ${formatBytes(target)}, at quality ${Math.round(result.encoded.quality * 100)}.`
            : `Could not reach ${formatBytes(target)}. This is the smallest it goes, ${formatBytes(result.encoded.size)} at quality ${Math.round(result.encoded.quality * 100)}.`,
        });
        return;
      }

      const blob = await encodeAt(quality);
      setOutcome({
        blob,
        note: `${formatBytes(file.size)} to ${formatBytes(blob.size)}, ${describeChange(file.size, blob.size)}, at quality ${quality}.`,
      });
    } catch {
      setError("That image could not be compressed. Try a different format.");
    } finally {
      setBusy(false);
    }
  }, [bitmap, file, format, mode, quality, targetKb, encodeAt]);

  const save = useCallback(() => {
    if (outcome && file) download(outcome.blob, rename(file.name, format));
  }, [outcome, file, format]);

  function take() {
    if (hasGivenEmail()) {
      save();
      return;
    }
    setGateFor(() => save);
  }

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
              <option value="image/webp">WebP, usually smallest</option>
              <option value="image/png">PNG, lossless</option>
            </select>
          </div>

          {format !== "image/png" ? (
            <fieldset>
              <legend className="text-[14px] font-semibold">How to compress</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["quality", "target"] as const).map((value) => (
                  <label
                    key={value}
                    className={[
                      "cursor-pointer rounded-full border px-4 py-2 text-[14px]",
                      mode === value ? "border-primary bg-primary/5" : "border-line",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === value}
                      onChange={() => setMode(value)}
                      className="sr-only"
                    />
                    {value === "quality" ? "By quality" : "To a target size"}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {format !== "image/png" && mode === "quality" ? (
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
              <p className="mt-1 text-[13px] text-text-light" aria-live="polite">
                {liveSize !== null
                  ? `About ${formatBytes(liveSize)} at this quality, from ${formatBytes(file!.size)}.`
                  : "Measuring…"}
              </p>
            </div>
          ) : null}

          {format !== "image/png" && mode === "target" ? (
            <div>
              <label htmlFor="target" className="block text-[14px] font-semibold">
                Target size in kilobytes
              </label>
              <input
                id="target"
                type="number"
                inputMode="numeric"
                min={1}
                value={targetKb}
                onChange={(event) => setTargetKb(event.target.value)}
                className="mt-2 w-full max-w-[200px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
              <p className="mt-1 text-[13px] text-text-light">
                It searches for the highest quality that still comes in under this. Best-effort:
                if even the lowest quality is bigger, it says so.
              </p>
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={compress}
              disabled={busy}
              className="ek-btn ek-btn-accent disabled:opacity-50"
            >
              {busy ? "Compressing…" : "Compress the image"}
            </button>
          </div>

          {outcome ? (
            <div className="ek-card p-4">
              <p className="text-[15px]">{outcome.note}</p>
              <button type="button" onClick={take} className="ek-btn ek-btn-accent mt-3">
                Save the image
              </button>
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
            </div>
          ) : null}

          <MoreFromEveryKit />
        </>
      ) : null}
    </div>
  );
}
