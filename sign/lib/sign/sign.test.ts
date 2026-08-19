import { describe, expect, it } from "vitest";
import { PDFDict, PDFDocument, PDFName, PDFRawStream, rgb } from "pdf-lib";
import { deflateSync } from "zlib";
import {
  inkHex,
  isEmpty,
  strokeBounds,
  strokesToSvg,
  strokeToPath,
  thin,
  type Stroke,
} from "./strokes";
import {
  clampToPage,
  defaultBox,
  fitInside,
  pdfBoxToPreview,
  previewBoxToPdf,
} from "./place";
import { pageCount, pageSizes, signPdf } from "./signPdf";

// ---------------------------------------------------------------------------
// Fixtures
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

/** An RGBA PNG with a transparent border and an opaque middle. */
function signaturePng(width = 40, height = 20): Uint8Array {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const at = row + 1 + x * 4;
      const inside = x > 4 && x < width - 4 && y > 4 && y < height - 4;
      raw[at] = 20; raw[at + 1] = 20; raw[at + 2] = 20;
      raw[at + 3] = inside ? 255 : 0;
    }
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8; ihdr[9] = 6;
  const parts = [
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", new Uint8Array(deflateSync(Buffer.from(raw)))),
    chunk("IEND", new Uint8Array(0)),
  ];
  const size = parts.reduce((s, p) => s + p.length, 0);
  const png = new Uint8Array(size);
  let at = 0;
  for (const part of parts) { png.set(part, at); at += part.length; }
  return png;
}

async function makePdf(pages: number, size: [number, number] = [595, 842]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage(size);
    page.drawRectangle({ x: 10, y: 10, width: 40, height: 40, color: rgb(0.9, 0.9, 0.9) });
  }
  return doc.save();
}

// ---------------------------------------------------------------------------
// Strokes
// ---------------------------------------------------------------------------

describe("stroke smoothing", () => {
  it("drops points too close together to matter", () => {
    const dense: Stroke = [
      { x: 0, y: 0 }, { x: 0.2, y: 0 }, { x: 0.4, y: 0 }, { x: 10, y: 0 },
    ];
    // A pointer fires far faster than a hand moves, so a slow stroke arrives as
    // a cluster. Keeping them makes the smoothing wobble.
    expect(thin(dense).length).toBeLessThan(dense.length);
    // The ends are always kept, so the stroke does not get shorter.
    expect(thin(dense)[0]).toEqual({ x: 0, y: 0 });
    expect(thin(dense).at(-1)).toEqual({ x: 10, y: 0 });
  });

  it("keeps short strokes intact", () => {
    const two: Stroke = [{ x: 0, y: 0 }, { x: 5, y: 5 }];
    expect(thin(two)).toEqual(two);
  });

  it("draws a dot for a single tap", () => {
    expect(strokeToPath([{ x: 3, y: 4 }])).toBe("M3 4l0 0");
  });

  it("draws a straight line for two points", () => {
    expect(strokeToPath([{ x: 0, y: 0 }, { x: 10, y: 5 }])).toBe("M0 0L10 5");
  });

  it("uses quadratic curves through the middle of a longer stroke", () => {
    const path = strokeToPath([
      { x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }, { x: 30, y: 10 },
    ]);
    expect(path.startsWith("M0 0")).toBe(true);
    expect(path).toContain("Q");
    // Joining samples with straight lines shows every sample as a corner.
    expect(path).not.toContain("L10 10");
  });

  it("rounds coordinates, so the path does not carry meaningless precision", () => {
    const path = strokeToPath([{ x: 1.23456, y: 2.34567 }]);
    expect(path).toBe("M1.23 2.35l0 0");
  });
});

describe("bounds", () => {
  it("includes the pen width, so the ink is not clipped", () => {
    // The line is centred on the path, so half of it hangs outside the points.
    const bounds = strokeBounds([[{ x: 10, y: 10 }, { x: 20, y: 20 }]], 4);
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeLessThan(10);
    expect(bounds!.y).toBeLessThan(10);
    expect(bounds!.width).toBeGreaterThan(10);
  });

  it("returns nothing for no ink", () => {
    expect(strokeBounds([], 3)).toBeNull();
    expect(strokeBounds([[]], 3)).toBeNull();
    expect(isEmpty([[], []])).toBe(true);
    expect(isEmpty([[{ x: 1, y: 1 }]])).toBe(false);
  });
});

