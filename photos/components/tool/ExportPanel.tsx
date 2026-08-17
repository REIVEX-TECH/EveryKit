"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { specSizeLabel, type PhotoSpec } from "@/data/specs";
import { downloadBlob, createCanvas } from "@/lib/imaging/imageSource";
import { drawPrintSheet, layoutPrintSheet, SHEET_4X6 } from "@/lib/imaging/printSheet";
import {
  exportCanvas,
  outputFilename,
  type ExportFormat,
} from "@/lib/imaging/render";
import { PAYMENTS_ENABLED, PRICE_LABEL, hasPaid, startCheckout } from "@/lib/payments";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";

type Props = {
  spec: PhotoSpec;
  /** Draw the finished photo at the given size. Null while nothing is loaded. */
  renderSingle: ((options: { watermark: boolean }) => HTMLCanvasElement) | null;
  /** A failing check blocks the download until the user fixes or overrides it. */
  blockedReason: string | null;
};

const PREVIEW_MAX_HEIGHT = 260;
const SHEET_PREVIEW_WIDTH = 460;

/**
 * Coalesce a redraw into the next frame.
 *
 * A plain requestAnimationFrame would be enough, except that browsers stop
 * firing it in a hidden tab. Someone who opens the tool in a background tab and
 * switches to it later would find the preview blank, so hidden documents get a
 * timer instead.
 */
function schedule(draw: () => void): { cancel: () => void } {
  if (typeof document !== "undefined" && document.hidden) {
    const id = window.setTimeout(draw, 0);
    return { cancel: () => clearTimeout(id) };
  }
  const id = requestAnimationFrame(draw);
  return { cancel: () => cancelAnimationFrame(id) };
}

