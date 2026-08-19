/**
 * The worker that actually runs the operations.
 *
 * A 60 MB merge takes long enough that doing it on the main thread freezes the
 * tab - no scrolling, no cancel, and on mobile the browser may decide the page
 * has hung. Everything heavy happens here instead, and the page stays alive.
 *
 * Messages are plain objects; the byte arrays travel as transferables so a
 * large file is moved rather than copied.
 */

import {
  compressPdf,
  explodePdf,
  extractPages,
  imagesToPdf,
  mergePdfs,
  organisePages,
  splitPdf,
  type CompressLevel,
  type ImageInput,
  type PagePlan,
  type PageSize,
} from "./operations";

export type WorkerRequest =
  | { id: number; op: "merge"; files: ArrayBuffer[] }
  | { id: number; op: "extract"; file: ArrayBuffer; pages: number[] }
  | { id: number; op: "split"; file: ArrayBuffer; groups: number[][] }
  | { id: number; op: "explode"; file: ArrayBuffer }
  | { id: number; op: "organise"; file: ArrayBuffer; plan: PagePlan[] }
  | { id: number; op: "imagesToPdf"; images: ImageInput[]; size: PageSize }
  | { id: number; op: "compress"; file: ArrayBuffer; level: CompressLevel };

export type WorkerResponse =
  | { id: number; ok: true; files: ArrayBuffer[]; note?: string }
  | { id: number; ok: false; error: string };

async function run(
  request: WorkerRequest,
): Promise<{ files: Uint8Array[]; note?: string }> {
  switch (request.op) {
    case "merge":
      return { files: [await mergePdfs(request.files.map((b) => new Uint8Array(b)))] };
    case "extract":
      return { files: [await extractPages(new Uint8Array(request.file), request.pages)] };
    case "split":
      return { files: await splitPdf(new Uint8Array(request.file), request.groups) };
    case "explode":
      return { files: await explodePdf(new Uint8Array(request.file)) };
    case "organise":
      return { files: [await organisePages(new Uint8Array(request.file), request.plan)] };
    case "imagesToPdf":
      return { files: [await imagesToPdf(request.images, request.size)] };
    case "compress": {
      const result = await compressPdf(new Uint8Array(request.file), request.level);
      return { files: [result.bytes], note: result.note };
    }
  }
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    const { files, note } = await run(request);
    // Copy into exactly-sized buffers so the transfer list is unambiguous.
    const buffers = files.map((file) => {
      const copy = new Uint8Array(file.length);
      copy.set(file);
      return copy.buffer;
    });
    const response: WorkerResponse = { id: request.id, ok: true, files: buffers, note };
    (self as unknown as Worker).postMessage(response, buffers);
  } catch (error) {
    const response: WorkerResponse = {
      id: request.id,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong while working on that file.",
    };
    (self as unknown as Worker).postMessage(response);
  }
});