describe("SVG output", () => {
  const strokes: Stroke[] = [
    [{ x: 100, y: 100 }, { x: 130, y: 80 }, { x: 160, y: 120 }],
    [{ x: 170, y: 90 }, { x: 200, y: 110 }],
  ];

  it("produces an SVG cropped to the ink, not to the canvas", () => {
    const svg = strokesToSvg(strokes, { colour: "#171717", lineWidth: 3 });
    expect(svg.startsWith("<svg")).toBe(true);
    const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    expect(match).not.toBeNull();
    // The ink spans 100 across and 40 down, so the box is about that, not the
    // full drawing surface.
    expect(Number(match![1])).toBeLessThan(140);
    expect(Number(match![2])).toBeLessThan(80);
  });

  it("strokes rather than fills, with round caps", () => {
    const svg = strokesToSvg(strokes, { colour: "#1b3a8f", lineWidth: 3 });
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#1b3a8f"');
    expect(svg).toContain('stroke-linecap="round"');
  });

  it("carries one path per stroke, so a pen lift is a real gap", () => {
    const svg = strokesToSvg(strokes, { colour: "#171717", lineWidth: 3 });
    expect(svg.match(/<path /g)?.length).toBe(2);
  });

  it("gives nothing for nothing", () => {
    expect(strokesToSvg([], { colour: "#171717", lineWidth: 3 })).toBe("");
  });

  it("knows its ink colours", () => {
    expect(inkHex("black")).toBe("#171717");
    expect(inkHex("blue")).toBe("#1b3a8f");
  });
});

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

describe("placing a box on a page", () => {
  const page = { width: 595, height: 842 };
  const preview = { width: 300, height: 424 };

  it("flips the y axis, because PDF measures upward from the bottom", () => {
    // The bug this prevents: a box near the top of the preview must get a LARGE
    // y in PDF space. Without the flip every signature lands mirrored.
    const top = previewBoxToPdf({ x: 0, y: 0, width: 100, height: 50 }, preview, page);
    expect(top.y).toBeGreaterThan(page.height * 0.8);

    const bottom = previewBoxToPdf(
      { x: 0, y: preview.height - 50, width: 100, height: 50 },
      preview,
      page,
    );
    expect(bottom.y).toBeLessThan(page.height * 0.2);
  });

  it("scales lengths from the preview to the page", () => {
    const box = previewBoxToPdf({ x: 30, y: 40, width: 60, height: 20 }, preview, page);
    expect(box.width).toBeCloseTo(60 * (595 / 300), 5);
    expect(box.x).toBeCloseTo(30 * (595 / 300), 5);
  });

  it("round-trips back to the preview it came from", () => {
    const original = { x: 42, y: 77, width: 88, height: 33 };
    const back = pdfBoxToPreview(previewBoxToPdf(original, preview, page), preview, page);
    expect(back.x).toBeCloseTo(original.x, 5);
    expect(back.y).toBeCloseTo(original.y, 5);
    expect(back.width).toBeCloseTo(original.width, 5);
    expect(back.height).toBeCloseTo(original.height, 5);
  });

  it("keeps a box inside the page without resizing it", () => {
    const off = clampToPage({ x: -50, y: -30, width: 100, height: 40 }, page);
    expect(off.x).toBe(0);
    expect(off.y).toBe(0);
    expect(off.width).toBe(100);

    const past = clampToPage({ x: 900, y: 900, width: 100, height: 40 }, page);
    expect(past.x + past.width).toBeLessThanOrEqual(page.width);
    expect(past.y + past.height).toBeLessThanOrEqual(page.height);
  });

  it("fits the signature inside the box without distorting the handwriting", () => {
    const fitted = fitInside({ width: 200, height: 50 }, { x: 0, y: 0, width: 100, height: 100 });
    expect(fitted.width / fitted.height).toBeCloseTo(4, 5);
    expect(fitted.width).toBeLessThanOrEqual(100);
    // Centred in the leftover space.
    expect(fitted.y).toBeCloseTo((100 - fitted.height) / 2, 5);
  });

  it("starts somewhere sensible", () => {
    const box = defaultBox(page);
    expect(box.x).toBeGreaterThan(0);
    expect(box.y).toBeGreaterThan(0);
    expect(box.x + box.width).toBeLessThan(page.width);
  });
});

// ---------------------------------------------------------------------------
// The signed file
// ---------------------------------------------------------------------------

/**
 * Every image XObject on a page.
 *
 * Entries in the XObject dictionary are indirect references, so they have to be
 * looked up through the document context before the stream and its dictionary
 * are readable. Reading the entry values directly finds refs, not images.
 */
