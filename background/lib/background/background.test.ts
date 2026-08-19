import { describe, expect, it } from "vitest";
import { deflateSync } from "zlib";
import { hasAlphaChannel, inspectAlpha, isPng, readHeader } from "./png";
import {
  compositeOver,
  describeMode,
  hexToRgb,
  needsAlpha,
  normaliseHex,
  outputFilename,
  PRESETS,
} from "./output";

// ---------------------------------------------------------------------------
// A real PNG, built here, so the reader is tested against actual encoded bytes
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
 * An RGBA PNG whose alpha is decided per pixel by `alphaAt`, written with a
 * mix of row filters so the reader's filter handling is exercised rather than
 * only its happy path.
 */
function makeRgbaPng(
  width: number,
  height: number,
  alphaAt: (x: number, y: number) => number,
): Uint8Array {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    // Cycle through None, Sub and Up so the decoder has to undo each.
    const filter = y % 3 === 0 ? 0 : y % 3 === 1 ? 1 : 2;
    raw[rowStart] = filter;
    for (let x = 0; x < width; x++) {
      const at = rowStart + 1 + x * 4;
      const r = 200, g = 80, b = 60, a = alphaAt(x, y);
      if (filter === 0) {
        raw[at] = r; raw[at + 1] = g; raw[at + 2] = b; raw[at + 3] = a;
      } else if (filter === 1) {
        // Sub: difference from the pixel to the left.
        const pr = x > 0 ? 200 : 0, pg = x > 0 ? 80 : 0, pb = x > 0 ? 60 : 0;
        const pa = x > 0 ? alphaAt(x - 1, y) : 0;
        raw[at] = (r - pr) & 0xff; raw[at + 1] = (g - pg) & 0xff;
        raw[at + 2] = (b - pb) & 0xff; raw[at + 3] = (a - pa) & 0xff;
      } else {
        // Up: difference from the pixel above.
        const pa = y > 0 ? alphaAt(x, y - 1) : 0;
        const pr = y > 0 ? 200 : 0, pg = y > 0 ? 80 : 0, pb = y > 0 ? 60 : 0;
        raw[at] = (r - pr) & 0xff; raw[at + 1] = (g - pg) & 0xff;
        raw[at + 2] = (b - pb) & 0xff; raw[at + 3] = (a - pa) & 0xff;
      }
    }
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // truecolour with alpha
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const parts = [
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", new Uint8Array(deflateSync(Buffer.from(raw)))),
    chunk("IEND", new Uint8Array(0)),
  ];
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const png = new Uint8Array(size);
  let at = 0;
  for (const part of parts) { png.set(part, at); at += part.length; }
  return png;
}

/** An opaque truecolour PNG, colour type 2, with no alpha channel at all. */
function makeOpaquePng(width = 4, height = 4): Uint8Array {
  const stride = width * 3;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const at = row + 1 + x * 3;
      raw[at] = 200; raw[at + 1] = 80; raw[at + 2] = 60;
    }
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8; ihdr[9] = 2;
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

// ---------------------------------------------------------------------------

