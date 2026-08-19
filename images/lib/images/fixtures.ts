/**
 * A JPEG built in code, so the metadata tests do not need a checked-in photo.
 *
 * It is a real, decodable JPEG: a genuine quantisation table, Huffman tables,
 * a frame header and a scan. What matters for these tests is that the segment
 * structure is authentic, so a rewriter that mishandles it produces a file
 * that no longer parses.
 */

/** A segment: 0xFF, marker, big-endian length, payload. */
function segment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, (length >> 8) & 0xff, length & 0xff, ...payload];
}

const ascii = (text: string): number[] => [...text].map((c) => c.charCodeAt(0));

/** JFIF: units 1 (dpi), 72x72, no thumbnail. */
const APP0 = segment(0xe0, [
  ...ascii("JFIF"), 0x00,
  0x01, 0x02,
  0x01,
  0x00, 0x48, 0x00, 0x48,
  0x00, 0x00,
]);

/**
 * An EXIF block with a GPS-looking payload.
 *
 * The contents do not need to be a valid TIFF tree for these tests — the point
 * is that a chunk of bytes claiming to be EXIF is present, is found, and is
 * gone afterwards.
 */
const APP1_EXIF = segment(0xe1, [
  ...ascii("Exif"), 0x00, 0x00,
  0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
  ...ascii("GPSLatitude 51.5074 GPSLongitude -0.1278 Camera SN 0042"),
]);

const APP1_XMP = segment(0xe1, [
  ...ascii("http://ns.adobe.com/xap/1.0/"), 0x00,
  ...ascii("<x:xmpmeta>edited</x:xmpmeta>"),
]);

const COMMENT = segment(0xfe, ascii("a comment nobody wanted to publish"));

/** A flat quantisation table: table 0, 8-bit, every value 16. */
const DQT = segment(0xdb, [0x00, ...new Array(64).fill(16)]);

/** Baseline frame: 8-bit, 8x8, one greyscale component. */
const SOF0 = segment(0xc0, [0x08, 0x00, 0x08, 0x00, 0x08, 0x01, 0x01, 0x11, 0x00]);

/** A Huffman table with a single one-bit code, which is enough to be valid. */
const DHT = segment(0xc4, [
  0x00,
  0x01, ...new Array(15).fill(0x00),
  0x00,
]);

/** Start of scan: one component, table 0, spectral 0-63. */
const SOS_HEADER = segment(0xda, [0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]);

/** Entropy-coded data, deliberately containing a 0xFF 0x00 byte-stuffing pair. */
const SCAN_DATA = [0xaa, 0xff, 0x00, 0x55, 0xff, 0x00, 0x3c];
const EOI = [0xff, 0xd9];

export type Fixture = { bytes: Uint8Array; scanStart: number };

/**
 * A JPEG with metadata in it.
 *
 * `scanStart` is where the entropy-coded data begins in the original, so a
 * test can lift the scan out of both files and compare them directly.
 */
export function jpegWithMetadata(): Uint8Array {
  return Uint8Array.from([
    0xff, 0xd8,
    ...APP0,
    ...APP1_EXIF,
    ...APP1_XMP,
    ...COMMENT,
    ...DQT,
    ...SOF0,
    ...DHT,
    ...SOS_HEADER,
    ...SCAN_DATA,
    ...EOI,
  ]);
}

/** The same picture with nothing to remove. */
export function jpegWithoutMetadata(): Uint8Array {
  return Uint8Array.from([
    0xff, 0xd8,
    ...APP0,
    ...DQT,
    ...SOF0,
    ...DHT,
    ...SOS_HEADER,
    ...SCAN_DATA,
    ...EOI,
  ]);
}

/** Everything from the start-of-scan marker onwards. */
export function scanOf(bytes: Uint8Array): Uint8Array {
  for (let i = 2; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xda) return bytes.subarray(i);
  }
  throw new Error("no scan found in fixture");
}
