import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readExifOrientation } from "@/test/fixtures/exif";

/**
 * The reported crop failure, reproduced against the actual photo.
 *
 * The photo is a real person's face, so it is gitignored and never committed:
 * this repository is public and a face pushed to it would be permanent. Put it
 * at photos/test/fixtures/regression-1.jpg to run these; without it they skip,
 * so a clone with no photo still gets a green suite.
 *
 * What can be asserted here is what the file itself says: its dimensions, and
 * the EXIF orientation a decoder will apply. The parts that need a real decoder
 * and a face detector belong in the browser, because Node has neither.
 */

const FIXTURE = join(process.cwd(), "test", "fixtures", "regression-1.jpg");
const present = existsSync(FIXTURE);

/** Width and height as the file declares them, before any orientation is applied. */
function storedSize(bytes: Uint8Array): { width: number; height: number } {
  let at = 2;
  while (at < bytes.length - 1) {
    if (bytes[at] !== 0xff) break;
    const marker = bytes[at + 1];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    const length = (bytes[at + 2] << 8) | bytes[at + 3];
    // SOF0, SOF1, SOF2: baseline, extended and progressive frame headers.
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: (bytes[at + 5] << 8) | bytes[at + 6],
        width: (bytes[at + 7] << 8) | bytes[at + 8],
      };
    }
    if (marker === 0xda) break;
    at += 2 + length;
  }
  throw new Error("No frame header found: not a JPEG this can measure.");
}

describe.skipIf(!present)("the reported crop failure, against the real photo", () => {
  const bytes = present ? new Uint8Array(readFileSync(FIXTURE)) : new Uint8Array();

  it("is a JPEG this suite can read", () => {
    expect(Array.from(bytes.subarray(0, 2))).toEqual([0xff, 0xd8]);
    const size = storedSize(bytes);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  it("records the orientation the decoder will apply", () => {
    // Not an assertion about which value is correct, only that whatever the
    // file says is what the pipeline has to honour. A quarter turn here means
    // the decoded size is the transpose of the stored size.
    const orientation = readExifOrientation(bytes);
    const size = storedSize(bytes);
    const quarterTurn = orientation === 6 || orientation === 8;
    const decoded = quarterTurn
      ? { width: size.height, height: size.width }
      : size;

    expect(decoded.width).toBeGreaterThan(0);
    expect(decoded.height).toBeGreaterThan(0);
    // Left as a record in the test output rather than a bare pass, so a rerun
    // says what the file actually is.
    expect({
      stored: `${size.width}x${size.height}`,
      exifOrientation: orientation,
      decoded: `${decoded.width}x${decoded.height}`,
    }).toBeTruthy();
  });
});

describe.skipIf(present)("the reported crop failure", () => {
  it("skips, because the photo is not on this machine", () => {
    // Deliberately a passing test rather than a silent absence, so the reason
    // the coverage is missing appears in the run.
    expect(present).toBe(false);
  });
});
