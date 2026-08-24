"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dropzone } from "@/components/pdf/Dropzone";
import { FileList } from "@/components/pdf/FileList";
import { PageGrid, type PageItem } from "@/components/pdf/PageGrid";
import { ResultPanel, type ResultFile } from "@/components/pdf/ResultPanel";
import { getTool, type PdfToolSlug } from "@/data/tools";
import {
  baseName,
  checkLimits,
  describeChange,
  formatBytes,
  takeStashedFiles,
  type PickedFile,
} from "@/lib/pdf/files";
import { PAYMENTS_ENABLED } from "@/lib/payments";
import { PDF_OPEN_ERROR } from "@/lib/pdf/guard";
import { renderPdfToImages, IMAGE_PAGE_LIMIT, type PageImageFormat } from "@/lib/pdf/pagesToImages";
import { parseSplitGroups } from "@/lib/pdf/pageRanges";
import { zipNamedFiles } from "@/lib/pdf/zip";
import { runOperation } from "@/lib/pdf/runner";
import { renderThumbnails, THUMBNAIL_LIMIT, type Thumbnail } from "@/lib/pdf/thumbnails";
import type {
  CompressLevel,
  ImageInput,
  NumberPosition,
  PageSize,
  WatermarkPlacement,
} from "@/lib/pdf/operations";

/** Tools that show a page grid, and so need thumbnails rendered. */
// Tools that ask the user to point at pages, and so need the pictures drawn.
const NEEDS_PAGES: PdfToolSlug[] = ["extract", "organize", "delete-pages"];

const NUMBER_POSITIONS: Array<{ value: NumberPosition; label: string; detail: string }> = [
  { value: "bottom-centre", label: "Bottom centre", detail: "The usual place" },
  { value: "bottom-right", label: "Bottom right", detail: "Common in reports" },
  { value: "bottom-left", label: "Bottom left", detail: "Facing pages" },
  { value: "top-right", label: "Top right", detail: "Letters and memos" },
  { value: "top-centre", label: "Top centre", detail: "Headers" },
  { value: "top-left", label: "Top left", detail: "Rare, but here" },
];

const WATERMARK_PLACEMENTS: Array<{ value: WatermarkPlacement; label: string; detail: string }> = [
  { value: "diagonal", label: "Across the page", detail: "Corner to corner" },
  { value: "centre", label: "In the middle", detail: "Level, over the text" },
  { value: "bottom-right", label: "Bottom corner", detail: "Out of the way" },
];

/**
 * The styling every text and number field in here shares.
 *
 * Lifted out of the range input rather than invented: this kit has no field
 * class in globals.css, and a second hand-written copy of the same twelve
 * utilities is how two inputs end up looking subtly different.
 */
const FIELD_CLASS =
  "w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary disabled:opacity-50";

/**
 * Read a number field without letting it go empty or out of range.
 *
 * A bare `Number(event.target.value)` gives NaN the moment somebody clears the
 * box to type a new figure, and NaN reaches pdf-lib as a page index. The
 * fallback is what the field goes back to while it is empty.
 */
function clampNumber(raw: string, min: number, max: number, fallback: number): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

const IMAGE_FORMATS: Array<{ value: PageImageFormat; label: string; detail: string }> = [
  { value: "jpg", label: "JPG", detail: "Smaller, best for scans" },
  { value: "png", label: "PNG", detail: "Sharper on text and line art" },
];

const COMPRESS_LEVELS: Array<{ value: CompressLevel; label: string; detail: string }> = [
  { value: "light", label: "Keep it sharp", detail: "Pictures capped at 2200 px" },
  { value: "email", label: "Good for email", detail: "Pictures capped at 1600 px" },
  { value: "smallest", label: "Smallest", detail: "Pictures capped at 1000 px, visibly softer" },
];

const PAGE_SIZES: Array<{ value: PageSize; label: string; detail: string }> = [
  { value: "a4", label: "A4", detail: "210 x 297 mm" },
  { value: "letter", label: "US Letter", detail: "8.5 x 11 in" },
  { value: "fit", label: "Fit each image", detail: "No borders" },
];

