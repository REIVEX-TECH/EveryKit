/**
 * The three looks the scan tool offers, applied to a raster in place-ish (each
 * returns a new buffer, the input is left alone).
 *
 * - original: nothing, kept so the choice is a real three-way.
 * - grayscale: luminance, for a photo of a page that should stay a photo.
 * - scan: adaptive threshold to near-black-and-white, which is what makes a
 *   phone photo read like something off a flatbed. It is adaptive rather than a
 *   single cutoff because a photo of paper is never lit evenly, and one global
 *   threshold turns the shadowed half of the page solid black.
 */

export type Raster = { data: Uint8ClampedArray; width: number; height: number };

export type ScanFilter = "original" | "grayscale" | "scan";

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

export function applyFilter(src: Raster, filter: ScanFilter): Raster {
  if (filter === "original") return { ...src, data: new Uint8ClampedArray(src.data) };
  if (filter === "grayscale") return grayscale(src);
  return adaptiveThreshold(src);
}

function grayscale(src: Raster): Raster {
  const out = new Uint8ClampedArray(src.data.length);
  for (let i = 0; i < src.data.length; i += 4) {
    const v = luma(src.data[i], src.data[i + 1], src.data[i + 2]);
    out[i] = out[i + 1] = out[i + 2] = v;
    out[i + 3] = 255;
  }
  return { data: out, width: src.width, height: src.height };
}

/**
 * Adaptive threshold with an integral image, so each pixel is compared against
 * the mean of the block around it in one pass rather than re-summing a window
 * per pixel. A pixel darker than its neighbourhood by more than a small margin
 * becomes ink; everything else becomes paper.
 */
function adaptiveThreshold(src: Raster): Raster {
  const { width: w, height: h, data } = src;
  const gray = new Float64Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = luma(data[i], data[i + 1], data[i + 2]);
  }

  // Summed-area table, padded by one row and column so a window that runs off
  // the edge needs no special case.
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < w; x += 1) {
      rowSum += gray[y * w + x];
      integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum;
    }
  }

  // A window roughly an eighth of the shorter side, which spans a few words of
  // body text at a phone photo's resolution.
  const radius = Math.max(8, Math.floor(Math.min(w, h) / 16));
  // A pixel must be this fraction below the local mean to count as ink. Small,
  // so faint pencil still catches, but non-zero so clean paper stays white.
  const bias = 0.9;

  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h - 1, y + radius);
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      const count = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * (w + 1) + (x1 + 1)] -
        integral[y0 * (w + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (w + 1) + x0] +
        integral[y0 * (w + 1) + x0];
      const mean = sum / count;
      const value = gray[y * w + x] < mean * bias ? 0 : 255;
      const oi = (y * w + x) * 4;
      out[oi] = out[oi + 1] = out[oi + 2] = value;
      out[oi + 3] = 255;
    }
  }

  return { data: out, width: w, height: h };
}
