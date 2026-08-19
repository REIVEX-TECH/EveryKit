/**
 * Building JPEGs that carry a specific EXIF orientation.
 *
 * A phone held in portrait almost always writes the pixels in landscape and
 * sets Orientation=6 to say "turn this a quarter turn clockwise when you show
 * it". Every clean test image has Orientation=1, which is why an orientation
 * bug survives a whole test suite and then appears on the first real photo.
 *
 * These helpers take any JPEG and give it the tag, so the suite can cover all
 * four orientations a camera actually produces.
 */

/** The four values that matter: upright, upside down, and the two quarter turns. */
export type Orientation = 1 | 3 | 6 | 8;

export const ORIENTATIONS: Orientation[] = [1, 3, 6, 8];

/** Human names, for test titles that say what actually broke. */
export const ORIENTATION_NAMES: Record<Orientation, string> = {
  1: "upright",
  3: "upside down",
  6: "quarter turn clockwise (portrait phone photo)",
  8: "quarter turn anticlockwise",
};

/** True when the tag swaps the image's width and height on display. */
export function swapsAxes(orientation: Orientation): boolean {
  return orientation === 6 || orientation === 8;
}

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP1 = 0xe1;

function isStandalone(marker: number): boolean {
  return marker === SOI || marker === EOI || (marker >= 0xd0 && marker <= 0xd7);
}

type Segment = { marker: number; start: number; end: number };

/**
 * Walk the marker segments up to the scan.
 *
 * Everything from the start of scan onwards is entropy-coded and is never
 * parsed — it contains byte pairs that look like markers and are not.
 */
function readSegments(bytes: Uint8Array): { segments: Segment[]; scanStart: number } {
  if (bytes[0] !== 0xff || bytes[1] !== SOI) throw new Error("Not a JPEG.");

  const segments: Segment[] = [];
  let at = 2;

  while (at < bytes.length) {
    if (bytes[at] !== 0xff) throw new Error("Damaged JPEG: expected a marker.");
    let markerAt = at;
    while (markerAt < bytes.length && bytes[markerAt] === 0xff) markerAt++;
    if (markerAt >= bytes.length) break;

    const marker = bytes[markerAt];
    if (marker === SOS) return { segments, scanStart: at };

    if (isStandalone(marker)) {
      segments.push({ marker, start: at, end: markerAt + 1 });
      at = markerAt + 1;
      continue;
    }

    const length = (bytes[markerAt + 1] << 8) | bytes[markerAt + 2];
    const end = markerAt + 1 + length;
    if (length < 2 || end > bytes.length) throw new Error("Damaged JPEG: bad segment length.");
    segments.push({ marker, start: at, end });
    at = end;
  }

  return { segments, scanStart: bytes.length };
}

function isExifSegment(bytes: Uint8Array, segment: Segment): boolean {
  if (segment.marker !== APP1) return false;
  const tag = String.fromCharCode(...bytes.subarray(segment.start + 4, segment.start + 8));
  return tag === "Exif";
}

/**
 * An APP1 segment holding a minimal little-endian TIFF block whose only tag is
 * Orientation.
 */
function buildExifSegment(orientation: Orientation): Uint8Array {
  // TIFF: header (8) + entry count (2) + one 12-byte entry + next-IFD offset (4)
  const tiff = new Uint8Array(8 + 2 + 12 + 4);
  const view = new DataView(tiff.buffer);
  const LE = true;

  tiff[0] = 0x49; // 'I'
  tiff[1] = 0x49; // 'I' — little endian
  view.setUint16(2, 42, LE);
  view.setUint32(4, 8, LE); // IFD0 starts immediately after the header

  view.setUint16(8, 1, LE); // one entry
  view.setUint16(10, 0x0112, LE); // Orientation
  view.setUint16(12, 3, LE); // type SHORT
  view.setUint32(14, 1, LE); // count
  // A SHORT lives in the first two bytes of the four-byte value field.
  view.setUint16(18, orientation, LE);
  view.setUint16(20, 0, LE);
  view.setUint32(22, 0, LE); // no next IFD

  const header = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
  const length = 2 + header.length + tiff.length;

  const segment = new Uint8Array(2 + length);
  segment[0] = 0xff;
  segment[1] = APP1;
  segment[2] = (length >> 8) & 0xff;
  segment[3] = length & 0xff;
  segment.set(header, 4);
  segment.set(tiff, 4 + header.length);
  return segment;
}

/**
 * The same JPEG with its orientation tag set to `orientation`.
 *
 * Any existing EXIF block is dropped first, so calling this twice does not
 * leave two APP1 segments with different opinions — which real files do
 * contain, and which different decoders resolve differently.
 */
export function withExifOrientation(
  jpeg: Uint8Array,
  orientation: Orientation,
): Uint8Array {
  const stripped = stripExif(jpeg);
  const segment = buildExifSegment(orientation);

  const out = new Uint8Array(stripped.length + segment.length);
  out.set(stripped.subarray(0, 2), 0); // SOI
  out.set(segment, 2);
  out.set(stripped.subarray(2), 2 + segment.length);
  return out;
}

/** The same JPEG with every EXIF APP1 segment removed. */
export function stripExif(jpeg: Uint8Array): Uint8Array {
  const { segments, scanStart } = readSegments(jpeg);
  const drop = segments.filter((s) => isExifSegment(jpeg, s));
  if (drop.length === 0) return jpeg.slice();

  const keep = segments.filter((s) => !isExifSegment(jpeg, s));
  const size =
    2 + keep.reduce((n, s) => n + (s.end - s.start), 0) + (jpeg.length - scanStart);
  const out = new Uint8Array(size);
  out.set(jpeg.subarray(0, 2), 0);
  let at = 2;
  for (const s of keep) {
    out.set(jpeg.subarray(s.start, s.end), at);
    at += s.end - s.start;
  }
  out.set(jpeg.subarray(scanStart), at);
  return out;
}

/** The orientation a decoder would read, or null when the file carries none. */
export function readExifOrientation(jpeg: Uint8Array): number | null {
  const { segments } = readSegments(jpeg);
  const exif = segments.find((s) => isExifSegment(jpeg, s));
  if (!exif) return null;

  const tiffStart = exif.start + 4 + 6;
  const view = new DataView(jpeg.buffer, jpeg.byteOffset + tiffStart);
  const little = jpeg[tiffStart] === 0x49;

  const ifdOffset = view.getUint32(4, little);
  const count = view.getUint16(ifdOffset, little);

  for (let i = 0; i < count; i++) {
    const entry = ifdOffset + 2 + i * 12;
    if (view.getUint16(entry, little) === 0x0112) {
      return view.getUint16(entry + 8, little);
    }
  }
  return null;
}
