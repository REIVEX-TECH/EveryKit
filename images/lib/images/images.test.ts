import { describe, expect, it } from "vitest";
import { inspect, isJpeg, readSegments, stripMetadata } from "./jpeg";
import { jpegWithMetadata, jpegWithoutMetadata, scanOf } from "./fixtures";
import { describeChange, formatBytes, planResize, type Target } from "./resize";
import { makeZip, uniqueNames } from "./zip";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

describe("inspect", () => {
  it("finds what is actually in the file and names it", () => {
    const report = inspect(jpegWithMetadata());
    expect(report.present).toBe(true);
    expect(report.kinds).toEqual([
      "EXIF (camera, date, often GPS)",
      "XMP (editing history)",
      "Comment",
    ]);
    expect(report.bytes).toBeGreaterThan(80);
  });

  it("says so when there is nothing to remove", () => {
    const report = inspect(jpegWithoutMetadata());
    expect(report.present).toBe(false);
    expect(report.kinds).toEqual([]);
    expect(report.bytes).toBe(0);
  });
});

describe("stripMetadata", () => {
  it("removes the metadata segments", () => {
    const out = stripMetadata(jpegWithMetadata());
    expect(inspect(out).present).toBe(false);
  });

  it("leaves the image data bit-identical", () => {
    // This is the whole point. Re-encoding through a canvas would also remove
    // the metadata, and would also change every pixel; this must not.
    const original = jpegWithMetadata();
    const out = stripMetadata(original);
    expect(Array.from(scanOf(out))).toEqual(Array.from(scanOf(original)));
  });

  it("keeps the JFIF segment, which carries the density", () => {
    const out = stripMetadata(jpegWithMetadata());
    const { segments } = readSegments(out);
    expect(segments.some((segment) => segment.marker === 0xe0)).toBe(true);
  });

  it("keeps the tables the decoder needs", () => {
    const { segments } = readSegments(stripMetadata(jpegWithMetadata()));
    const markers = segments.map((segment) => segment.marker);
    expect(markers).toContain(0xdb); // quantisation
    expect(markers).toContain(0xc0); // frame
    expect(markers).toContain(0xc4); // Huffman
  });

  it("still starts and ends like a JPEG", () => {
    const out = stripMetadata(jpegWithMetadata());
    expect(isJpeg(out)).toBe(true);
    expect(Array.from(out.subarray(-2))).toEqual([0xff, 0xd9]);
  });

  it("makes the file smaller by exactly what it removed", () => {
    const original = jpegWithMetadata();
    const removed = inspect(original).bytes;
    expect(original.length - stripMetadata(original).length).toBe(removed);
  });

  it("is a no-op on a file with nothing to strip", () => {
    const clean = jpegWithoutMetadata();
    expect(Array.from(stripMetadata(clean))).toEqual(Array.from(clean));
  });

  it("can be run twice without changing anything the second time", () => {
    const once = stripMetadata(jpegWithMetadata());
    expect(Array.from(stripMetadata(once))).toEqual(Array.from(once));
  });

  it("refuses a file that is not a JPEG", () => {
    expect(() => stripMetadata(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toThrow(
      /not a JPEG/,
    );
  });
});

// ---------------------------------------------------------------------------
// Resize maths
// ---------------------------------------------------------------------------

const target = (over: Partial<Target> = {}): Target => ({
  width: null,
  height: null,
  fit: "inside",
  allowUpscale: false,
  ...over,
});

describe("planResize", () => {
  const landscape = { width: 4000, height: 3000 };
  const portrait = { width: 3000, height: 4000 };

  it("scales from a width alone, keeping proportions", () => {
    const plan = planResize(landscape, target({ width: 1000 }));
    expect(plan).toMatchObject({ width: 1000, height: 750 });
  });

  it("scales from a height alone", () => {
    expect(planResize(landscape, target({ height: 750 }))).toMatchObject({
      width: 1000,
      height: 750,
    });
  });

  it("fits a portrait photo inside a landscape box without cropping it", () => {
    const plan = planResize(portrait, target({ width: 1000, height: 1000, fit: "inside" }));
    expect(plan).toMatchObject({ width: 750, height: 1000 });
  });

  it("fills the box and crops the middle under cover", () => {
    const plan = planResize(landscape, target({ width: 1000, height: 1000, fit: "cover" }));
    expect(plan.width).toBe(1000);
    expect(plan.height).toBe(1000);
    // A 4000x3000 source filling a square crops to 3000x3000, centred.
    expect(plan.crop).toEqual({ x: 500, y: 0, width: 3000, height: 3000 });
  });

  it("stretches under exact, proportions be damned", () => {
    expect(planResize(landscape, target({ width: 800, height: 800, fit: "exact" })))
      .toMatchObject({ width: 800, height: 800 });
  });

  it("refuses to enlarge by default", () => {
    // Someone resizing a batch to 2000px wide does not mean "and make the
    // small ones blurry".
    const plan = planResize({ width: 400, height: 300 }, target({ width: 2000 }));
    expect(plan).toMatchObject({ width: 400, height: 300, unchanged: true });
  });

  it("enlarges when explicitly told to", () => {
    const plan = planResize({ width: 400, height: 300 }, target({ width: 800, allowUpscale: true }));
    expect(plan).toMatchObject({ width: 800, height: 600, unchanged: false });
  });

  it("crops to the requested shape when it cannot fill the box", () => {
    // Cover with a box bigger than the source: rather than enlarging, take the
    // largest crop of the right shape that the source actually contains.
    const plan = planResize({ width: 1000, height: 500 }, target({ width: 2000, height: 2000, fit: "cover" }));
    expect(plan.width).toBe(plan.height);
    expect(plan.crop.width).toBeLessThanOrEqual(1000);
    expect(plan.crop.height).toBeLessThanOrEqual(500);
  });

  it("leaves the image alone when no size was asked for", () => {
    expect(planResize(landscape, target())).toMatchObject({
      width: 4000,
      height: 3000,
      unchanged: true,
    });
  });

  it("never plans a zero-pixel image", () => {
    const plan = planResize({ width: 4000, height: 3 }, target({ width: 10 }));
    expect(plan.width).toBeGreaterThan(0);
    expect(plan.height).toBeGreaterThan(0);
  });
});

describe("describeChange", () => {
  it("does not dress up a result that got worse", () => {
    expect(describeChange(1000, 1200)).toBe("20% larger");
    expect(describeChange(1000, 400)).toBe("60% smaller");
    expect(describeChange(1000, 1000)).toBe("about the same size");
    expect(describeChange(1000, 998)).toBe("about the same size");
  });
});

describe("formatBytes", () => {
  it("writes sizes the way a file manager does", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 kB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

// ---------------------------------------------------------------------------
// ZIP
// ---------------------------------------------------------------------------

const u32 = (bytes: Uint8Array, at: number) =>
  new DataView(bytes.buffer, bytes.byteOffset).getUint32(at, true);
const u16 = (bytes: Uint8Array, at: number) =>
  new DataView(bytes.buffer, bytes.byteOffset).getUint16(at, true);

describe("makeZip", () => {
  const entries = [
    { name: "one.jpg", bytes: Uint8Array.from([1, 2, 3, 4]) },
    { name: "two.png", bytes: Uint8Array.from([9, 8, 7]) },
  ];

  it("writes the signatures an unzipper looks for", () => {
    const zip = makeZip(entries);
    expect(u32(zip, 0)).toBe(0x04034b50); // first local header
    // The end record is the last 22 bytes when there is no archive comment.
    expect(u32(zip, zip.length - 22)).toBe(0x06054b50);
  });

  it("records the right number of entries in both places", () => {
    const zip = makeZip(entries);
    const end = zip.length - 22;
    expect(u16(zip, end + 8)).toBe(2);
    expect(u16(zip, end + 10)).toBe(2);
  });

  it("points the central directory at where it actually is", () => {
    const zip = makeZip(entries);
    const end = zip.length - 22;
    const offset = u32(zip, end + 16);
    // Following the pointer must land on a central directory header.
    expect(u32(zip, offset)).toBe(0x02014b50);
  });

  it("stores each file's bytes verbatim", () => {
    const zip = makeZip([entries[0]]);
    const nameLength = u16(zip, 26);
    const start = 30 + nameLength;
    expect(Array.from(zip.subarray(start, start + 4))).toEqual([1, 2, 3, 4]);
  });

  it("marks names as UTF-8 so accents survive", () => {
    const zip = makeZip([{ name: "café.jpg", bytes: Uint8Array.from([0]) }]);
    expect(u16(zip, 6) & 0x0800).toBe(0x0800);
  });

  it("gives the same bytes for the same input", () => {
    // No clock in the output, so a run is reproducible and testable.
    expect(Array.from(makeZip(entries))).toEqual(Array.from(makeZip(entries)));
  });

  it("handles an empty archive without producing something broken", () => {
    const zip = makeZip([]);
    expect(zip.length).toBe(22);
    expect(u32(zip, 0)).toBe(0x06054b50);
  });
});

describe("uniqueNames", () => {
  it("keeps distinct names as they are", () => {
    expect(uniqueNames(["a.jpg", "b.jpg"])).toEqual(["a.jpg", "b.jpg"]);
  });

  it("numbers duplicates instead of losing one of them", () => {
    // Two files picked from different folders can share a name, and a ZIP with
    // two identical entries opens with one silently missing.
    expect(uniqueNames(["a.jpg", "a.jpg", "a.jpg"])).toEqual([
      "a.jpg",
      "a (1).jpg",
      "a (2).jpg",
    ]);
  });

  it("strips characters that are not allowed in a filename", () => {
    expect(uniqueNames(["a/b:c.jpg"])).toEqual(["a-b-c.jpg"]);
  });

  it("never returns an empty name", () => {
    expect(uniqueNames(["..."])).toEqual(["image"]);
  });
});
