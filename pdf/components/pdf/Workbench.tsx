"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dropzone } from "@/components/pdf/Dropzone";
import { FileList } from "@/components/pdf/FileList";
import { PageGrid, type PageItem } from "@/components/pdf/PageGrid";
import { ResultPanel, type ResultFile } from "@/components/pdf/ResultPanel";
import { getTool, type ToolSlug } from "@/data/tools";
import {
  baseName,
  checkLimits,
  describeChange,
  formatBytes,
  takeStashedFiles,
  type PickedFile,
} from "@/lib/pdf/files";
import { PAYMENTS_ENABLED } from "@/lib/payments";
import { parseSplitGroups } from "@/lib/pdf/pageRanges";
import { runOperation } from "@/lib/pdf/runner";
import { renderThumbnails, THUMBNAIL_LIMIT, type Thumbnail } from "@/lib/pdf/thumbnails";
import type { CompressLevel, ImageInput, PageSize } from "@/lib/pdf/operations";

/** Tools that show a page grid, and so need thumbnails rendered. */
const NEEDS_PAGES: ToolSlug[] = ["extract", "organize"];

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

export function Workbench({ slug }: { slug: ToolSlug }) {
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
      } catch {
        if (!controller.signal.aborted) {
          setError(
            "This file could not be opened. If it is password-protected, remove the password in your PDF reader first.",
          );
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
  }

  /** What is still missing before the button can do anything useful. */
  function readiness(): string | null {
    if (files.length === 0) return null;
    if (slug === "merge" && files.length < 2) return "Add at least one more file to merge.";
    if (slug === "extract" && selected.length === 0) return "Choose the pages you want.";
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
            {busy ? "Working…" : actionLabel()}
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
  slug: ToolSlug;
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
          className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary disabled:opacity-50"
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

  if (slug === "extract" && props.pageCount > 0) {
    const allSelected = props.selected.length === props.pageCount;
    return (
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[14px] font-semibold">Choose pages</p>
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
