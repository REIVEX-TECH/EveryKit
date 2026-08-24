import { describe, expect, it } from "vitest";
import {
  applyHomography,
  estimateSize,
  solveHomography,
  warpPerspective,
  type Point,
  type Raster,
} from "./perspective";

const rect = (w: number, h: number): Point[] => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: h },
  { x: 0, y: h },
];

describe("solveHomography", () => {
  it("maps each source corner onto its destination corner", () => {
    const src = rect(100, 100);
    // A believable phone-photo quad: narrower at the top, tilted.
    const dst: Point[] = [
      { x: 20, y: 8 },
      { x: 92, y: 22 },
      { x: 78, y: 96 },
      { x: 6, y: 74 },
    ];
    const h = solveHomography(src, dst);
    for (let i = 0; i < 4; i += 1) {
      const p = applyHomography(h, src[i].x, src[i].y);
      expect(p.x).toBeCloseTo(dst[i].x, 4);
      expect(p.y).toBeCloseTo(dst[i].y, 4);
    }
  });

  it("is the identity when source and destination are the same rectangle", () => {
    const r = rect(50, 30);
    const h = solveHomography(r, r);
    const p = applyHomography(h, 17, 11);
    expect(p.x).toBeCloseTo(17, 6);
    expect(p.y).toBeCloseTo(11, 6);
  });

  it("refuses degenerate corners", () => {
    const collapsed: Point[] = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    expect(() => solveHomography(rect(10, 10), collapsed)).toThrow();
  });
});

describe("warpPerspective", () => {
  it("returns a raster of the requested size", () => {
    const src: Raster = { data: new Uint8ClampedArray(4 * 4 * 4).fill(255), width: 4, height: 4 };
    const out = warpPerspective(src, rect(4, 4), 8, 6);
    expect(out.width).toBe(8);
    expect(out.height).toBe(6);
    expect(out.data.length).toBe(8 * 6 * 4);
  });

  it("reproduces a solid colour under an identity warp", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 120;
      data[i + 1] = 30;
      data[i + 2] = 200;
      data[i + 3] = 255;
    }
    const out = warpPerspective({ data, width: 4, height: 4 }, rect(4, 4), 4, 4);
    // A middle pixel, away from the clamped edge, is the source colour.
    const mid = (2 * 4 + 2) * 4;
    expect([out.data[mid], out.data[mid + 1], out.data[mid + 2]]).toEqual([120, 30, 200]);
  });

  it("fills area outside the source quad with white", () => {
    const src: Raster = { data: new Uint8ClampedArray(10 * 10 * 4).fill(0), width: 10, height: 10 };
    for (let i = 3; i < src.data.length; i += 4) src.data[i] = 255; // opaque black
    // A quad entirely off the source maps every output pixel outside it.
    const off: Point[] = [
      { x: 100, y: 100 },
      { x: 110, y: 100 },
      { x: 110, y: 110 },
      { x: 100, y: 110 },
    ];
    const out = warpPerspective(src, off, 4, 4);
    expect([out.data[0], out.data[1], out.data[2]]).toEqual([255, 255, 255]);
  });
});

describe("estimateSize", () => {
  it("takes the average of opposite edges", () => {
    const quad: Point[] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(estimateSize(quad)).toEqual({ width: 200, height: 100 });
  });

  it("caps the long edge", () => {
    const quad: Point[] = [
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
      { x: 4000, y: 2000 },
      { x: 0, y: 2000 },
    ];
    const size = estimateSize(quad, 1600);
    expect(Math.max(size.width, size.height)).toBe(1600);
    // Aspect ratio is preserved.
    expect(size.width / size.height).toBeCloseTo(2, 5);
  });
});
