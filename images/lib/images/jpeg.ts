/**
 * Reading and rewriting the marker segments of a JPEG.
 *
 * This exists so metadata can be removed without touching the picture. The
 * usual way a browser tool "strips EXIF" is to draw the image to a canvas and
 * re-encode it, which does remove the metadata — and also throws away the
 * original compression and replaces it with the browser's. The photo comes out
 * softer, often larger, and always different, for a job that should not have
 * touched a single pixel.
 *
 * A JPEG is a sequence of segments. The entropy-coded scan data is one of them.
 * Dropping the metadata segments and writing the rest back out byte for byte
 * leaves the image data bit-identical, which is what the tests assert.
 */

export type Segment = {
  /** The second byte of the marker, so 0xE1 for APP1. */
  marker: number;
  /** The segment including its 0xFF marker byte and length. */
  bytes: Uint8Array;
};

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;

/** Markers with no length field and no payload. */
function isStandalone(marker: number): boolean {
  return marker === SOI || marker === EOI || (marker >= 0xd0 && marker <= 0xd7);
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === SOI;
}

/**
 * Split a JPEG into its segments.
 *
 * Everything from the start of scan to the end of the file is kept as one
 * trailing block rather than parsed. The scan is entropy-coded and contains
 * byte pairs that look like markers but are not, so walking it as structure is
 * how a rewriter corrupts a file. It is copied through untouched.
 */
export function readSegments(bytes: Uint8Array): {
  segments: Segment[];
  scan: Uint8Array;
} {
  if (!isJpeg(bytes)) throw new Error("That is not a JPEG file.");

  const segments: Segment[] = [];
  let at = 2; // past the SOI

  while (at < bytes.length) {
    if (bytes[at] !== 0xff) {
      throw new Error("This JPEG is damaged, so it was left alone.");
    }

    // Padding of 0xFF bytes before a marker is legal.
    let markerAt = at;
    while (markerAt < bytes.length && bytes[markerAt] === 0xff) markerAt++;
    if (markerAt >= bytes.length) break;

    const marker = bytes[markerAt];

    if (marker === SOS) {
      return { segments, scan: bytes.subarray(at) };
    }

    if (isStandalone(marker)) {
      segments.push({ marker, bytes: bytes.subarray(at, markerAt + 1) });
      at = markerAt + 1;
      continue;
    }

    const length = (bytes[markerAt + 1] << 8) | bytes[markerAt + 2];
    if (length < 2) throw new Error("This JPEG is damaged, so it was left alone.");

    const end = markerAt + 1 + length;
    if (end > bytes.length) throw new Error("This JPEG ends early, so it was left alone.");

    segments.push({ marker, bytes: bytes.subarray(at, end) });
    at = end;
  }

  return { segments, scan: new Uint8Array(0) };
}

/**
 * Which segments carry metadata rather than anything needed to decode.
 *
 * APP1 is EXIF and XMP, which is where the GPS coordinates, the camera serial
 * number and the timestamp live. APP2 upward covers the rest of the maker
 * notes and colour-management leftovers. COM is a free text comment.
 *
 * APP0 (JFIF) is deliberately kept: it holds the density fields, and dropping
 * it changes how some software reads the image's physical size.
 *
 * ICC profiles live in APP2. Removing them is the right default for a photo
 * being put online — a stripped file with no profile is treated as sRGB, which
 * is what a phone camera produced anyway — but it is worth knowing that this
 * is the one removal that can change how the image looks.
 */
export function isMetadata(marker: number): boolean {
  const isApp = marker >= 0xe0 && marker <= 0xef;
  const isComment = marker === 0xfe;
  return (isApp && marker !== 0xe0) || isComment;
}

/** What was found, so the UI can say what it is about to remove. */
export type MetadataReport = {
  /** True if any metadata segment is present. */
  present: boolean;
  /** Human names of what was found, in file order. */
  kinds: string[];
  /** Bytes the metadata occupies. */
  bytes: number;
};

function nameFor(segment: Segment): string {
  const { marker, bytes } = segment;
  if (marker === 0xfe) return "Comment";
  if (marker === 0xe1) {
    // The payload starts after the marker (2 bytes) and length (2 bytes).
    const tag = String.fromCharCode(...bytes.subarray(4, 8));
    if (tag === "Exif") return "EXIF (camera, date, often GPS)";
    if (tag === "http") return "XMP (editing history)";
    return "APP1";
  }
  if (marker === 0xe2) return "Colour profile or maker notes";
  if (marker === 0xed) return "Photoshop data";
  return `APP${marker - 0xe0}`;
}

export function inspect(bytes: Uint8Array): MetadataReport {
  const { segments } = readSegments(bytes);
  const found = segments.filter((segment) => isMetadata(segment.marker));

  const kinds: string[] = [];
  for (const segment of found) {
    const name = nameFor(segment);
    if (!kinds.includes(name)) kinds.push(name);
  }

  return {
    present: found.length > 0,
    kinds,
    bytes: found.reduce((sum, segment) => sum + segment.bytes.length, 0),
  };
}

/**
 * The same JPEG with its metadata segments removed.
 *
 * Nothing is re-encoded: the remaining segments and the whole scan are copied
 * through unchanged, so the decoded pixels are identical to the original's.
 */
export function stripMetadata(bytes: Uint8Array): Uint8Array {
  const { segments, scan } = readSegments(bytes);
  const kept = segments.filter((segment) => !isMetadata(segment.marker));

  const size =
    2 + kept.reduce((sum, segment) => sum + segment.bytes.length, 0) + scan.length;
  const out = new Uint8Array(size);

  out[0] = 0xff;
  out[1] = SOI;
  let at = 2;
  for (const segment of kept) {
    out.set(segment.bytes, at);
    at += segment.bytes.length;
  }
  out.set(scan, at);

  return out;
}
