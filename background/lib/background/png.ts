/**
 * Reading a PNG well enough to prove it carries transparency.
 *
 * A file named .png with an image/png type proves nothing: a canvas will
 * happily encode a fully opaque image as PNG, and the tool would then hand
 * someone a "transparent background" that is a solid rectangle. The only
 * honest check is to decode the alpha channel and look, which is what this
 * does, and what the tests assert against real encoder output.
 */

import { inflateSync } from "zlib";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type PngHeader = {
  width: number;
  height: number;
  bitDepth: number;
  /** 0 grey, 2 truecolour, 3 indexed, 4 grey+alpha, 6 truecolour+alpha. */
  colourType: number;
  interlaced: boolean;
};

export function isPng(bytes: Uint8Array): boolean {
  return SIGNATURE.every((byte, index) => bytes[index] === byte);
}

type Chunk = { type: string; data: Uint8Array };

function readChunks(bytes: Uint8Array): Chunk[] {
  if (!isPng(bytes)) throw new Error("That is not a PNG.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Chunk[] = [];
  let at = 8;

  while (at + 8 <= bytes.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const start = at + 8;
    if (start + length > bytes.length) break;
    chunks.push({ type, data: bytes.subarray(start, start + length) });
    // 4 length + 4 type + data + 4 CRC
    at = start + length + 4;
    if (type === "IEND") break;
  }
  return chunks;
}

export function readHeader(bytes: Uint8Array): PngHeader {
  const ihdr = readChunks(bytes).find((chunk) => chunk.type === "IHDR");
  if (!ihdr) throw new Error("This PNG has no header chunk.");
  const view = new DataView(ihdr.data.buffer, ihdr.data.byteOffset, ihdr.data.byteLength);
  return {
    width: view.getUint32(0),
    height: view.getUint32(4),
    bitDepth: ihdr.data[8],
    colourType: ihdr.data[9],
    interlaced: ihdr.data[12] === 1,
  };
}

/** True when the format has an alpha channel at all. Necessary, not sufficient. */
export function hasAlphaChannel(bytes: Uint8Array): boolean {
  const { colourType } = readHeader(bytes);
  return colourType === 4 || colourType === 6;
}

export type AlphaReport = {
  /** The format carries an alpha channel. */
  channel: boolean;
  /** Pixels sampled. */
  pixels: number;
  /** How many were fully transparent. */
  transparent: number;
  /** How many were neither fully transparent nor fully opaque. */
  partial: number;
  /** Share of pixels that are fully transparent. */
  transparentFraction: number;
};

/**
 * Decode the alpha channel and report what is actually in it.
 *
 * Only the cases this kit produces are handled: 8-bit non-interlaced
 * truecolour with alpha, which is what every browser canvas emits. Anything
 * else throws rather than guessing, because a wrong answer here would be worse
 * than no answer: it would certify a file nobody checked.
 *
 * `partial` matters as much as `transparent`. A cutout with hard edges and no
 * partial alpha has been thresholded somewhere, and hair looks cut out with
 * scissors. Soft edges show up here as partially transparent pixels.
 */
export function inspectAlpha(bytes: Uint8Array): AlphaReport {
  const header = readHeader(bytes);
  if (!hasAlphaChannel(bytes)) {
    return { channel: false, pixels: 0, transparent: 0, partial: 0, transparentFraction: 0 };
  }
  if (header.bitDepth !== 8 || header.colourType !== 6 || header.interlaced) {
    throw new Error(
      `This PNG is ${header.bitDepth}-bit colour type ${header.colourType}${
        header.interlaced ? " interlaced" : ""
      }, which this reader does not decode.`,
    );
  }

  const idat = readChunks(bytes).filter((chunk) => chunk.type === "IDAT");
  if (idat.length === 0) throw new Error("This PNG has no image data.");

  const total = idat.reduce((sum, chunk) => sum + chunk.data.length, 0);
  const joined = new Uint8Array(total);
  let at = 0;
  for (const chunk of idat) {
    joined.set(chunk.data, at);
    at += chunk.data.length;
  }

  const raw = new Uint8Array(inflateSync(Buffer.from(joined)));
  const { width, height } = header;
  const channels = 4;
  const stride = width * channels;

  // Undo the per-row filters. Alpha cannot be read without this: the filters
  // are applied across bytes, so a filtered row's alpha bytes are differences,
  // not values.
  const out = new Uint8Array(stride * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos];
    pos += 1;
    const rowStart = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[pos + x];
      const left = x >= channels ? out[rowStart + x - channels] : 0;
      const up = y > 0 ? out[rowStart - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? out[rowStart - stride + x - channels] : 0;

      let recovered: number;
      switch (filter) {
        case 0: recovered = value; break;
        case 1: recovered = value + left; break;
        case 2: recovered = value + up; break;
        case 3: recovered = value + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          recovered = value + predictor;
          break;
        }
        default:
          throw new Error(`Unknown PNG row filter ${filter}.`);
      }
      out[rowStart + x] = recovered & 0xff;
    }
    pos += stride;
  }

  let transparent = 0;
  let partial = 0;
  const pixels = width * height;
  for (let i = 3; i < out.length; i += channels) {
    const alpha = out[i];
    if (alpha === 0) transparent++;
    else if (alpha < 255) partial++;
  }

  return {
    channel: true,
    pixels,
    transparent,
    partial,
    transparentFraction: pixels > 0 ? transparent / pixels : 0,
  };
}
