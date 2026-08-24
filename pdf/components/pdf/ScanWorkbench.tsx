"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Dropzone } from "@/components/pdf/Dropzone";
import { ResultPanel, type ResultFile } from "@/components/pdf/ResultPanel";
import { getTool } from "@/data/tools";
import { takeStashedFiles, type PickedFile } from "@/lib/pdf/files";
import { applyFilter, type ScanFilter } from "@/lib/scan/filters";
import { estimateSize, warpPerspective, type Point } from "@/lib/scan/perspective";
import { PDFDocument } from "pdf-lib";

/** A page waiting to be scanned: its bytes, a preview URL, and its four corners. */
type ScanPage = {
  id: string;
  name: string;
  bytes: Uint8Array;
  type: string;
  url: string;
  /** Corners as fractions of the image, top-left, top-right, bottom-right, bottom-left. */
  corners: Point[];
};

const FILTERS: Array<{ value: ScanFilter; label: string; detail: string }> = [
  { value: "scan", label: "Scan", detail: "Clean black on white" },
  { value: "grayscale", label: "Grayscale", detail: "Photo, no colour" },
  { value: "original", label: "Original", detail: "The photo as taken" },
];

/** Corners a little inside the frame, so most photos need only a nudge. */
const DEFAULT_CORNERS: Point[] = [
  { x: 0.06, y: 0.06 },
  { x: 0.94, y: 0.06 },
  { x: 0.94, y: 0.94 },
  { x: 0.06, y: 0.94 },
];

const A4_LONG_EDGE_PT = 842;
let counter = 0;

