import { describe, expect, it } from "vitest";
import {
  crc32,
  dpiToPixelsPerMetre,
  isJpeg,
  isPng,
  readJpegDpi,
  readPngDpi,
  setJpegDpi,
  setPngDpi,
} from "./dpiWriter";

function u32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function chunk(type: string, data: number[]): number[] {
  const typeBytes = [...type].map((c) => c.charCodeAt(0));
  const crc = crc32(new Uint8Array([...typeBytes, ...data]));
  return [...u32(data.length), ...typeBytes, ...data, ...u32(crc)];
}

/** A structurally valid PNG. The pixel data is nonsense, which does not matter here. */
function makePng(extra: number[] = []): Uint8Array {
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk("IHDR", [...u32(600), ...u32(600), 8, 6, 0, 0, 0]),
    ...extra,
    ...chunk("IDAT", [0x78, 0x9c, 0x01, 0x00]),
    ...chunk("IEND", []),
  ]);
}

function makeJpegWithApp0(): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    // APP0 as a canvas encoder writes it: units 0, density 1 x 1.
    0xff, 0xe0, 0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x01,
    0x00,
    0x00, 0x01, 0x00, 0x01,
    0x00, 0x00,
    // A stand-in for the scan data.
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0xff, 0xd9,
  ]);
}

function makeJpegWithoutApp0(): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xdb, 0x00, 0x05, 0x00, 0x01, 0x02,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0xff, 0xd9,
  ]);
}

describe("format detection", () => {
  it("recognises PNG and JPEG signatures", () => {
    expect(isPng(makePng())).toBe(true);
    expect(isJpeg(makePng())).toBe(false);
    expect(isJpeg(makeJpegWithApp0())).toBe(true);
    expect(isPng(makeJpegWithApp0())).toBe(false);
  });
});

describe("dpiToPixelsPerMetre", () => {
  it("converts 300 DPI to the value image viewers expect", () => {
    expect(dpiToPixelsPerMetre(300)).toBe(11811);
    expect(dpiToPixelsPerMetre(600)).toBe(23622);
    expect(dpiToPixelsPerMetre(72)).toBe(2835);
  });
});

describe("setPngDpi", () => {
  it("writes a pHYs chunk that reads back at the same DPI", () => {
    const out = setPngDpi(makePng(), 300);
    expect(readPngDpi(out)).toBe(300);
  });

  it("reports nothing before the chunk is written", () => {
    expect(readPngDpi(makePng())).toBeNull();
  });

  it("puts pHYs after IHDR and before IDAT, as the format requires", () => {
    const out = setPngDpi(makePng(), 300);
    const text = Buffer.from(out).toString("latin1");
    expect(text.indexOf("IHDR")).toBeLessThan(text.indexOf("pHYs"));
    expect(text.indexOf("pHYs")).toBeLessThan(text.indexOf("IDAT"));
  });

  it("replaces an existing pHYs instead of adding a second one", () => {
    const withPhys = setPngDpi(makePng(), 72);
    const out = setPngDpi(withPhys, 600);
    const text = Buffer.from(out).toString("latin1");
    expect(text.split("pHYs").length - 1).toBe(1);
    expect(readPngDpi(out)).toBe(600);
    expect(out.length).toBe(withPhys.length);
  });

  it("keeps every other chunk intact", () => {
    const original = makePng();
    const out = setPngDpi(original, 300);
    expect(out.length).toBe(original.length + 21);
    const text = Buffer.from(out).toString("latin1");
    expect(text).toContain("IHDR");
    expect(text).toContain("IDAT");
    // IEND stays last: 4 type bytes then its 4 CRC bytes.
    expect(Buffer.from(out.subarray(out.length - 8, out.length - 4)).toString()).toBe("IEND");
  });

  it("refuses a file that is not a PNG", () => {
    expect(() => setPngDpi(makeJpegWithApp0(), 300)).toThrow(/Not a PNG/);
  });
});

describe("setJpegDpi", () => {
  it("patches an existing APP0 without changing the file length", () => {
    const original = makeJpegWithApp0();
    expect(readJpegDpi(original)).toBeNull(); // units 0 means no physical size
    const out = setJpegDpi(original, 300);
    expect(out.length).toBe(original.length);
    expect(readJpegDpi(out)).toBe(300);
  });

  it("inserts an APP0 when the encoder wrote none", () => {
    const original = makeJpegWithoutApp0();
    const out = setJpegDpi(original, 300);
    expect(out.length).toBe(original.length + 18);
    expect(readJpegDpi(out)).toBe(300);
    // SOI must still come first.
    expect([out[0], out[1]]).toEqual([0xff, 0xd8]);
    // And the original segments must survive after it.
    expect(out[20]).toBe(0xff);
    expect(out[21]).toBe(0xdb);
  });

  it("round-trips 600 DPI", () => {
    expect(readJpegDpi(setJpegDpi(makeJpegWithApp0(), 600))).toBe(600);
  });

  it("refuses a file that is not a JPEG", () => {
    expect(() => setJpegDpi(makePng(), 300)).toThrow(/Not a JPEG/);
  });
});
