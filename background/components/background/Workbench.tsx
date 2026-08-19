"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImageUp, X } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { revealResult } from "@/lib/revealResult";
import { MAX_BATCH } from "@/data/modes";
import {
  applyMode,
  canvasToBlob,
  downloadBlob,
  removeToTransparent,
  type RemovalProgress,
} from "@/lib/background/remove";
import {
  describeMode,
  normaliseHex,
  outputFilename,
  PRESETS,
  type OutputMode,
} from "@/lib/background/output";
import { EdgeZoom } from "./EdgeZoom";

const ACCEPT = "image/jpeg,image/png,image/webp";

type Item = {
  name: string;
  /** The subject on transparent pixels, at the original resolution. */
  cutout: HTMLCanvasElement;
  width: number;
  height: number;
};

export function Workbench({ initialMode }: { initialMode: OutputMode }) {
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<OutputMode>(initialMode);
  const [hex, setHex] = useState(initialMode.kind === "colour" ? initialMode.hex : "");
  const [progress, setProgress] = useState<RemovalProgress | null>(null);
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const previewRefs = useRef<Array<HTMLCanvasElement | null>>([]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((file) => file.type.startsWith("image/"));
    if (picked.length === 0) {
      setError("Those did not look like images. JPG, PNG and WebP are what this reads.");
      return;
    }
    setError(null);
    setItems([]);
    setFiles((current) => {
      const next = [...current, ...picked];
      if (next.length > MAX_BATCH) {
        setError(`Five at a time. The first ${MAX_BATCH} are kept.`);
        return next.slice(0, MAX_BATCH);
      }
      return next;
    });
  }

  async function run() {
    if (files.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setItems([]);
    setDone(0);

    const produced: Item[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const bitmap = await createImageBitmap(file);
        try {
          const cutout = await removeToTransparent(bitmap, setProgress);
          produced.push({
            name: file.name,
            cutout,
            width: cutout.width,
            height: cutout.height,
          });
        } finally {
          bitmap.close();
        }
        setDone(index + 1);
        // Let the browser paint between images rather than locking the tab.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      setItems(produced);
      requestAnimationFrame(() => revealResult(resultRef.current));
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "The background could not be removed on this device.",
      );
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }

  // Redraw every preview whenever the cutouts or the chosen mode change.
  useEffect(() => {
    items.forEach((item, index) => {
      const view = previewRefs.current[index];
      if (!view) return;
      const shown = applyMode(item.cutout, mode);
      const maxEdge = 240;
      const scale = Math.min(maxEdge / shown.width, maxEdge / shown.height, 1);
      view.width = Math.round(shown.width * scale);
      view.height = Math.round(shown.height * scale);
      const ctx = view.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, view.width, view.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(shown, 0, 0, view.width, view.height);
    });
  }, [items, mode]);

  const take = useCallback((save: () => void) => {
    if (hasGivenEmail()) {
      save();
      return;
    }
    setGateFor(() => save);
  }, []);

  async function saveOne(item: Item) {
    const blob = await canvasToBlob(applyMode(item.cutout, mode), "image/png");
    downloadBlob(blob, outputFilename(item.name, mode));
  }

  async function saveAll() {
    for (const item of items) await saveOne(item);
  }

  const chequer = {
    backgroundImage:
      "linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        className="ek-card flex flex-col items-center gap-3 border-dashed p-8 text-center"
      >
        <ImageUp aria-hidden="true" className="h-8 w-8 text-text-light" />
        <p className="text-[16px]">Drop a photo here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="ek-btn ek-btn-accent"
        >
          Choose a photo
        </button>
        <input
          ref={inputRef}
          type="file"
          // The visible control is the button above; this input stays in the
          // accessibility tree, so it needs its own name.
          aria-label="Choose photos from your device"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <p className="text-[13px] text-text-light">
          JPG, PNG and WebP, up to five at once. They stay on your device.
        </p>
      </div>

      {files.length > 0 ? (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">
              {files.length} {files.length === 1 ? "photo" : "photos"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setItems([]);
              }}
              className="inline-flex min-h-[24px] items-center text-[14px] text-text-light hover:text-primary-dark"
            >
              Remove all
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-[10px] bg-bg-soft px-3 py-2"
              >
                <span className="truncate text-[14px]">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((c) => c.filter((_, i) => i !== index))}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-light hover:bg-line hover:text-foreground"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <BackgroundPicker mode={mode} setMode={setMode} hex={hex} setHex={setHex} />

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          onClick={run}
          disabled={files.length === 0 || busy}
          className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? files.length > 1
              ? `Working, ${done} of ${files.length}`
              : "Working"
            : files.length > 1
              ? `Remove ${files.length} backgrounds`
              : "Remove the background"}
        </button>
        {progress ? (
          <p aria-live="polite" className="mt-2 text-[13px] text-text-light">
            {progress.message}
            {progress.phase === "loading"
              ? " The model is about 20 MB and is only fetched once."
              : ""}
          </p>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div ref={resultRef} className="ek-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[18px]">
              {items.length === 1 ? "Your photo" : `Your ${items.length} photos`}
            </h2>
            <p className="text-[14px] text-text-light">{describeMode(mode)}</p>
          </div>

          <ul className="mt-4 flex flex-col gap-4">
            {items.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex flex-wrap items-center gap-4">
                <div className="rounded-[12px] border border-line p-1" style={chequer}>
                  <canvas
                    ref={(node) => {
                      previewRefs.current[index] = node;
                    }}
                    className="block rounded-[8px]"
                    aria-label={`${item.name}, ${describeMode(mode).toLowerCase()}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px]">{item.name}</p>
                  <p className="text-[13px] text-text-light">
                    {item.width} x {item.height} px, full resolution
                  </p>
                  <button
                    type="button"
                    onClick={() => take(() => void saveOne(item))}
                    className="ek-btn ek-btn-quiet mt-2 py-2 text-[14px]"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-line pt-4">
            <h3 className="text-[15px] font-semibold">Check the edges</h3>
            <div className="mt-3">
              <EdgeZoom cutout={items[0].cutout} />
            </div>
          </div>

          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => take(() => void saveAll())}
              className="ek-btn ek-btn-accent mt-4"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Save all {items.length}
            </button>
          ) : null}

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
        </div>
      ) : null}
    </div>
  );
}

function BackgroundPicker({
  mode,
  setMode,
  hex,
  setHex,
}: {
  mode: OutputMode;
  setMode: (mode: OutputMode) => void;
  hex: string;
  setHex: (hex: string) => void;
}) {
  const custom = normaliseHex(hex);
  const badHex = hex.trim() !== "" && custom === null;

  return (
    <fieldset>
      <legend className="text-[14px] font-semibold">Background</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode({ kind: "transparent" })}
          aria-pressed={mode.kind === "transparent"}
          className={[
            "inline-flex min-h-[36px] items-center rounded-full border px-4 py-2 text-[14px] transition-colors",
            mode.kind === "transparent"
              // primary-dark rather than primary: white on #1d81f2 is 3.88:1,
              // under the 4.5 that 14px text needs. #1769d4 is 5.24:1.
              ? "border-primary-dark bg-primary-dark text-white"
              : "border-line text-text-light hover:border-line-strong hover:text-foreground",
          ].join(" ")}
        >
          Transparent
        </button>

        {PRESETS.map((preset) => {
          const active = mode.kind === "colour" && mode.hex === preset.hex;
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => setMode({ kind: "colour", hex: preset.hex })}
              aria-pressed={active}
              className={[
                "inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-2 text-[14px] transition-colors",
                active
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-line text-text-light hover:border-line-strong hover:text-foreground",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 rounded-full border border-line"
                style={{ background: preset.hex }}
              />
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="hex" className="text-[14px] text-text-light">
          Or a hex colour
        </label>
        <input
          id="hex"
          type="text"
          inputMode="text"
          value={hex}
          onChange={(event) => {
            setHex(event.target.value);
            const parsed = normaliseHex(event.target.value);
            if (parsed) setMode({ kind: "colour", hex: parsed });
          }}
          placeholder="#1d81f2"
          aria-invalid={badHex}
          className="w-[140px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
        />
        {custom ? (
          <span
            aria-hidden="true"
            className="h-6 w-6 rounded-full border border-line"
            style={{ background: custom }}
          />
        ) : null}
      </div>
      {badHex ? (
        <p role="alert" className="mt-1 text-[13px] text-warn">
          That is not a hex colour. Three or six digits, like #1d81f2.
        </p>
      ) : null}
    </fieldset>
  );
}
