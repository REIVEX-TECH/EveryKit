/**
 * Fixture PDFs built in code rather than checked in as binaries.
 *
 * Every page carries a unique height, which is how a test proves the page that
 * came out is the page that was asked for. A merge or an extract that returns
 * the right page *count* in the wrong *order* is the bug worth catching, and a
 * count alone would miss it.
 *
 * Identifying pages by geometry rather than by reading their text is
 * deliberate: page size is part of pdf-lib's public surface, whereas pulling
 * strings back out of a content stream means walking arrays of indirect
 * references and guessing at filters, which breaks the moment the library
 * changes how it writes them. The fixture should not be the fragile part.
 */

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { deflateSync, inflateSync } from "zlib";

export type Marked = { bytes: Uint8Array; labels: string[] };

const BASE_WIDTH = 300;

/** Each document gets its own band of heights so two documents never collide. */
function bandFor(prefix: string): number {
  return (prefix.toUpperCase().charCodeAt(0) - 65) * 100 + 200;
}

function heightFor(prefix: string, page: number): number {
  return bandFor(prefix) + page * 10;
}

/** Turn a page height back into the label it stands for, such as "A2". */
function labelForHeight(height: number): string {
  const band = Math.floor((height - 200) / 100) * 100 + 200;
  const page = Math.round((height - band) / 10);
  const prefix = String.fromCharCode(65 + (band - 200) / 100);
  return `${prefix}${page}`;
}

/**
 * A document whose pages are identifiable by height, and also stamped with
 * their label so the file is readable if anyone opens one while debugging.
 */
export async function makeMarkedPdf(
  prefix: string,
  pages: number,
  options: { rotate?: number } = {},
): Promise<Marked> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const labels: string[] = [];

  for (let i = 1; i <= pages; i++) {
    const label = `${prefix}${i}`;
    labels.push(label);
    const page = doc.addPage([BASE_WIDTH, heightFor(prefix, i)]);
    page.drawText(label, { x: 40, y: 100, size: 48, font, color: rgb(0, 0, 0) });
    if (options.rotate) page.setRotation(degrees(options.rotate));
  }

  return { bytes: await doc.save(), labels };
}

/** The label of each page, in document order. */
export async function readPageLabels(bytes: Uint8Array): Promise<string[]> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPages().map((page) => labelForHeight(Math.round(page.getSize().height)));
}

// ---------------------------------------------------------------------------
// A real PNG, so the image tests need no image library
// ---------------------------------------------------------------------------

function crc32(bytes: Uint8Array): number {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    crc32.table = table;
  }
  let c = 0xffffffff;
  for (const byte of bytes) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
crc32.table = undefined as Uint32Array | undefined;

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = Uint8Array.from([...type].map((c) => c.charCodeAt(0)));
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);

  const out = new Uint8Array(8 + data.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(body, 4);
  view.setUint32(4 + body.length, crc32(body));
  return out;
}

/**
 * An opaque RGB PNG of the given size, correctly deflated and checksummed.
 *
 * The first attempt at this was a byte array written out by hand, and pdf-lib
 * rejected it — an invalid IDAT is not something to guess at.
 */
export function makePng(width = 2, height = 2): Uint8Array {
  const stride = width * 3;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const p = row + 1 + x * 3;
      raw[p] = 220;
      raw[p + 1] = 80;
      raw[p + 2] = 60;
    }
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const parts = [
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", new Uint8Array(deflateSync(Buffer.from(raw)))),
    chunk("IEND", new Uint8Array(0)),
  ];

  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

export function tinyPng(): Uint8Array {
  return makePng(2, 2);
}

/**
 * The text a stamping operation drew, pulled back out of the page.
 *
 * The header of this file warns against reading text out of a content stream,
 * and that warning still stands for text somebody else's tool wrote. This is
 * narrower: it reads back only what page numbering and watermarking put there
 * themselves, with a standard font and no escaping, which is the one case
 * where the content stream is predictable.
 *
 * Without it the tests can prove a stamp made the file bigger but not that it
 * says the right thing, and "5 of 4" is exactly the bug that hides in that gap.
 */
export async function readStampedText(bytes: Uint8Array): Promise<string[]> {
  const { PDFDocument, PDFRawStream, PDFArray } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const found: string[] = [];

  for (const page of doc.getPages()) {
    const contents = page.node.Contents();
    if (!contents) continue;
    const refs = contents instanceof PDFArray ? contents.asArray() : [contents];

    for (const ref of refs) {
      const stream = doc.context.lookup(ref);
      if (!(stream instanceof PDFRawStream)) continue;

      const raw = Buffer.from(stream.getContents());
      const filter = String(stream.dict.get(stream.dict.context.obj("Filter")) ?? "");
      const body = (filter.includes("FlateDecode") ? inflateSync(raw) : raw).toString("latin1");

      // pdf-lib writes a drawText call as a hex string, `<31206F66> Tj`, not as
      // the literal `(1 of) Tj` that most examples show. Both forms are read
      // here so this does not quietly return nothing if that ever changes.
      for (const match of body.matchAll(/<([0-9A-Fa-f\s]*)>\s*Tj/g)) {
        const hex = match[1].replace(/\s+/g, "");
        let text = "";
        for (let i = 0; i + 1 < hex.length; i += 2) {
          text += String.fromCharCode(Number.parseInt(hex.slice(i, i + 2), 16));
        }
        found.push(text);
      }
      for (const match of body.matchAll(/\(([^)]*)\)\s*Tj/g)) {
        found.push(match[1]);
      }
    }
  }

  return found;
}
