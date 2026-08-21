"use client";

/**
 * Page thumbnails, drawn with pdf.js.
 *
 * pdf-lib can copy and rearrange pages but cannot draw them, so picking pages
 * by eye needs a second library. It is loaded on demand: only the tools that
 * show a page grid pay for it, and the landing page never does.
 */

const THUMBNAIL_WIDTH = 150;

/**
 * Where pdf.js finds its own support files.
 *
 * These are not optional. A page that uses one of the fourteen standard PDF
 * fonts - which is most PDFs written by anything other than a design tool -
 * makes pdf.js ask for the matching font data before it will draw, and a page
 * with CJK text asks for a character map. If those requests cannot be answered,
 * render() does not fail; it simply never finishes, and the thumbnails sit
 * blank forever with nothing in the console to explain it. That is exactly what
 * happened here.
 *
 * Both directories are copied out of the package into public/pdfjs, so they are
 * served from this origin like everything else. The alternative that every
 * pdf.js example reaches for is a CDN, which would put a third-party request on
 * a page whose entire promise is that it does not make one.
 */
const PDFJS_ASSETS = {
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  // pdf.js 6 decodes JBIG2 and JPEG 2000 images in WebAssembly, and reads
  // predefined ICC profiles for colour. Both are fetched at run time from
  // wherever these point, and pointing them nowhere means pdf.js goes looking
  // on its own. Vendored under public/ for the same reason the worker is: a
  // page whose whole promise is that it makes no network request cannot start
  // making one the first time somebody opens a scanned fax.
  wasmUrl: "/pdfjs/wasm/",
  iccUrl: "/pdfjs/iccs/",
  // A PDF can carry its own JavaScript, and pdf.js will run it. Nothing here
  // needs that: these documents are opened to be looked at and taken apart,
  // never to be filled in. GHSA-hq66-cqwq-w95j is the version of this that got
  // a number, and it is closed by the upgrade that came with this line, but
  // the option is what makes the intent true rather than incidental.
  enableScripting: false,
} as const;

/** Past this, rendering every page costs more than it helps. */
export const THUMBNAIL_LIMIT = 300;

export type Thumbnail = {
  /** Zero-based page index. */
  index: number;
  dataUrl: string;
  width: number;
  height: number;
  /** The rotation the page already carried, so the grid can show it upright. */
  rotation: number;
};

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

async function getPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      // Bundled and served from this origin. Pointing this at a CDN, as most
      // examples do, would mean a network request on a page whose whole promise
      // is that it does not make one.
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/**
 * Render up to `limit` pages, calling back as each one is ready.
 *
 * The callback matters: on a 200-page document, waiting for the whole set
 * before showing anything reads as a hang, whereas pages appearing one by one
 * reads as progress.
 */
export async function renderThumbnails(
  bytes: Uint8Array,
  onPage: (thumbnail: Thumbnail) => void,
  options: {
    limit?: number;
    signal?: AbortSignal;
    /** Fired as soon as the document opens, before any page is drawn. */
    onCount?: (total: number) => void;
  } = {},
): Promise<number> {
  const pdfjs = await getPdfJs();
  const limit = options.limit ?? THUMBNAIL_LIMIT;

  // pdf.js takes ownership of the buffer it is given, so it gets a copy and the
  // caller keeps a usable original for the actual operation.
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);

  // The loading task, not just its promise: pdf.js 6 moved destroy() off the
  // document and onto the task, and the worker stays up until it is called.
  const task = pdfjs.getDocument({ data: copy, ...PDFJS_ASSETS });
  const doc = await task.promise;

  try {
    const total = doc.numPages;
    // Reported before the loop, not after it. The grid is keyed off the page
    // count, so setting it at the end would mean the whole page-by-page
    // callback below paints nothing until the very last page is done - which
    // is the opposite of what it exists for.
    options.onCount?.(total);
    const count = Math.min(total, limit);

    for (let number = 1; number <= count; number++) {
      if (options.signal?.aborted) break;

      const page = await doc.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH / base.width });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      // Asked for only to find out whether this browser can draw at all. It is
      // deliberately not passed to render(): pdf.js 6 treats `canvas` and
      // `canvasContext` as alternatives rather than as a pair, and says the
      // canvas must be null if the context is the one being used. Handing it
      // both was the old call and is now outside what the library promises,
      // so this passes the canvas alone, which is the form it recommends.
      if (!canvas.getContext("2d")) continue;

      await page.render({ canvas, viewport }).promise;

      onPage({
        index: number - 1,
        dataUrl: canvas.toDataURL("image/jpeg", 0.7),
        width: canvas.width,
        height: canvas.height,
        rotation: page.rotate,
      });

      page.cleanup();
    }

    return total;
  } finally {
    await task.destroy();
  }
}

/** Page count alone, for tools that do not need pictures. */
export async function readPageCount(bytes: Uint8Array): Promise<number> {
  const pdfjs = await getPdfJs();
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const task = pdfjs.getDocument({ data: copy, ...PDFJS_ASSETS });
  try {
    const doc = await task.promise;
    return doc.numPages;
  } finally {
    await task.destroy();
  }
}
