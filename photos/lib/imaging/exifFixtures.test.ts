import { describe, expect, it } from "vitest";
import {
  ORIENTATIONS,
  readExifOrientation,
  stripExif,
  swapsAxes,
  withExifOrientation,
  type Orientation,
} from "@/test/fixtures/exif";
import { minimalJpeg, scanOf } from "@/test/fixtures/jpeg";

/**
 * These fixtures exist so the suite can cover the photo people actually take.
 * Every clean test image is Orientation=1; a phone held upright writes
 * Orientation=6. If the fixtures themselves are wrong, an orientation test
 * passes while proving nothing, so they get their own tests first.
 */

describe("EXIF orientation fixtures", () => {
  it("writes a tag a decoder can read back, for every orientation", () => {
    for (const orientation of ORIENTATIONS) {
      const tagged = withExifOrientation(minimalJpeg(), orientation);
      expect(readExifOrientation(tagged)).toBe(orientation);
    }
  });

  it("starts a JPEG and keeps the scan byte for byte", () => {
    const base = minimalJpeg();
    for (const orientation of ORIENTATIONS) {
      const tagged = withExifOrientation(base, orientation);
      expect(Array.from(tagged.subarray(0, 2))).toEqual([0xff, 0xd8]);
      expect(Array.from(tagged.subarray(-2))).toEqual([0xff, 0xd9]);
      // The scan is entropy-coded and contains 0xFF 0x00 pairs that look like
      // markers. Tagging must copy it, never parse it.
      expect(Array.from(scanOf(tagged))).toEqual(Array.from(scanOf(base)));
    }
  });

  it("keeps the JFIF block, which carries the density", () => {
    const tagged = withExifOrientation(minimalJpeg(), 6);
    let hasApp0 = false;
    for (let i = 2; i < tagged.length - 1; i++) {
      if (tagged[i] === 0xff && tagged[i + 1] === 0xe0) hasApp0 = true;
    }
    expect(hasApp0).toBe(true);
  });

  it("replaces rather than stacks, so a file never carries two opinions", () => {
    // Real files do contain two APP1 blocks, and decoders disagree about which
    // one wins. Re-tagging must not create that situation.
    const once = withExifOrientation(minimalJpeg(), 6);
    const twice = withExifOrientation(once, 8);
    expect(readExifOrientation(twice)).toBe(8);

    let app1Count = 0;
    for (let i = 2; i < twice.length - 1; i++) {
      if (twice[i] === 0xff && twice[i + 1] === 0xe1) app1Count++;
    }
    expect(app1Count).toBe(1);
    expect(twice.length).toBe(once.length);
  });

  it("strips back to a file with no orientation at all", () => {
    const tagged = withExifOrientation(minimalJpeg(), 6);
    expect(readExifOrientation(stripExif(tagged))).toBeNull();
    expect(readExifOrientation(minimalJpeg())).toBeNull();
  });

  it("knows which tags swap the axes", () => {
    // 6 and 8 are the quarter turns: a 1200x900 file displays as 900x1200.
    expect(ORIENTATIONS.filter(swapsAxes)).toEqual([6, 8]);
  });

  it("refuses something that is not a JPEG rather than producing rubbish", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => withExifOrientation(png, 6 as Orientation)).toThrow(/Not a JPEG/);
  });
});