describe("reading a PNG's transparency", () => {
  it("recognises a PNG, and refuses what is not one", () => {
    expect(isPng(makeOpaquePng())).toBe(true);
    expect(isPng(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(false);
    expect(() => readHeader(Uint8Array.from([0xff, 0xd8]))).toThrow(/not a PNG/);
  });

  it("reads the header", () => {
    const header = readHeader(makeRgbaPng(8, 5, () => 255));
    expect(header).toMatchObject({ width: 8, height: 5, bitDepth: 8, colourType: 6 });
  });

  it("tells an alpha channel from none", () => {
    expect(hasAlphaChannel(makeRgbaPng(4, 4, () => 255))).toBe(true);
    expect(hasAlphaChannel(makeOpaquePng())).toBe(false);
  });

  it("is not fooled by a file that merely has an alpha channel", () => {
    // The failure this catches: a canvas encodes an untouched photo as RGBA
    // PNG, so the channel is present and every pixel is opaque. Shipping that
    // as a "transparent background" hands someone a solid rectangle.
    const report = inspectAlpha(makeRgbaPng(20, 20, () => 255));
    expect(report.channel).toBe(true);
    expect(report.transparent).toBe(0);
    expect(report.transparentFraction).toBe(0);
  });

  it("counts genuinely transparent pixels, through every row filter", () => {
    // Left half cut away, right half kept.
    const report = inspectAlpha(makeRgbaPng(20, 21, (x) => (x < 10 ? 0 : 255)));
    expect(report.pixels).toBe(20 * 21);
    expect(report.transparent).toBe(10 * 21);
    expect(report.transparentFraction).toBeCloseTo(0.5, 6);
  });

  it("counts partial alpha, which is what a soft edge looks like", () => {
    // A hard cutout has no partial pixels and hair looks scissored. Feathering
    // shows up here, so the number is worth reporting rather than collapsing
    // into a boolean.
    const report = inspectAlpha(
      makeRgbaPng(30, 30, (x) => (x < 10 ? 0 : x < 20 ? 128 : 255)),
    );
    expect(report.transparent).toBe(10 * 30);
    expect(report.partial).toBe(10 * 30);
  });

  it("reports nothing rather than guessing on a format it cannot decode", () => {
    const report = inspectAlpha(makeOpaquePng());
    expect(report).toMatchObject({ channel: false, transparent: 0 });
  });
});

describe("output modes", () => {
  it("accepts the hex shapes people type", () => {
    expect(normaliseHex("#FF8A4C")).toBe("#ff8a4c");
    expect(normaliseHex("ff8a4c")).toBe("#ff8a4c");
    expect(normaliseHex("  #FFF ")).toBe("#ffffff");
    expect(normaliseHex("abc")).toBe("#aabbcc");
  });

  it("refuses what is not a colour rather than guessing", () => {
    for (const bad of ["", "#", "12345", "#gggggg", "rgb(1,2,3)", "#1234567"]) {
      expect(normaliseHex(bad)).toBeNull();
    }
  });

  it("converts to channels", () => {
    expect(hexToRgb("#ff8a4c")).toEqual({ r: 255, g: 138, b: 76 });
    expect(hexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("nope")).toBeNull();
  });

  it("every preset is a valid colour", () => {
    for (const preset of PRESETS) {
      expect(normaliseHex(preset.hex)).toBe(preset.hex);
    }
  });

  it("composites straight alpha, not premultiplied", () => {
    // Premultiplying by mistake darkens every soft edge, which on hair reads
    // as a grey halo, so the half-transparent case is the one that matters.
    const white = { r: 255, g: 255, b: 255 };
    expect(compositeOver({ r: 0, g: 0, b: 0, a: 255 }, white)).toEqual({ r: 0, g: 0, b: 0 });
    expect(compositeOver({ r: 0, g: 0, b: 0, a: 0 }, white)).toEqual(white);
    expect(compositeOver({ r: 0, g: 0, b: 0, a: 128 }, white)).toEqual({
      r: 127, g: 127, b: 127,
    });
  });

  it("only the transparent mode needs an alpha channel", () => {
    expect(needsAlpha({ kind: "transparent" })).toBe(true);
    expect(needsAlpha({ kind: "colour", hex: "#ffffff" })).toBe(false);
  });

  it("names the file so it says what it is", () => {
    expect(outputFilename("selfie.jpg", { kind: "transparent" })).toBe("selfie-no-background.png");
    expect(outputFilename("selfie.jpg", { kind: "colour", hex: "#ffffff" })).toBe(
      "selfie-background.png",
    );
    expect(outputFilename("noextension", { kind: "transparent" })).toBe(
      "noextension-no-background.png",
    );
  });

  it("describes the mode in words", () => {
    expect(describeMode({ kind: "transparent" })).toBe("Transparent background");
    expect(describeMode({ kind: "colour", hex: "#ffffff" })).toBe("White background");
    expect(describeMode({ kind: "colour", hex: "#123456" })).toBe("Background #123456");
  });
});
