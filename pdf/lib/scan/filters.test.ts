import { describe, expect, it } from "vitest";
import { applyFilter, type Raster } from "./filters";

/** A w x h raster filled by a per-pixel function returning [r,g,b]. */
function make(w: number, h: number, fn: (x: number, y: number) => [number, number, number]): Raster {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const [r, g, b] = fn(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

describe("applyFilter", () => {
  it("original copies the pixels without changing them", () => {
    const src = make(2, 2, () => [10, 20, 30]);
    const out = applyFilter(src, "original");
    expect(out.data).toEqual(src.data);
    expect(out.data).not.toBe(src.data); // a copy, not the same buffer
  });

  it("grayscale replaces each pixel with its luminance", () => {
    const src = make(1, 1, () => [255, 0, 0]);
    const out = applyFilter(src, "grayscale");
    // 0.299 * 255 ~ 76
    expect(out.data[0]).toBe(76);
    expect(out.data[0]).toBe(out.data[1]);
    expect(out.data[1]).toBe(out.data[2]);
  });

  it("scan yields only pure black or pure white pixels", () => {
    const src = make(40, 40, (x, y) => {
      // A dark square in the middle of a light page.
      const dark = x > 12 && x < 28 && y > 12 && y < 28;
      return dark ? [30, 30, 30] : [235, 235, 235];
    });
    const out = applyFilter(src, "scan");
    for (let i = 0; i < out.data.length; i += 4) {
      expect(out.data[i] === 0 || out.data[i] === 255).toBe(true);
    }
    // The centre of the dark square is ink; a corner of the page is paper.
    const centre = (20 * 40 + 20) * 4;
    const corner = (0 * 40 + 0) * 4;
    expect(out.data[centre]).toBe(0);
    expect(out.data[corner]).toBe(255);
  });
});