export function Workbench({ slug }: { slug: PdfToolSlug }) {
  const tool = getTool(slug)!;

  const [files, setFiles] = useState<PickedFile[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<Map<number, Thumbnail>>(new Map());
  const [pageItems, setPageItems] = useState<PageItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  const [rangeText, setRangeText] = useState("");
  const [everyPage, setEveryPage] = useState(false);
  const [imageSize, setImageSize] = useState<PageSize>("a4");
  const [compressLevel, setCompressLevel] = useState<CompressLevel>("email");

  const [numberPosition, setNumberPosition] = useState<NumberPosition>("bottom-centre");
  const [numberStartAt, setNumberStartAt] = useState(1);
  const [numberSkip, setNumberSkip] = useState(0);
  const [numberShowTotal, setNumberShowTotal] = useState(false);

  const [markText, setMarkText] = useState("DRAFT");
  const [markPlacement, setMarkPlacement] = useState<WatermarkPlacement>("diagonal");
  const [markOpacity, setMarkOpacity] = useState(15);

  const [imageFormat, setImageFormat] = useState<PageImageFormat>("jpg");
  /** "Drawing page 12 of 40", so a long export does not look like a hang. */
  const [progress, setProgress] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[] | null>(null);
  const [note, setNote] = useState<string | undefined>(undefined);

  const thumbnailRun = useRef<AbortController | null>(null);

  const addFiles = useCallback(
    (incoming: PickedFile[]) => {
      setError(null);
      setResults(null);
      setFiles((current) => (tool.multiple ? [...current, ...incoming] : incoming.slice(0, 1)));
    },
    [tool.multiple],
  );

  // Files dropped on the landing page arrive here on the first render.
  useEffect(() => {
    const stashed = takeStashedFiles();
    if (stashed.length > 0) addFiles(stashed);
  }, [addFiles]);

  // Read the pages of a single PDF once one is chosen.
  useEffect(() => {
    thumbnailRun.current?.abort();
    setThumbnails(new Map());
    setPageCount(0);
    setPageItems([]);
    setSelected([]);

    if (tool.multiple || files.length === 0 || tool.accept !== "application/pdf") return;

    const controller = new AbortController();
    thumbnailRun.current = controller;
    const bytes = files[0].bytes;

    void (async () => {
      try {
        if (NEEDS_PAGES.includes(slug)) {
          await renderThumbnails(
            bytes,
            (thumbnail) => {
              if (controller.signal.aborted) return;
              // A fresh Map each time so React sees the change. The grid is at
              // most a few hundred entries, so the copy is cheap enough.
              setThumbnails((current) => new Map(current).set(thumbnail.index, thumbnail));
            },
            {
              signal: controller.signal,
              onCount: (total) => {
                if (controller.signal.aborted) return;
                // The grid appears immediately, with pictures filling in. A
                // page that has not been drawn yet still shows its number and
                // can still be chosen.
                setPageCount(total);
                setPageItems(
                  Array.from({ length: total }, (_, index) => ({ from: index, rotate: 0 })),
                );
              },
            },
          );
        } else {
          const { readPageCount } = await import("@/lib/pdf/thumbnails");
          const total = await readPageCount(bytes);
          if (controller.signal.aborted) return;
          setPageCount(total);
        }
      } catch (caught) {
        if (!controller.signal.aborted) {
          // The guard has already collapsed anything pdf.js threw into a
          // sentence written for a person, so use it rather than writing a
          // second one here that could drift away from it.
          setError(caught instanceof Error ? caught.message : PDF_OPEN_ERROR);
        }
      }
    })();

    return () => controller.abort();
  }, [files, slug, tool.multiple, tool.accept]);

  const limits = checkLimits(files);

  async function run() {
    setBusy(true);
    setError(null);
    setNote(undefined);
    setProgress(null);

    const stem = baseName(files[0]?.name ?? "document");

    try {
      switch (slug) {
        case "merge": {
          const { files: out } = await runOperation({
            op: "merge",
            files: files.map((file) => copyBuffer(file.bytes)),
          });
          setResults([{ name: `${stem}-merged.pdf`, bytes: out[0] }]);
          break;
        }

        case "extract": {
          if (selected.length === 0) throw new Error("Choose at least one page first.");
          const { files: out } = await runOperation({
            op: "extract",
            file: copyBuffer(files[0].bytes),
            pages: selected,
          });
          setResults([{ name: `${stem}-pages.pdf`, bytes: out[0] }]);
          break;
        }

        case "split": {
          if (everyPage) {
            const { files: out } = await runOperation({
              op: "explode",
              file: copyBuffer(files[0].bytes),
            });
            setResults(
              out.map((bytes, index) => ({ name: `${stem}-page-${index + 1}.pdf`, bytes })),
            );
            break;
          }
          const parsed = parseSplitGroups(rangeText, pageCount);
          if (!parsed.ok) throw new Error(parsed.error);
          const { files: out } = await runOperation({
            op: "split",
            file: copyBuffer(files[0].bytes),
            groups: parsed.groups,
          });
          setResults(out.map((bytes, index) => ({ name: `${stem}-part-${index + 1}.pdf`, bytes })));
          break;
        }

        case "organize": {
          if (pageItems.length === 0) throw new Error("There are no pages left to save.");
          const { files: out } = await runOperation({
            op: "organise",
            file: copyBuffer(files[0].bytes),
            plan: pageItems,
          });
          setResults([{ name: `${stem}-organised.pdf`, bytes: out[0] }]);
          break;
        }

        case "images-to-pdf": {
          const images: ImageInput[] = [];
          for (const file of files) images.push(await toEmbeddable(file));
          const { files: out } = await runOperation({
            op: "imagesToPdf",
            images,
            size: imageSize,
          });
          setResults([{ name: `${stem}.pdf`, bytes: out[0] }]);
          break;
        }

        case "delete-pages": {
          const { files: out } = await runOperation({
            op: "deletePages",
            file: copyBuffer(files[0].bytes),
            pages: selected,
          });
          setResults([{ name: `${stem}-trimmed.pdf`, bytes: out[0] }]);
          break;
        }

        case "page-numbers": {
          const { files: out } = await runOperation({
            op: "pageNumbers",
            file: copyBuffer(files[0].bytes),
            options: {
              position: numberPosition,
              startAt: numberStartAt,
              skipBefore: numberSkip,
              showTotal: numberShowTotal,
              fontSize: 11,
            },
          });
          setResults([{ name: `${stem}-numbered.pdf`, bytes: out[0] }]);
          break;
        }

        case "watermark": {
          const { files: out } = await runOperation({
            op: "watermark",
            file: copyBuffer(files[0].bytes),
            options: {
              text: markText,
              placement: markPlacement,
              opacity: markOpacity / 100,
              fontSize: markPlacement === "diagonal" ? 60 : 24,
            },
          });
          setResults([{ name: `${stem}-marked.pdf`, bytes: out[0] }]);
          break;
        }

        case "pdf-to-images": {
          // The only tool that cannot use the worker: drawing a page needs a
          // canvas, and a worker has no DOM. It runs here instead, reporting
          // progress so a forty-page document does not look stuck.
          const images = await renderPdfToImages(files[0].bytes, imageFormat, {
            onProgress: (done, total) => setProgress(`Drawing page ${done} of ${total}`),
          });
          setResults([
            {
              name: `${stem}-images.zip`,
              bytes: zipNamedFiles(images),
              mime: "application/zip",
            },
          ]);
          setNote(
            `${images.length} ${images.length === 1 ? "page" : "pages"}, as ${imageFormat.toUpperCase()}, in one zip.`,
          );
          break;
        }

        case "compress": {
          const before = files[0].bytes.length;
          const { files: out, note: workerNote } = await runOperation({
            op: "compress",
            file: copyBuffer(files[0].bytes),
            level: compressLevel,
          });
          const after = out[0].length;
          setNote(
            [
              `${formatBytes(before)} before, ${formatBytes(after)} after, ${describeChange(before, after)}.`,
              workerNote,
            ]
              .filter(Boolean)
              .join(" "),
          );
          setResults([{ name: `${stem}-smaller.pdf`, bytes: out[0] }]);
          break;
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setFiles([]);
    setResults(null);
    setError(null);
    setNote(undefined);
    setRangeText("");
    setEveryPage(false);
    setProgress(null);
  }

  /** What is still missing before the button can do anything useful. */
  function readiness(): string | null {
    if (files.length === 0) return null;
    if (slug === "merge" && files.length < 2) return "Add at least one more file to merge.";
    if (slug === "extract" && selected.length === 0) return "Choose the pages you want.";
    if (slug === "delete-pages") {
      if (selected.length === 0) return "Choose the pages you want removed.";
      if (pageCount > 0 && selected.length === pageCount) {
        return "That is every page. Leave at least one.";
      }
    }
    if (slug === "watermark" && markText.trim() === "") return "Type the words to draw.";
    if (slug === "page-numbers" && pageCount > 0 && numberSkip >= pageCount) {
      return "That skips every page. Lower the number to skip.";
    }
    if (slug === "pdf-to-images" && pageCount > IMAGE_PAGE_LIMIT) {
      return `This file has ${pageCount} pages, and ${IMAGE_PAGE_LIMIT} is the most that fits in a browser's memory at once.`;
    }
    if (slug === "split" && !everyPage && rangeText.trim() === "") {
      return "Type the ranges you want, or split every page.";
    }
    return null;
  }

  const ready = readiness();

  function actionLabel(): string {
    switch (slug) {
      case "merge":
        return `Merge ${files.length} files`;
      case "extract":
        return selected.length > 0 ? `Take ${selected.length} pages` : "Take the chosen pages";
      case "split":
        return everyPage ? "Split every page" : "Split it";
      case "organize":
        return "Save the new order";
      case "images-to-pdf":
        return files.length === 1 ? "Make the PDF" : `Make a PDF from ${files.length} images`;
      case "delete-pages":
        return selected.length > 0
          ? `Remove ${selected.length} ${selected.length === 1 ? "page" : "pages"}`
          : "Remove the chosen pages";
      case "page-numbers":
        return "Add the numbers";
      case "watermark":
        return "Draw it on every page";
      case "pdf-to-images":
        return imageFormat === "png" ? "Make PNGs" : "Make JPGs";
      case "compress":
        return "Make it smaller";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept={tool.accept}
        multiple={tool.multiple}
        compact={files.length > 0}
        onFiles={addFiles}
        label={
          files.length > 0
            ? tool.multiple
              ? "Add more files"
              : "Choose a different file"
            : tool.multiple
              ? "Choose files or drop them here"
              : "Choose a file or drop it here"
        }
        hint={files.length > 0 ? undefined : "Your file stays on this device. Nothing is uploaded."}
      />

      {files.length > 0 ? (
        <FileList files={files} onChange={setFiles} reorderable={tool.multiple} />
      ) : null}

      {files.length > 0 && pageCount > 0 && !NEEDS_PAGES.includes(slug) ? (
        <p className="text-[13px] text-text-light">
          {pageCount} {pageCount === 1 ? "page" : "pages"}.
        </p>
      ) : null}

      {files.length > 0 ? (
        <ToolControls
          slug={slug}
          pageCount={pageCount}
          thumbnails={thumbnails}
          selected={selected}
          onSelectedChange={setSelected}
          pageItems={pageItems}
          onPageItemsChange={setPageItems}
          rangeText={rangeText}
          onRangeTextChange={setRangeText}
          everyPage={everyPage}
          onEveryPageChange={setEveryPage}
          imageSize={imageSize}
          onImageSizeChange={setImageSize}
          compressLevel={compressLevel}
          onCompressLevelChange={setCompressLevel}
          numberPosition={numberPosition}
          onNumberPositionChange={setNumberPosition}
          numberStartAt={numberStartAt}
          onNumberStartAtChange={setNumberStartAt}
          numberSkip={numberSkip}
          onNumberSkipChange={setNumberSkip}
          numberShowTotal={numberShowTotal}
          onNumberShowTotalChange={setNumberShowTotal}
          markText={markText}
          onMarkTextChange={setMarkText}
          markPlacement={markPlacement}
          onMarkPlacementChange={setMarkPlacement}
          markOpacity={markOpacity}
          onMarkOpacityChange={setMarkOpacity}
          imageFormat={imageFormat}
          onImageFormatChange={setImageFormat}
        />
      ) : null}

      {files.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || ready !== null}
            className="ek-btn ek-btn-accent w-full sm:w-auto"
          >
            {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            {busy ? (progress ?? "Working…") : actionLabel()}
          </button>
          {ready ? <p className="mt-2 text-[13px] text-text-light">{ready}</p> : null}
          {limits.overLimit && PAYMENTS_ENABLED ? (
            <p className="mt-2 text-[13px] text-text-light">{limits.reason}</p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="ek-card border-danger/40 bg-danger/5 p-3 text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      {results ? (
        <ResultPanel
          files={results}
          note={note}
          lockedReason={limits.reason}
          onStartOver={startOver}
        />
      ) : null}
    </div>
  );
}

type ControlProps = {
  slug: PdfToolSlug;
  pageCount: number;
  thumbnails: Map<number, Thumbnail>;
  selected: number[];
  onSelectedChange: (pages: number[]) => void;
  pageItems: PageItem[];
  onPageItemsChange: (items: PageItem[]) => void;
  rangeText: string;
  onRangeTextChange: (value: string) => void;
  everyPage: boolean;
  onEveryPageChange: (value: boolean) => void;
  imageSize: PageSize;
  onImageSizeChange: (value: PageSize) => void;
  compressLevel: CompressLevel;
  onCompressLevelChange: (value: CompressLevel) => void;
  numberPosition: NumberPosition;
  onNumberPositionChange: (value: NumberPosition) => void;
  numberStartAt: number;
  onNumberStartAtChange: (value: number) => void;
  numberSkip: number;
  onNumberSkipChange: (value: number) => void;
  numberShowTotal: boolean;
  onNumberShowTotalChange: (value: boolean) => void;
  markText: string;
  onMarkTextChange: (value: string) => void;
  markPlacement: WatermarkPlacement;
  onMarkPlacementChange: (value: WatermarkPlacement) => void;
  markOpacity: number;
  onMarkOpacityChange: (value: number) => void;
  imageFormat: PageImageFormat;
  onImageFormatChange: (value: PageImageFormat) => void;
};

/**
 * The part of the screen that differs between tools.
 *
 * Kept as its own component rather than a closure inside the workbench: a
 * function declared in the render body is a new component type on every render,
 * which throws away the DOM underneath it and takes focus out of the range
 * field on every keystroke.
 */
function ToolControls(props: ControlProps) {
  const { slug } = props;

  if (slug === "images-to-pdf") {
    return (
      <Choice
        legend="Page size"
        options={PAGE_SIZES}
        value={props.imageSize}
        onChange={props.onImageSizeChange}
      />
    );
  }

  if (slug === "pdf-to-images") {
    return (
      <Choice
        legend="Which format"
        options={IMAGE_FORMATS}
        value={props.imageFormat}
        onChange={props.onImageFormatChange}
      />
    );
  }

  if (slug === "page-numbers") {
    return (
      <div className="flex flex-col gap-4">
        <Choice
          legend="Where the number goes"
          options={NUMBER_POSITIONS}
          value={props.numberPosition}
          onChange={props.onNumberPositionChange}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="start-at" className="block text-[14px] font-semibold">
              Start counting at
            </label>
            <input
              id="start-at"
              type="number"
              min={0}
              max={9999}
              value={props.numberStartAt}
              onChange={(event) =>
                props.onNumberStartAtChange(clampNumber(event.target.value, 0, 9999, 1))
              }
              className={`mt-1 ${FIELD_CLASS}`}
            />
          </div>
          <div>
            <label htmlFor="skip" className="block text-[14px] font-semibold">
              Leave this many pages bare
            </label>
            <input
              id="skip"
              type="number"
              min={0}
              max={Math.max(0, props.pageCount - 1)}
              value={props.numberSkip}
              onChange={(event) =>
                props.onNumberSkipChange(
                  clampNumber(event.target.value, 0, Math.max(0, props.pageCount - 1), 0),
                )
              }
              className={`mt-1 ${FIELD_CLASS}`}
            />
            <p className="mt-1 text-[13px] text-text-light">
              For a cover page that should stay clean.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={props.numberShowTotal}
            onChange={(event) => props.onNumberShowTotalChange(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Show the total as well, like 7 of 24
        </label>
      </div>
    );
  }

  if (slug === "watermark") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="mark-text" className="block text-[14px] font-semibold">
            What it should say
          </label>
          <input
            id="mark-text"
            type="text"
            maxLength={60}
            value={props.markText}
            onChange={(event) => props.onMarkTextChange(event.target.value)}
            className={`mt-1 ${FIELD_CLASS}`}
            placeholder="DRAFT"
          />
        </div>
        <Choice
          legend="Where it sits"
          options={WATERMARK_PLACEMENTS}
          value={props.markPlacement}
          onChange={props.onMarkPlacementChange}
        />
        <div>
          <label htmlFor="opacity" className="block text-[14px] font-semibold">
            How strong, {props.markOpacity}%
          </label>
          <input
            id="opacity"
            type="range"
            min={2}
            max={100}
            step={1}
            value={props.markOpacity}
            onChange={(event) => props.onMarkOpacityChange(Number(event.target.value))}
            className="mt-2 w-full accent-[var(--color-primary)]"
          />
          <p className="mt-1 text-[13px] text-text-light">
            Faint enough to read the page through, dark enough to notice. Around 15% suits a mark
            drawn across text.
          </p>
        </div>
      </div>
    );
  }

  if (slug === "compress") {
    return (
      <div>
        <Choice
          legend="How hard to squeeze"
          options={COMPRESS_LEVELS}
          value={props.compressLevel}
          onChange={props.onCompressLevelChange}
        />
        <p className="mt-2 text-[13px] text-text-light">
          Only the pictures inside the file are re-encoded. Text stays selectable, and a document
          with no pictures in it will barely change size.
        </p>
      </div>
    );
  }

  if (slug === "split") {
    return (
      <div>
        <label htmlFor="ranges" className="block text-[14px] font-semibold">
          Which pages go in each file
        </label>
        <input
          id="ranges"
          type="text"
          value={props.rangeText}
          disabled={props.everyPage}
          onChange={(event) => props.onRangeTextChange(event.target.value)}
          placeholder="1-3, 4-6"
          className={`mt-2 ${FIELD_CLASS}`}
        />
        <p className="mt-1 text-[13px] text-text-light">
          One group per file, separated by commas.
          {props.pageCount > 0 ? ` This file has ${props.pageCount} pages.` : ""}
        </p>
        <label className="mt-3 flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={props.everyPage}
            onChange={(event) => props.onEveryPageChange(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Split every page into its own file
        </label>
      </div>
    );
  }

  if ((slug === "extract" || slug === "delete-pages") && props.pageCount > 0) {
    const removing = slug === "delete-pages";
    const allSelected = props.selected.length === props.pageCount;
    return (
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[14px] font-semibold">
            {removing ? "Choose the pages to remove" : "Choose pages"}
          </p>
          <button
            type="button"
            onClick={() =>
              props.onSelectedChange(
                allSelected ? [] : Array.from({ length: props.pageCount }, (_, i) => i),
              )
            }
            className="ek-link text-[13px]"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        {props.pageCount > THUMBNAIL_LIMIT ? (
          <p className="mt-1 text-[13px] text-text-light">
            Showing pictures for the first {THUMBNAIL_LIMIT} of {props.pageCount} pages.
          </p>
        ) : null}
        <PageGrid
          mode="select"
          thumbnails={props.thumbnails}
          pageCount={props.pageCount}
          selected={props.selected}
          onSelectedChange={props.onSelectedChange}
        />
      </div>
    );
  }

  if (slug === "organize" && props.pageItems.length > 0) {
    return (
      <div>
        <p className="text-[14px] font-semibold">
          {props.pageItems.length} {props.pageItems.length === 1 ? "page" : "pages"}
        </p>
        <PageGrid
          mode="organise"
          thumbnails={props.thumbnails}
          pageCount={props.pageCount}
          items={props.pageItems}
          onItemsChange={props.onPageItemsChange}
        />
      </div>
    );
  }

  return null;
}

/** A radio group that looks like a row of cards but behaves like a radio group. */
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
              value === option.value
                ? "border-primary bg-primary/5"
                : "border-line hover:border-line-strong",
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

/** The worker gets its own buffer, so the picked file stays usable for a re-run. */
function copyBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

/**
 * PDF can embed JPEG and PNG directly but has no idea what WebP is, so a WebP
 * is decoded and re-encoded as PNG first — lossless, and the only way in.
 */
async function toEmbeddable(file: PickedFile): Promise<ImageInput> {
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return { bytes: file.bytes, type: file.type };
  }

  const copy = new Uint8Array(file.bytes.length);
  copy.set(file.bytes);
  const bitmap = await createImageBitmap(new Blob([copy], { type: file.type }));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not read that image.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("That image could not be converted.");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: "image/png" };
}
