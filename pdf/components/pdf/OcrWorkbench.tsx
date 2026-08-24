"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { Dropzone } from "@/components/pdf/Dropzone";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { getTool } from "@/data/tools";
import { hasGivenEmail } from "@/lib/emailCapture";
import { takeStashedFiles, type PickedFile } from "@/lib/pdf/files";
import { OCR_LANGS, recognize, type OcrLang, type OcrProgress } from "@/lib/ocr/ocr";
import { readPdfPageCount, renderPdfPageToCanvas } from "@/lib/ocr/pdfPage";
import { revealResult } from "@/lib/revealResult";

export function OcrWorkbench() {
  const tool = getTool("ocr")!;
  const [file, setFile] = useState<PickedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [lang, setLang] = useState<OcrLang>("eng");

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [gateOpen, setGateOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback((incoming: PickedFile[]) => {
    const picked = incoming[0];
    if (!picked) return;
    setError(null);
    setText(null);
    setPageNumber(1);
    setFile(picked);
    const pdf = picked.type === "application/pdf";
    setIsPdf(pdf);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return pdf ? null : URL.createObjectURL(new Blob([picked.bytes.slice()], { type: picked.type }));
    });
    if (pdf) {
      void readPdfPageCount(picked.bytes)
        .then((count) => setPageCount(count))
        .catch(() => setPageCount(0));
    } else {
      setPageCount(0);
    }
  }, []);

  useEffect(() => {
    const stashed = takeStashedFiles();
    if (stashed.length > 0) addFiles(stashed);
  }, [addFiles]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (text !== null && resultRef.current) revealResult(resultRef.current);
  }, [text]);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setText(null);
    setProgress({ status: "Getting ready", progress: 0 });
    try {
      const image = isPdf
        ? await renderPdfPageToCanvas(file.bytes, pageNumber)
        : await toCanvas(file);
      const out = await recognize(image, lang, (p) => setProgress(p));
      setText(out);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That could not be read.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function doCopy() {
    if (text === null) return;
    void navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  /** The gated take-path: ask once a session, then copy. */
  function take() {
    if (hasGivenEmail()) {
      doCopy();
      return;
    }
    setGateOpen(true);
  }

  function startOver() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setText(null);
    setError(null);
    setIsPdf(false);
    setPageCount(0);
  }

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept={tool.accept}
        multiple={false}
        compact={file !== null}
        onFiles={addFiles}
        label={file ? "Choose a different file" : "Choose an image or PDF, or drop it here"}
        hint={file ? undefined : "Your file stays on this device. Nothing is uploaded."}
      />

      {file ? (
        <>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="The image to read"
              className="max-h-[320px] w-auto rounded-[10px] border border-line"
            />
          ) : null}

          <fieldset>
            <legend className="text-[14px] font-semibold">Language</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCR_LANGS.map((option) => (
                <label
                  key={option.id}
                  className={[
                    "flex cursor-pointer items-center gap-2 rounded-[12px] border px-3 py-2 text-[14px]",
                    lang === option.id ? "border-primary bg-primary/5 font-semibold" : "border-line",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="ocr-lang"
                    checked={lang === option.id}
                    onChange={() => setLang(option.id)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {isPdf && pageCount > 0 ? (
            <div>
              <label htmlFor="ocr-page" className="block text-[14px] font-semibold">
                Which page, of {pageCount}
              </label>
              <input
                id="ocr-page"
                type="number"
                min={1}
                max={pageCount}
                value={pageNumber}
                onChange={(event) => {
                  const n = Number.parseInt(event.target.value, 10);
                  setPageNumber(Number.isFinite(n) ? Math.min(Math.max(1, n), pageCount) : 1);
                }}
                className="mt-1 w-28 rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy}
              className="ek-btn ek-btn-accent w-full sm:w-auto"
            >
              {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              {busy
                ? progress
                  ? `${progress.status}… ${Math.round(progress.progress * 100)}%`
                  : "Working…"
                : "Read the text"}
            </button>
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="ek-card border-danger/40 bg-danger/5 p-3 text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      {text !== null ? (
        <div ref={resultRef} className="ek-card p-4 sm:p-5">
          <h2 className="text-[18px] font-semibold">
            {text === "" ? "No text found" : "The text it read"}
          </h2>
          <p className="mt-1 text-[13px] text-text-light">
            {text === ""
              ? "No readable text was found on that page. A clearer or more upright photo often helps."
              : "Check it against the original before you rely on it. Recognition is good on clean print and weaker on faint or unusual text."}
          </p>

          {text !== "" ? (
            <>
              <textarea
                readOnly
                value={text}
                dir={lang === "urd" ? "rtl" : "ltr"}
                className="mt-3 h-56 w-full resize-y rounded-[10px] border border-line bg-background p-3 text-[14px] outline-none focus:border-primary"
              />
              <button type="button" onClick={take} className="ek-btn ek-btn-accent mt-3">
                {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                {copied ? "Copied" : "Copy the text"}
              </button>
            </>
          ) : null}

          <button type="button" onClick={startOver} className="ek-btn ek-btn-quiet mt-4">
            Start over
          </button>

          <MoreFromEveryKit />
        </div>
      ) : null}

      {gateOpen ? (
        <EmailGate
          actionLabel="Copy the text"
          onDone={() => {
            doCopy();
            setGateOpen(false);
          }}
          onCancel={() => setGateOpen(false)}
        />
      ) : null}
    </div>
  );
}

/** Draw an image file onto a canvas for the recogniser. */
async function toCanvas(file: PickedFile): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(new Blob([file.bytes.slice()], { type: file.type }));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not read that image.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}