export function ExportPanel({ spec, renderSingle, blockedReason }: Props) {
  const photoRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<ExportFormat>("image/jpeg");
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /**
   * Whether the clean file is available. Always true in launch mode.
   *
   * Read during initialisation rather than in an effect. That consults
   * sessionStorage, which would normally risk a hydration mismatch — but this
   * panel only exists once a photo has been loaded and cropped, so it is never
   * part of the server-rendered markup. Doing it in an effect instead meant
   * someone who had already paid saw the buy button flash up first.
   */
  const [unlocked, setUnlocked] = useState(() => hasPaid());

  // Memoised because the redraw effect depends on it.
  const layout = useMemo(() => layoutPrintSheet(spec, SHEET_4X6), [spec]);

  // Redraw both previews whenever the crop or the spec changes. This runs on
  // every drag, so it draws at display size rather than export size, and the
  // work is coalesced into one frame.
  useEffect(() => {
    if (!renderSingle) return;
    const frame = schedule(() => {
      const photoHeight = PREVIEW_MAX_HEIGHT;
      const photoWidth = photoHeight * (spec.widthMm / spec.heightMm);
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const rendered = renderSingle({ watermark: false });

      const photoCanvas = photoRef.current;
      if (photoCanvas) {
        photoCanvas.width = Math.round(photoWidth * dpr);
        photoCanvas.height = Math.round(photoHeight * dpr);
        photoCanvas.style.width = `${photoWidth}px`;
        photoCanvas.style.height = `${photoHeight}px`;
        const ctx = photoCanvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(rendered, 0, 0, photoCanvas.width, photoCanvas.height);
        }
      }

      const sheetCanvas = sheetRef.current;
      if (sheetCanvas) {
        const sheetHeight =
          (SHEET_PREVIEW_WIDTH * layout.sheetHeightPx) / layout.sheetWidthPx;
        sheetCanvas.width = Math.round(SHEET_PREVIEW_WIDTH * dpr);
        sheetCanvas.height = Math.round(sheetHeight * dpr);
        sheetCanvas.style.width = "100%";
        sheetCanvas.style.aspectRatio = `${layout.sheetWidthPx} / ${layout.sheetHeightPx}`;
        sheetCanvas.style.height = "auto";
        const ctx = sheetCanvas.getContext("2d");
        if (ctx) {
          const previewScale = sheetCanvas.width / layout.sheetWidthPx;
          ctx.save();
          ctx.scale(previewScale, previewScale);
          drawPrintSheet(ctx, rendered, layout);
          ctx.restore();
        }
      }
    });
    return () => frame.cancel();
  }, [renderSingle, spec, layout]);

  const savePhoto = useCallback(
    async (watermark: boolean) => {
      if (!renderSingle) return;
      setStatus("Preparing your file");
      try {
        const canvas = renderSingle({ watermark });
        const blob = await exportCanvas(canvas, format, spec.dpi);
        downloadBlob(
          blob,
          outputFilename(spec, format, watermark ? "preview" : undefined),
        );
        setStatus(null);
        if (!watermark) setDone(true);
      } catch {
        setStatus("That file could not be saved. Try the other format.");
      }
    },
    [format, renderSingle, spec],
  );

  const saveSheet = useCallback(async () => {
    if (!renderSingle) return;
    setStatus("Building the print sheet");
    try {
      const photo = renderSingle({ watermark: false });
      const canvas = createCanvas(layout.sheetWidthPx, layout.sheetHeightPx);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");
      drawPrintSheet(ctx, photo, layout);
      const blob = await exportCanvas(canvas, format, SHEET_4X6.dpi);
      downloadBlob(blob, outputFilename(spec, format, "4x6-sheet"));
      setStatus(null);
      setDone(true);
    } catch {
      setStatus("The print sheet could not be saved.");
    }
  }, [format, layout, renderSingle, spec]);

  const onBuy = useCallback(async () => {
    setStatus("Opening checkout");
    try {
      const result = await startCheckout();
      if (result === "paid") {
        setUnlocked(true);
        setStatus(null);
        // The purchase covers both files, so both are handed over without
        // making anyone hunt for a second button.
        await savePhoto(false);
        await saveSheet();
      } else {
        setStatus(null);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Checkout could not open.");
    }
  }, [savePhoto, saveSheet]);

  return (
    <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
      <div>
        <canvas
          ref={photoRef}
          aria-label={`Your finished ${specSizeLabel(spec)} photo`}
          role="img"
          className="rounded-[4px] border border-line"
        />
        <p className="mt-2 text-[13px] text-text-light">
          {spec.pixelWidth} x {spec.pixelHeight} px, {specSizeLabel(spec)} at {spec.dpi} DPI
        </p>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-foreground">
          Print sheet — {layout.count} {layout.count === 1 ? "copy" : "copies"} on 4 x 6 inch paper
        </h3>
        <canvas
          ref={sheetRef}
          role="img"
          aria-label={`A 4 by 6 inch sheet holding ${layout.count} copies of your photo with cut lines between them`}
          className="mt-3 w-full rounded-[8px] border border-line"
        />
        <p className="mt-2 text-[13px] text-text-light">
          Any photo shop that prints 4 x 6 will print this. Cut along the lines.
        </p>

        <fieldset className="mt-6">
          <legend className="text-[13px] text-text-light">File format</legend>
          <div className="mt-2 inline-flex rounded-full border border-line p-1">
            {(
              [
                ["image/jpeg", "JPEG"],
                ["image/png", "PNG"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={format === value}
                onClick={() => setFormat(value)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${
                  format === value ? "bg-foreground text-white" : "text-text-light"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-text-light">
            {format === "image/jpeg"
              ? "JPEG is what most online applications ask for."
              : "PNG is larger and lossless. Use it if the form asks for PNG."}
          </p>
        </fieldset>

        {blockedReason ? (
          <p className="mt-6 rounded-[12px] border border-line bg-bg-soft p-3 text-[14px] text-warn">
            {blockedReason}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {unlocked ? (
            <>
              <button
                type="button"
                className="ek-btn ek-btn-accent"
                onClick={() => savePhoto(false)}
              >
                <Download size={17} aria-hidden="true" />
                Download the photo
              </button>
              <button type="button" className="ek-btn ek-btn-quiet" onClick={saveSheet}>
                <Printer size={16} aria-hidden="true" />
                Download the print sheet
              </button>
              {PAYMENTS_ENABLED ? (
                <span className="rounded-full border border-line px-3 py-1 text-[12px] text-text-light">
                  paid — thank you
                </span>
              ) : (
                <span className="rounded-full border border-line px-3 py-1 text-[12px] text-text-light">
                  launch week — free
                </span>
              )}
            </>
          ) : (
            <>
              <button type="button" className="ek-btn ek-btn-accent" onClick={onBuy}>
                <Download size={17} aria-hidden="true" />
                Get the clean file — {PRICE_LABEL}
              </button>
              <button
                type="button"
                className="ek-btn ek-btn-quiet"
                onClick={() => savePhoto(true)}
              >
                Download the watermarked preview
              </button>
            </>
          )}
        </div>

        {PAYMENTS_ENABLED && !unlocked ? (
          <p className="mt-3 text-[13px] text-text-light">
            One payment for this photo and the print sheet. No account, nothing
            to cancel. The preview above is exactly what you get, minus the
            watermark.
          </p>
        ) : null}

        <p aria-live="polite" className="mt-3 min-h-[20px] text-[14px] text-text-light">
          {status}
        </p>

        {done ? (
          <div className="mt-2 border-t border-line pt-4">
            <p className="text-[14px] text-foreground">That&apos;s it — you&apos;re done.</p>
            <p className="mt-1 text-[14px] text-text-light">
              Check the file opens at {specSizeLabel(spec)} before you submit it.
            </p>
            <MoreFromEveryKit />
          </div>
        ) : null}
      </div>
    </div>
  );
}
