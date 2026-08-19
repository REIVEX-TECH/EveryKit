/**
 * A minimal but structurally real JPEG, built in code.
 *
 * The EXIF helpers walk marker segments, so what they need to be tested
 * against is an authentic segment layout — a JFIF block, tables, a frame
 * header, and a scan whose entropy-coded data deliberately contains an
 * 0xFF 0x00 stuffing pair. A rewriter that treats the scan as structure
 * corrupts exactly that byte pair, so it belongs in the fixture.
 */

function segment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, (length >> 8) & 0xff, length & 0xff, ...payload];
}

const ascii = (text: string): number[] => [...text].map((c) => c.charCodeAt(0));

/** JFIF, density 72x72 dpi, no thumbnail. */
const APP0 = segment(0xe0, [
  ...ascii("JFIF"), 0x00,
  0x01, 0x02,
  0x01,
  0x00, 0x48, 0x00, 0x48,
  0x00, 0x00,
]);

const DQT = segment(0xdb, [0x00, ...new Array(64).fill(16)]);
const SOF0 = segment(0xc0, [0x08, 0x00, 0x08, 0x00, 0x08, 0x01, 0x01, 0x11, 0x00]);
const DHT = segment(0xc4, [0x00, 0x01, ...new Array(15).fill(0x00), 0x00]);
const SOS = segment(0xda, [0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]);

/** Byte stuffing included on purpose: 0xFF 0x00 inside the scan. */
const SCAN = [0xaa, 0xff, 0x00, 0x55, 0xff, 0x00, 0x3c, 0x91];
const EOI = [0xff, 0xd9];

export function minimalJpeg(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, ...APP0, ...DQT, ...SOF0, ...DHT, ...SOS, ...SCAN, ...EOI]);
}

/** Everything from the start-of-scan marker onwards. */
export function scanOf(bytes: Uint8Array): Uint8Array {
  for (let i = 2; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xda) return bytes.subarray(i);
  }
  throw new Error("no scan found");
}
