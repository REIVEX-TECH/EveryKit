/**
 * Canvas exports carry no physical resolution. A 600 x 600 PNG from
 * `toBlob()` opens as "8.33 x 8.33 inches at 72 DPI", which is the thing that
 * gets passport photos rejected at the print counter.
 *
 * These functions rewrite the encoded bytes so the file reports the right
 * physical size: a pHYs chunk for PNG, the JFIF APP0 density fields for JPEG.
 * Pure byte manipulation, no DOM, so it is testable in Node.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Metres per inch, used to convert DPI into the pHYs pixels-per-metre unit. */
const METRES_PER_INCH = 0.0254;

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  crcTable = table;
  return table;
}

/** Standard CRC-32, the variant PNG uses for its chunk checksums. */
export function crc32(bytes: Uint8Array): number {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8;
}

export function dpiToPixelsPerMetre(dpi: number): number {
  return Math.round(dpi / METRES_PER_INCH);
}

export function pixelsPerMetreToDpi(ppm: number): number {
  return Math.round(ppm * METRES_PER_INCH);
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function chunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );
}

/**
 * Insert (or replace) the pHYs chunk of a PNG so it reports the given DPI.
 * pHYs must appear before the first IDAT, so it goes straight after IHDR.
 */
export function setPngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isPng(bytes)) throw new Error("Not a PNG file");

  const ppm = dpiToPixelsPerMetre(dpi);

  // pHYs chunk: 4 length + 4 type + 9 data + 4 crc.
  const chunk = new Uint8Array(21);
  writeUint32(chunk, 0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  writeUint32(chunk, 8, ppm);
  writeUint32(chunk, 12, ppm);
  chunk[16] = 1; // unit specifier: 1 means metres
  writeUint32(chunk, 17, crc32(chunk.subarray(4, 17)));

  // Walk the chunk list, dropping any pHYs that is already there and noting
  // where the new one belongs.
  const pieces: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let inserted = false;

  while (offset + 8 <= bytes.length) {
    const dataLength = readUint32(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    const total = 12 + dataLength;
    if (offset + total > bytes.length) break;

    if (type !== "pHYs") {
      pieces.push(bytes.subarray(offset, offset + total));
    }

    if (type === "IHDR" && !inserted) {
      pieces.push(chunk);
      inserted = true;
    }

    offset += total;
    if (type === "IEND") break;
  }

  if (!inserted) throw new Error("PNG has no IHDR chunk");

  return concat(pieces);
}

/** Read the DPI a PNG reports, or null when it carries no pHYs chunk. */
export function readPngDpi(bytes: Uint8Array): number | null {
  if (!isPng(bytes)) return null;
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const dataLength = readUint32(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    if (type === "pHYs") {
      const unit = bytes[offset + 8 + 8];
      if (unit !== 1) return null; // aspect-ratio-only, no physical size
      return pixelsPerMetreToDpi(readUint32(bytes, offset + 8));
    }
    if (type === "IEND") break;
    offset += 12 + dataLength;
  }
  return null;
}

/**
 * Set the JFIF density fields of a JPEG. Patches the existing APP0 segment when
 * the encoder wrote one, and inserts a fresh APP0 after SOI when it did not.
 */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isJpeg(bytes)) throw new Error("Not a JPEG file");
  const density = Math.round(dpi);

  // APP0 is required to be the first segment when present, but scan a little
  // way in so a leading Exif APP1 does not throw us off.
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    // Start of scan or a standalone marker: no APP0 to patch.
    if (marker === 0xda || marker === 0xd9) break;
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2) break;

    if (marker === 0xe0 && isJfifIdentifier(bytes, offset + 4)) {
      const out = new Uint8Array(bytes);
      out[offset + 11] = 1; // units: 1 means dots per inch
      out[offset + 12] = (density >> 8) & 0xff;
      out[offset + 13] = density & 0xff;
      out[offset + 14] = (density >> 8) & 0xff;
      out[offset + 15] = density & 0xff;
      return out;
    }

    offset += 2 + segmentLength;
  }

  // No usable APP0, so build one. 16 bytes: marker, length, "JFIF\0",
  // version, units, densities, thumbnail size.
  const app0 = new Uint8Array([
    0xff, 0xe0,
    0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x02,
    0x01,
    (density >> 8) & 0xff, density & 0xff,
    (density >> 8) & 0xff, density & 0xff,
    0x00, 0x00,
  ]);

  return concat([bytes.subarray(0, 2), app0, bytes.subarray(2)]);
}

function isJfifIdentifier(bytes: Uint8Array, offset: number): boolean {
  return (
    bytes[offset] === 0x4a &&
    bytes[offset + 1] === 0x46 &&
    bytes[offset + 2] === 0x49 &&
    bytes[offset + 3] === 0x46 &&
    bytes[offset + 4] === 0x00
  );
}

/** Read the DPI a JPEG reports, or null when it has no JFIF density set. */
export function readJpegDpi(bytes: Uint8Array): number | null {
  if (!isJpeg(bytes)) return null;
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2) break;
    if (marker === 0xe0 && isJfifIdentifier(bytes, offset + 4)) {
      const units = bytes[offset + 11];
      const x = (bytes[offset + 12] << 8) | bytes[offset + 13];
      if (units === 1) return x;
      if (units === 2) return Math.round(x * 2.54); // dots per cm
      return null;
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/**
 * Rewrite a canvas-produced Blob so it reports the right physical resolution.
 * Unknown formats pass through untouched rather than failing the download.
 */
export async function setBlobDpi(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let out: Uint8Array;
  if (isPng(bytes)) {
    out = setPngDpi(bytes, dpi);
  } else if (isJpeg(bytes)) {
    out = setJpegDpi(bytes, dpi);
  } else {
    return blob;
  }
  return new Blob([out as unknown as BlobPart], { type: blob.type });
}
