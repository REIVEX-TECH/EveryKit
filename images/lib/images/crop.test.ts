import { describe, expect, it } from "vitest";
import { applyRatio, clampRect, largestRectOfRatio, RATIOS } from "./crop";

const bounds = { width: 1000, height: 600 };

describe("clampRect", () => {
  it("leaves a rectangle that already fits alone", () => {
    const r = { x: 100, y: 50, width: 200, height: 150 };
    expect(clampRect(r, bounds)).toEqual(r);
  });

  it("slides a box back in rather than shrinking it when it runs off an edge", () => {
    // Dragged 200px past the right edge; it should return at the same size.
    const r = { x: 900, y: 50, width: 300, height: 150 };
    const out = clampRect(r, bounds);
    expect(out.width).toBe(300);
    expect(out.x).toBe(700);
    expect(out.x + out.width).toBe(1000);
  });

  it("shrinks only when the box is larger than the image", () => {
    const out = clampRect({ x: -50, y: -50, width: 5000, height: 5000 }, bounds);
    expect(out).toEqual({ x: 0, y: 0, width: 1000, height: 600 });
  });

  it("never rounds a dimension down to zero", () => {
    const out = clampRect({ x: 10, y: 10, width: 0.2, height: 0.2 }, bounds);
    expect(out.width).toBeGreaterThanOrEqual(1);
    expect(out.height).toBeGreaterThanOrEqual(1);
  });
});

describe("largestRectOfRatio", () => {
  it("returns the whole image for freeform", () => {
    expect(largestRectOfRatio(bounds, null)).toEqual({ x: 0, y: 0, width: 1000, height: 600 });
  });

  it("fits a square inside a landscape image, centred", () => {
    const out = largestRectOfRatio(bounds, 1);
    expect(out.width).toBe(600);
    expect(out.height).toBe(600);
    expect(out.x).toBe(200); // (1000 - 600) / 2
    expect(out.y).toBe(0);
  });

  it("is limited by width when the ratio is wider than the image", () => {
    const out = largestRectOfRatio({ width: 400, height: 400 }, 16 / 9);
    expect(out.width).toBe(400);
    expect(Math.round(out.height)).toBe(225);
    expect(out.y).toBeGreaterThan(0);
  });

  it("keeps the requested ratio to within a pixel", () => {
    for (const ratio of [1, 4 / 3, 3 / 2, 16 / 9]) {
      const out = largestRectOfRatio(bounds, ratio);
      expect(Math.abs(out.width / out.height - ratio)).toBeLessThan(0.02);
    }
  });
});

describe("applyRatio", () => {
  it("derives the height from the width for a locked ratio", () => {
    const out = applyRatio({ x: 0, y: 0, width: 400, height: 999 }, bounds, 1);
    expect(out.width).toBe(400);
    expect(out.height).toBe(400);
  });

  it("lets the height lead when deriving it would overflow the image", () => {
    // A square asked for at 800 wide would be 800 tall, past the 600 height.
    const out = applyRatio({ x: 0, y: 0, width: 800, height: 800 }, bounds, 1);
    expect(out.width).toBe(600);
    expect(out.height).toBe(600);
  });

  it("passes freeform straight through the clamp", () => {
    const out = applyRatio({ x: 100, y: 100, width: 200, height: 100 }, bounds, null);
    expect(out).toEqual({ x: 100, y: 100, width: 200, height: 100 });
  });
});

describe("the offered ratios", () => {
  it("leads with freeform and offers no passport ratio", () => {
    // ID photos have rules a plain crop cannot meet; offering "2x2" would imply
    // otherwise, and the copy points at ID Photos instead.
    expect(RATIOS[0].value).toBeNull();
    const labels = RATIOS.map((r) => r.label.toLowerCase()).join(" ");
    expect(labels).not.toContain("passport");
    expect(labels).not.toContain("2x2");
  });
});
