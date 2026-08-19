"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileUp, Trash2 } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { hasGivenEmail } from "@/lib/emailCapture";
import { renderThumbnails, type Thumbnail } from "@/lib/sign/thumbnails";
import { pageSizes, signPdf, type Placement } from "@/lib/sign/signPdf";
import { defaultBox, previewBoxToPdf, pdfBoxToPreview } from "@/lib/sign/place";

const PREVIEW_WIDTH = 520;

/**
 * How long to wait for page pictures before carrying on without them. Signing
 * needs page sizes, not pictures, so this is a preview budget rather than a
 * hard requirement.
 */
const THUMBNAIL_TIMEOUT_MS = 8000;

type Loaded = {
  file: File;
  bytes: Uint8Array;
  sizes: Array<{ width: number; height: number }>;
  thumbnails: Thumbnail[];
};

export function SignPdf({ signature }: { signature: Blob | null }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [page, setPage] = useState(0);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [previewUnavailable, setPreviewUnavailable] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    if (!signature) {
      setSignatureUrl(null);
      return;
    }
    const url = URL.createObjectURL(signature);
    setSignatureUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [signature]);

  async function onFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      // Page sizes come from pdf-lib and are all the placement maths needs.
      const sizes = await pageSizes(bytes);
      setLoaded({ file, bytes, sizes, thumbnails: [] });
      setPage(0);
      setPlacements([]);

      /*
       * Thumbnails are a preview, not a dependency.
       *
       * They are drawn by pdf.js, which renders through the browser's frame
       * loop, so a page that is not visible produces no frames and the render
       * never settles. A background tab does the same thing. Waiting on them
       * before letting anyone sign would mean a document that cannot be signed
       * at all because its picture did not arrive, which is the wrong trade:
       * the signature only needs page sizes.
       *
       * So they load in the background and fill in when they arrive, with a
       * cap after which the tool carries on with plain page outlines and says
       * so rather than sitting on a spinner.
       */
      const collected: Thumbnail[] = [];
      const withTimeout = Promise.race([
        renderThumbnails(bytes, (thumbnail) => {
          collected[thumbnail.index] = thumbnail;
          setLoaded((current) =>
            current && current.file === file
              ? { ...current, thumbnails: collected.filter(Boolean) }
              : current,
          );
        }),
        new Promise((resolve) => setTimeout(resolve, THUMBNAIL_TIMEOUT_MS)),
      ]);
      void withTimeout.then(() => {
        setPreviewUnavailable(collected.filter(Boolean).length === 0);
      });
    } catch {
      setError(
        "That PDF could not be opened. If it needs a password, remove that in your reader first.",
      );
    } finally {
      setBusy(false);
    }
  }

  const currentSize = loaded?.sizes[page];
  const previewHeight = currentSize
    ? Math.round((PREVIEW_WIDTH * currentSize.height) / currentSize.width)
    : 0;

  const addPlacement = useCallback(() => {
    if (!currentSize) return;
    setPlacements((current) => [...current, { page, box: defaultBox(currentSize) }]);
  }, [currentSize, page]);

  const onPointerDown = (event: React.PointerEvent, index: number) => {
    if (!currentSize) return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    const preview = pdfBoxToPreview(
      placements[index].box,
      { width: PREVIEW_WIDTH, height: previewHeight },
      currentSize,
    );
    const rect = stageRef.current!.getBoundingClientRect();
    dragRef.current = {
      id: index,
      offsetX: event.clientX - rect.left - preview.x,
      offsetY: event.clientY - rect.top - preview.y,
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !currentSize) return;
    const rect = stageRef.current!.getBoundingClientRect();
    setPlacements((current) =>
      current.map((placement, index) => {
        if (index !== drag.id) return placement;
        const preview = pdfBoxToPreview(
          placement.box,
          { width: PREVIEW_WIDTH, height: previewHeight },
          currentSize,
        );
        const next = {
          ...preview,
          x: event.clientX - rect.left - drag.offsetX,
          y: event.clientY - rect.top - drag.offsetY,
        };
        return {
          ...placement,
          box: previewBoxToPdf(next, { width: PREVIEW_WIDTH, height: previewHeight }, currentSize),
        };
      }),
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  function resize(index: number, factor: number) {
    setPlacements((current) =>
      current.map((placement, at) => {
        if (at !== index) return placement;
        const width = Math.max(24, placement.box.width * factor);
        const height = width * (placement.box.height / placement.box.width);
        return { ...placement, box: { ...placement.box, width, height } };
      }),
    );
  }

  function take(action: () => void) {
    if (hasGivenEmail()) {
      action();
      return;
    }
    setGateFor(() => action);
  }

  async function save() {
    if (!loaded || !signature) return;
    setBusy(true);
    setError(null);
    try {
      const png = new Uint8Array(await signature.arrayBuffer());
      const out = await signPdf(loaded.bytes.slice(), png, placements);
      const blob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stem = loaded.file.name.replace(/\.pdf$/i, "");
      link.href = url;
      link.download = `${stem}-signed.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That PDF could not be signed.");
    } finally {
      setBusy(false);
    }
  }

  const onThisPage = placements
    .map((placement, index) => ({ placement, index }))
    .filter((entry) => entry.placement.page === page);

  return (
    <div className="flex flex-col gap-6">
      {!loaded ? (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) void onFile(file);
          }}
          className="ek-card flex flex-col items-center gap-3 border-dashed p-8 text-center"
        >
          <FileUp aria-hidden="true" className="h-8 w-8 text-text-light" />
          <p className="text-[16px]">Drop a PDF here, or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ek-btn ek-btn-accent"
            disabled={busy}
          >
            {busy ? "Opening" : "Choose a PDF"}
          </button>
          <input
            ref={inputRef}
            type="file"
            aria-label="Choose a PDF from your device"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
              event.target.value = "";
            }}
          />
          <p className="text-[13px] text-text-light">
            The document stays on your device. Nothing is uploaded.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      {loaded ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-text-light">
              {loaded.file.name}, {loaded.sizes.length}{" "}
              {loaded.sizes.length === 1 ? "page" : "pages"}
            </p>
            <button
              type="button"
              onClick={() => {
                setLoaded(null);
                setPlacements([]);
              }}
              className="ek-btn ek-btn-quiet py-2 text-[14px]"
            >
              Use a different PDF
            </button>
          </div>

          {previewUnavailable && loaded.sizes.length > 1 ? (
            <div>
              <p className="text-[14px] font-semibold">Page</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {loaded.sizes.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPage(index)}
                    aria-current={index === page ? "true" : undefined}
                    className={[
                      "inline-flex min-h-[36px] items-center rounded-full border px-4 py-2 text-[14px] transition-colors",
                      index === page
                        ? "border-primary-dark bg-primary-dark text-white"
                        : "border-line text-text-light hover:border-line-strong",
                    ].join(" ")}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {loaded.thumbnails.length > 1 ? (
            <div>
              <p className="text-[14px] font-semibold">Page</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                {loaded.thumbnails.map((thumbnail) => (
                  <button
                    key={thumbnail.index}
                    type="button"
                    onClick={() => setPage(thumbnail.index)}
                    aria-current={thumbnail.index === page ? "true" : undefined}
                    aria-label={`Page ${thumbnail.index + 1}`}
                    className={[
                      "shrink-0 overflow-hidden rounded-[8px] border-2 transition-colors",
                      thumbnail.index === page ? "border-primary-dark" : "border-line",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnail.dataUrl} alt="" width={72} className="block" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!signature ? (
            <p className="ek-card bg-bg-soft p-4 text-[14px] text-text-light">
              Draw or type a signature above first, then it appears here to place.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={addPlacement} className="ek-btn ek-btn-quiet py-2 text-[14px]">
                Place the signature on this page
              </button>
              <p className="text-[13px] text-text-light">
                Drag it where it goes. Place it as often as you need.
              </p>
            </div>
          )}

          {previewUnavailable ? (
            <p className="ek-card bg-bg-soft p-3 text-[13px] text-text-light">
              The page pictures could not be drawn for this document, so the page is shown as
              an outline. Placing and signing still work: the position is measured against the
              real page size, not against the picture.
            </p>
          ) : null}

          <div
            ref={stageRef}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            className="relative mx-auto overflow-hidden rounded-[var(--radius-card)] border border-line bg-white"
            style={{ width: PREVIEW_WIDTH, height: previewHeight, maxWidth: "100%", touchAction: "none" }}
          >
            {loaded.thumbnails[page] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={loaded.thumbnails[page].dataUrl}
                alt={`Page ${page + 1}`}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-bg-soft">
                <p className="text-[14px] text-text-light">
                  Page {page + 1} of {loaded.sizes.length}
                </p>
              </div>
            )}
            {onThisPage.map(({ placement, index }) => {
              if (!currentSize || !signatureUrl) return null;
              const preview = pdfBoxToPreview(
                placement.box,
                { width: PREVIEW_WIDTH, height: previewHeight },
                currentSize,
              );
              return (
                <div
                  key={index}
                  onPointerDown={(event) => onPointerDown(event, index)}
                  className="absolute cursor-move rounded-[4px] border-2 border-dashed border-primary-dark"
                  style={{
                    left: preview.x,
                    top: preview.y,
                    width: preview.width,
                    height: preview.height,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatureUrl}
                    alt="Your signature"
                    draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              );
            })}
          </div>

          {onThisPage.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {onThisPage.map(({ index }, order) => (
                <li
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-[10px] bg-bg-soft px-3 py-2"
                >
                  <span className="text-[14px]">Signature {order + 1}</span>
                  <button
                    type="button"
                    onClick={() => resize(index, 1 / 1.15)}
                    aria-label={`Make signature ${order + 1} smaller`}
                    className="ek-btn ek-btn-quiet px-3 py-1 text-[14px]"
                  >
                    Smaller
                  </button>
                  <button
                    type="button"
                    onClick={() => resize(index, 1.15)}
                    aria-label={`Make signature ${order + 1} bigger`}
                    className="ek-btn ek-btn-quiet px-3 py-1 text-[14px]"
                  >
                    Bigger
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacements((c) => c.filter((_, at) => at !== index))}
                    aria-label={`Remove signature ${order + 1}`}
                    className="ek-btn ek-btn-quiet px-3 py-1 text-[14px]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <button
              type="button"
              onClick={() => take(() => void save())}
              disabled={placements.length === 0 || !signature || busy}
              className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              {busy ? "Working" : "Download the signed PDF"}
            </button>
            <p className="mt-2 max-w-[60ch] text-[13px] text-text-light">
              The signature is flattened into the page, so it cannot be dragged off or deleted
              in a reader, and it prints.
            </p>
          </div>

          {gateFor ? (
            <EmailGate
              actionLabel="Download"
              onDone={() => {
                gateFor();
                setGateFor(null);
              }}
              onCancel={() => setGateFor(null)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
