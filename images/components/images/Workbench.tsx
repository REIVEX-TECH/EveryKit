"use client";

import { useRef, useState } from "react";
import { Download, ImageUp, X } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { revealResult } from "@/lib/revealResult";
import type { ToolSlug } from "@/data/tools";
import { runImage, runStrip, type Done, type OutputFormat } from "@/lib/images/process";
import { describeChange, formatBytes, type Fit } from "@/lib/images/resize";
import { makeZip, uniqueNames } from "@/lib/images/zip";

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Past this many the browser is doing enough work that the page should say so
 * rather than appear stuck.
 */
const MANY = 8;

type Status = "idle" | "working" | "done";

export function Workbench({ tool }: { tool: ToolSlug }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Done[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);

  // Resize settings
  const [width, setWidth] = useState("1600");
  const [height, setHeight] = useState("");
  const [fit, setFit] = useState<Fit>("inside");
  const [allowUpscale, setAllowUpscale] = useState(false);

  // Convert settings
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(82);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((file) => file.type.startsWith("image/"));
    if (picked.length === 0) {
      setError("Those did not look like images. JPG, PNG and WebP are what this reads.");
      return;
    }
    setError(null);
    setResults([]);
    setStatus("idle");
    setFiles((current) => [...current, ...picked]);
  }

  async function run() {
    if (files.length === 0) return;
    setStatus("working");
    setProgress(0);
    setError(null);

    const done: Done[] = [];
    try {
      for (const [index, file] of files.entries()) {
        if (tool === "strip-exif") {
          done.push(await runStrip(file));
        } else {
          const numericWidth = width.trim() === "" ? null : Number(width);
          const numericHeight = height.trim() === "" ? null : Number(height);
          done.push(
            await runImage({
              file,
              target:
                tool === "resize"
                  ? { width: numericWidth, height: numericHeight, fit, allowUpscale }
                  : { width: null, height: null, fit: "inside", allowUpscale: false },
              format: tool === "convert" ? format : "keep",
              quality: quality / 100,
            }),
          );
        }
        setProgress(index + 1);
        // Let the browser paint the progress between files.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setResults(done);
      setStatus("done");
      requestAnimationFrame(() => {
        if (resultRef.current) revealResult(resultRef.current);
      });
    } catch (problem) {
      setStatus("idle");
      setError(
        problem instanceof Error
          ? problem.message
          : "Something went wrong with one of those images.",
      );
    }
  }

  function take(save: () => void) {
    if (hasGivenEmail()) {
      save();
      return;
    }
    setGateFor(() => save);
  }

  function saveOne(result: Done) {
    download(result.blob, result.name);
  }

  async function saveAll() {
    const names = uniqueNames(results.map((result) => result.name));
    const entries = await Promise.all(
      results.map(async (result, index) => ({
        name: names[index],
        bytes: new Uint8Array(await result.blob.arrayBuffer()),
      })),
    );
    const zip = makeZip(entries);
    download(new Blob([zip as unknown as BlobPart], { type: "application/zip" }), "everykit-images.zip");
  }

  const totalBefore = results.reduce((sum, r) => sum + r.beforeBytes, 0);
  const totalAfter = results.reduce((sum, r) => sum + r.afterBytes, 0);

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
        <p className="text-[16px]">Drop images here, or</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="ek-btn ek-btn-accent">
          Choose images
        </button>
        <input
          ref={inputRef}
          type="file"
          // The visible control is the button above; this input stays in the
          // accessibility tree, so it needs its own name rather than relying on
          // the button's. Same handling as the other kits.
          aria-label="Choose images from your device"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <p className="text-[13px] text-text-light">
          JPG, PNG and WebP. They stay on your device.
        </p>
      </div>

      {files.length > 0 ? (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">
              {files.length} {files.length === 1 ? "image" : "images"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setResults([]);
                setStatus("idle");
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
                <span className="flex items-center gap-3">
                  <span className="shrink-0 text-[13px] text-text-light">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((c) => c.filter((_, i) => i !== index))}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text-light hover:bg-line hover:text-foreground"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Settings
        tool={tool}
        width={width} setWidth={setWidth}
        height={height} setHeight={setHeight}
        fit={fit} setFit={setFit}
        allowUpscale={allowUpscale} setAllowUpscale={setAllowUpscale}
        format={format} setFormat={setFormat}
        quality={quality} setQuality={setQuality}
      />

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          onClick={run}
          disabled={files.length === 0 || status === "working"}
          className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "working"
            ? `Working, ${progress} of ${files.length}`
            : labelFor(tool, files.length)}
        </button>
        {status === "working" && files.length > MANY ? (
          <p aria-live="polite" className="mt-2 text-[13px] text-text-light">
            Large batches take a moment. They are handled one at a time so the tab does not
            run out of memory.
          </p>
        ) : null}
      </div>

      {status === "done" ? (
        <div ref={resultRef} className="ek-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[18px]">
              {results.length === 1 ? "Your image" : `Your ${results.length} images`}
            </h2>
            <p className="text-[14px] text-text-light">
              {formatBytes(totalBefore)} → {formatBytes(totalAfter)},{" "}
              {describeChange(totalBefore, totalAfter)}
            </p>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {results.map((result, index) => (
              <li key={`${result.name}-${index}`} className="rounded-[10px] bg-bg-soft px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate text-[14px]">{result.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-[13px] text-text-light">
                      {formatBytes(result.beforeBytes)} → {formatBytes(result.afterBytes)}
                      {result.width > 0 ? ` · ${result.width}x${result.height}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => take(() => saveOne(result))}
                      className="inline-flex min-h-[24px] items-center text-[14px] text-primary hover:text-primary-dark"
                    >
                      Save
                    </button>
                  </span>
                </div>
                {result.note ? (
                  <p className="mt-1 text-[13px] text-text-light">{result.note}</p>
                ) : null}
              </li>
            ))}
          </ul>

          {results.length > 1 ? (
            <button
              type="button"
              onClick={() => take(saveAll)}
              className="ek-btn ek-btn-accent mt-4"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Save all {results.length} as a ZIP
            </button>
          ) : null}

          {gateFor ? (
            <EmailGate
              actionLabel="Save"
              onDone={() => { gateFor(); setGateFor(null); }}
              // Dismissed: nothing is saved. A cancel, not a skip.
              onCancel={() => setGateFor(null)}
            />
          ) : null}

          <MoreFromEveryKit />
        </div>
      ) : null}
    </div>
  );
}

function labelFor(tool: ToolSlug, count: number): string {
  const many = count > 1 ? ` ${count} images` : count === 1 ? " image" : "";
  if (tool === "resize") return `Resize${many || " images"}`;
  if (tool === "convert") return `Convert${many || " images"}`;
  return `Remove metadata from${many || " images"}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---------------------------------------------------------------------------

function Settings(props: {
  tool: ToolSlug;
  width: string; setWidth: (v: string) => void;
  height: string; setHeight: (v: string) => void;
  fit: Fit; setFit: (v: Fit) => void;
  allowUpscale: boolean; setAllowUpscale: (v: boolean) => void;
  format: OutputFormat; setFormat: (v: OutputFormat) => void;
  quality: number; setQuality: (v: number) => void;
}) {
  const { tool } = props;

  if (tool === "strip-exif") {
    return (
      <p className="max-w-[60ch] text-[14px] text-text-light">
        There is nothing to set. The metadata comes out and the picture is copied through
        untouched. There is no quality setting, because nothing is re-compressed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tool === "resize" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="width" className="block text-[14px] font-semibold">
                Width in pixels
              </label>
              <input
                id="width"
                type="number"
                inputMode="numeric"
                min={1}
                value={props.width}
                onChange={(event) => props.setWidth(event.target.value)}
                placeholder="1600"
                className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-[14px] font-semibold">
                Height in pixels
              </label>
              <input
                id="height"
                type="number"
                inputMode="numeric"
                min={1}
                value={props.height}
                onChange={(event) => props.setHeight(event.target.value)}
                placeholder="leave blank to follow the width"
                className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-[14px] font-semibold">
              When both are set, what should happen
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {([
                { value: "inside", label: "Fit inside", detail: "Nothing is cropped" },
                { value: "cover", label: "Fill and crop", detail: "Cropped from the centre" },
                { value: "exact", label: "Exact size", detail: "Distorts the picture" },
              ] as const).map((option) => (
                <label
                  key={option.value}
                  className={[
                    "flex cursor-pointer flex-col rounded-[12px] border px-3 py-2 transition-colors",
                    props.fit === option.value
                      ? "border-primary bg-primary/5"
                      : "border-line hover:border-line-strong",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2 text-[14px] font-semibold">
                    <input
                      type="radio"
                      name="fit"
                      checked={props.fit === option.value}
                      onChange={() => props.setFit(option.value)}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    {option.label}
                  </span>
                  <span className="mt-0.5 pl-6 text-[12px] text-text-light">{option.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={props.allowUpscale}
              onChange={(event) => props.setAllowUpscale(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span>
              Enlarge images that are already smaller
              <span className="block text-[13px] text-text-light">
                Off by default. Enlarging cannot add detail that was never captured.
              </span>
            </span>
          </label>
        </>
      ) : (
        <div>
          <label htmlFor="format" className="block text-[14px] font-semibold">
            Convert to
          </label>
          <select
            id="format"
            value={props.format}
            onChange={(event) => props.setFormat(event.target.value as OutputFormat)}
            className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary sm:w-auto"
          >
            <option value="image/jpeg">JPG, for photographs</option>
            <option value="image/png">PNG, for screenshots and transparency</option>
            <option value="image/webp">WebP, the smallest</option>
          </select>
          {props.format === "image/png" ? (
            <p className="mt-2 max-w-[56ch] text-[13px] text-text-light">
              PNG is lossless, so a photograph saved as PNG usually comes out considerably
              larger than the JPG it started as. The sizes below will show what actually
              happened.
            </p>
          ) : null}
        </div>
      )}

      {props.format !== "image/png" ? (
        <div>
          <label htmlFor="quality" className="block text-[14px] font-semibold">
            Quality: {props.quality}
          </label>
          <input
            id="quality"
            type="range"
            min={40}
            max={100}
            value={props.quality}
            onChange={(event) => props.setQuality(Number(event.target.value))}
            className="mt-2 w-full max-w-[320px] accent-[var(--color-primary)]"
          />
          <p className="mt-1 text-[13px] text-text-light">
            82 is a good default. Above about 92 the file grows quickly for very little
            visible gain.
          </p>
        </div>
      ) : null}
    </div>
  );
}