async function imagesOnPage(bytes: Uint8Array, index: number) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const page = doc.getPages()[index];
  const xobjects = page.node.Resources()?.lookup(PDFName.of("XObject"), PDFDict);
  if (!xobjects) return [];

  const found: Array<{ width: number; height: number }> = [];
  for (const key of xobjects.keys()) {
    const stream = xobjects.lookup(key);
    const dict = stream instanceof PDFRawStream ? stream.dict : null;
    if (!dict) continue;
    if (dict.get(PDFName.of("Subtype"))?.toString() !== "/Image") continue;
    found.push({
      width: Number(dict.get(PDFName.of("Width"))?.toString()),
      height: Number(dict.get(PDFName.of("Height"))?.toString()),
    });
  }
  return found;
}

describe("signing a PDF", () => {
  it("keeps every page and produces a file a strict parser reopens", async () => {
    const pdf = await makePdf(3);
    const signed = await signPdf(pdf, signaturePng(), [
      { page: 1, box: { x: 100, y: 100, width: 200, height: 100 } },
    ]);

    expect(String.fromCharCode(...signed.slice(0, 5))).toBe("%PDF-");
    expect(await pageCount(signed)).toBe(3);
    // Reloading through pdf-lib is the parse check: a malformed file throws.
    const sizes = await pageSizes(signed);
    expect(sizes).toHaveLength(3);
    expect(sizes[0]).toEqual({ width: 595, height: 842 });
  });

  it("puts the signature on the page it was placed on, and no other", async () => {
    const pdf = await makePdf(3);
    const signed = await signPdf(pdf, signaturePng(), [
      { page: 1, box: { x: 100, y: 100, width: 200, height: 100 } },
    ]);

    expect(await imagesOnPage(signed, 0)).toHaveLength(0);
    expect(await imagesOnPage(signed, 1)).toHaveLength(1);
    expect(await imagesOnPage(signed, 2)).toHaveLength(0);
  });

  it("allows the same signature in several places", async () => {
    const pdf = await makePdf(2);
    const signed = await signPdf(pdf, signaturePng(), [
      { page: 0, box: { x: 50, y: 50, width: 150, height: 75 } },
      { page: 0, box: { x: 300, y: 500, width: 150, height: 75 } },
      { page: 1, box: { x: 100, y: 100, width: 150, height: 75 } },
    ]);
    expect(await pageCount(signed)).toBe(2);
    expect((await imagesOnPage(signed, 0)).length).toBeGreaterThanOrEqual(1);
    expect((await imagesOnPage(signed, 1)).length).toBeGreaterThanOrEqual(1);
  });

  it("embeds the image once however many times it is placed", async () => {
    const pdf = await makePdf(1);
    const once = await signPdf(pdf, signaturePng(80, 40), [
      { page: 0, box: { x: 50, y: 50, width: 150, height: 75 } },
    ]);
    const fiveTimes = await signPdf(pdf, signaturePng(80, 40), [
      { page: 0, box: { x: 20, y: 20, width: 100, height: 50 } },
      { page: 0, box: { x: 140, y: 20, width: 100, height: 50 } },
      { page: 0, box: { x: 260, y: 20, width: 100, height: 50 } },
      { page: 0, box: { x: 20, y: 200, width: 100, height: 50 } },
      { page: 0, box: { x: 140, y: 200, width: 100, height: 50 } },
    ]);
    // Five copies of the PNG would grow the file by roughly five times the
    // image. One embed plus four draw calls barely moves it.
    expect(fiveTimes.length).toBeLessThan(once.length * 1.5);
  });

  it("keeps the signature inside the page even when placed off the edge", async () => {
    const pdf = await makePdf(1, [400, 400]);
    const signed = await signPdf(pdf, signaturePng(), [
      { page: 0, box: { x: 380, y: 380, width: 200, height: 100 } },
    ]);
    expect(await pageCount(signed)).toBe(1);
    expect(await imagesOnPage(signed, 0)).toHaveLength(1);
  });

  it("refuses to produce a file when nothing was placed", async () => {
    const pdf = await makePdf(1);
    await expect(signPdf(pdf, signaturePng(), [])).rejects.toThrow(/Place the signature/);
  });

  it("ignores a placement on a page that does not exist", async () => {
    const pdf = await makePdf(1);
    const signed = await signPdf(pdf, signaturePng(), [
      { page: 0, box: { x: 10, y: 10, width: 50, height: 25 } },
      { page: 9, box: { x: 10, y: 10, width: 50, height: 25 } },
    ]);
    expect(await pageCount(signed)).toBe(1);
  });
});