export function ScanWorkbench() {
  const tool = getTool("scan")!;
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [filter, setFilter] = useState<ScanFilter>("scan");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[] | null>(null);

  const addFiles = useCallback((incoming: PickedFile[]) => {
    setError(null);
    setResults(null);
    setPages((current) => [
      ...current,
      ...incoming.map((file) => {
        counter += 1;
        return {
          id: `p${counter}`,
          name: file.name,
          bytes: file.bytes,
          type: file.type,
          url: URL.createObjectURL(new Blob([file.bytes.slice()], { type: file.type })),
          corners: DEFAULT_CORNERS.map((c) => ({ ...c })),
        };
      }),
    ]);
  }, []);

  // Photos dropped on the landing page arrive here on first render.
  useEffect(() => {
    const stashed = takeStashedFiles();
    if (stashed.length > 0) addFiles(stashed);
  }, [addFiles]);

  // Revoke preview URLs when the component goes away.
  useEffect(() => {
    return () => pages.forEach((page) => URL.revokeObjectURL(page.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCorners(id: string, corners: Point[]) {
    setPages((current) => current.map((p) => (p.id === id ? { ...p, corners } : p)));
  }

  function move(id: string, delta: number) {
    setPages((current) => {
      const index = current.findIndex((p) => p.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(id: string) {
    setPages((current) => {
      const page = current.find((p) => p.id === id);
      if (page) URL.revokeObjectURL(page.url);
      return current.filter((p) => p.id !== id);
    });
  }

  function startOver() {
    pages.forEach((page) => URL.revokeObjectURL(page.url));
    setPages([]);
    setResults(null);
    setError(null);
    setProgress(null);
  }

  async function run() {
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      const pdf = await PDFDocument.create();
      for (let i = 0; i < pages.length; i += 1) {
        setProgress(`Straightening page ${i + 1} of ${pages.length}`);
        const page = pages[i];
        const jpg = await processPage(page, filter);
        const embedded = await pdf.embedJpg(jpg.bytes);
        const scale = A4_LONG_EDGE_PT / Math.max(jpg.width, jpg.height);
        const pw = jpg.width * scale;
        const ph = jpg.height * scale;
        const pdfPage = pdf.addPage([pw, ph]);
        pdfPage.drawImage(embedded, { x: 0, y: 0, width: pw, height: ph });
      }
      const bytes = await pdf.save();
      setResults([{ name: "scan.pdf", bytes }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept={tool.accept}
        multiple
        compact={pages.length > 0}
        onFiles={addFiles}
        label={pages.length > 0 ? "Add more photos" : "Choose photos or drop them here"}
        hint={pages.length > 0 ? undefined : "Your photos stay on this device. Nothing is uploaded."}
      />

      {pages.length > 0 ? (
        <>
          <Choice legend="How the pages should look" options={FILTERS} value={filter} onChange={setFilter} />

          <ol className="flex flex-col gap-4">
            {pages.map((page, index) => (
              <li key={page.id}>
                <PageCard
                  page={page}
                  index={index}
                  total={pages.length}
                  onCorners={(corners) => setCorners(page.id, corners)}
                  onUp={() => move(page.id, -1)}
                  onDown={() => move(page.id, 1)}
                  onRemove={() => remove(page.id)}
                />
              </li>
            ))}
          </ol>

          <div>
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy}
              className="ek-btn ek-btn-accent w-full sm:w-auto"
            >
              {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              {busy ? (progress ?? "Working…") : `Make a PDF of ${pages.length} ${pages.length === 1 ? "page" : "pages"}`}
            </button>
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="ek-card border-danger/40 bg-danger/5 p-3 text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      {results ? <ResultPanel files={results} onStartOver={startOver} /> : null}
    </div>
  );
}

/**
 * One photo with its corner overlay and its reorder and remove controls.
 *
 * The four corners are buttons, so they are reachable by tab and nudged with
 * the arrow keys, not only dragged. The quad between them is drawn in an SVG
 * that scales with the image, so the overlay lines up at any width.
 */
function PageCard({
  page,
  index,
  total,
  onCorners,
  onUp,
  onDown,
  onRemove,
}: {
  page: ScanPage;
  index: number;
  total: number;
  onCorners: (corners: Point[]) => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  const cornerName = ["top left", "top right", "bottom right", "bottom left"];

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const corner = dragging.current;
      const frame = frameRef.current;
      if (corner === null || !frame) return;
      const rect = frame.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      const next = page.corners.map((c, i) => (i === corner ? { x, y } : c));
      onCorners(next);
    },
    [page.corners, onCorners],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (dragging.current === null) return;
      event.preventDefault();
      updateFromPointer(event.clientX, event.clientY);
    };
    const onUpEvent = () => {
      dragging.current = null;
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUpEvent);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUpEvent);
    };
  }, [updateFromPointer]);

  function nudge(corner: number, dx: number, dy: number) {
    const next = page.corners.map((c, i) =>
      i === corner
        ? { x: Math.min(1, Math.max(0, c.x + dx)), y: Math.min(1, Math.max(0, c.y + dy)) }
        : c,
    );
    onCorners(next);
  }

  const poly = page.corners.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <div className="ek-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-text-light">Page {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUp}
            disabled={index === 0}
            aria-label={`Move page ${index + 1} up`}
            className="ek-btn ek-btn-quiet h-8 w-8 justify-center p-0 disabled:opacity-40"
          >
            <ArrowUp aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDown}
            disabled={index === total - 1}
            aria-label={`Move page ${index + 1} down`}
            className="ek-btn ek-btn-quiet h-8 w-8 justify-center p-0 disabled:opacity-40"
          >
            <ArrowDown aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove page ${index + 1}`}
            className="ek-btn ek-btn-quiet h-8 w-8 justify-center p-0"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={frameRef} className="relative mt-2 select-none overflow-hidden rounded-[10px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={page.url} alt={`Page ${index + 1}, ${page.name}`} className="block w-full" draggable={false} />

        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <polygon points={poly} fill="rgba(29,129,242,0.12)" stroke="#1d81f2" strokeWidth={0.006} />
        </svg>

        {page.corners.map((corner, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${cornerName[i]} corner of page ${index + 1}, arrow keys to move`}
            onPointerDown={(event) => {
              event.preventDefault();
              dragging.current = i;
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 0.05 : 0.01;
              if (event.key === "ArrowLeft") { event.preventDefault(); nudge(i, -step, 0); }
              else if (event.key === "ArrowRight") { event.preventDefault(); nudge(i, step, 0); }
              else if (event.key === "ArrowUp") { event.preventDefault(); nudge(i, 0, -step); }
              else if (event.key === "ArrowDown") { event.preventDefault(); nudge(i, 0, step); }
            }}
            style={{ left: `${corner.x * 100}%`, top: `${corner.y * 100}%` }}
            className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-white bg-primary shadow-card focus-visible:ring-2 focus-visible:ring-primary"
          />
        ))}
      </div>

      <p className="mt-2 text-[12px] text-text-light">
        Drag the four dots onto the corners of the page. Arrow keys nudge a selected corner.
      </p>
    </div>
  );
}

/** The processed JPEG for one page, plus its dimensions. */
async function processPage(page: ScanPage, filter: ScanFilter): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bitmap = await createImageBitmap(new Blob([page.bytes.slice()], { type: page.type }));
  const src = document.createElement("canvas");
  src.width = bitmap.width;
  src.height = bitmap.height;
  const sctx = src.getContext("2d");
  if (!sctx) throw new Error("This browser could not read that image.");
  sctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const srcData = sctx.getImageData(0, 0, src.width, src.height);

  const quad: Point[] = page.corners.map((c) => ({ x: c.x * src.width, y: c.y * src.height }));
  const size = estimateSize(quad);
  const warped = warpPerspective(
    { data: srcData.data, width: src.width, height: src.height },
    quad,
    size.width,
    size.height,
  );
  const filtered = applyFilter(warped, filter);

  const out = document.createElement("canvas");
  out.width = size.width;
  out.height = size.height;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("This browser could not draw the page.");
  const outData = octx.createImageData(size.width, size.height);
  outData.data.set(filtered.data);
  octx.putImageData(outData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("That page could not be saved.");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: size.width, height: size.height };
}

/** A radio group shaped like a row of cards. Mirrors the one in the Workbench. */
function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Array<{ value: T; label: string; detail: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[14px] font-semibold">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={[
              "flex cursor-pointer flex-col rounded-[12px] border px-3 py-2 transition-colors",
              value === option.value ? "border-primary bg-primary/5" : "border-line hover:border-line-strong",
            ].join(" ")}
          >
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <input
                type="radio"
                name={legend}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {option.label}
            </span>
            <span className="mt-0.5 pl-6 text-[12px] text-text-light">{option.detail}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
