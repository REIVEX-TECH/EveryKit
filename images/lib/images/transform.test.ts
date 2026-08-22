import { describe, expect, it } from "vitest";
import {
  apply,
  flipHorizontal,
  flipVertical,
  IDENTITY,
  isIdentity,
  outputSize,
  rotateCW,
  rotateCCW,
  transformFor,
  type Orient,
} from "./transform";

// A landscape source, deliberately not square so a swapped axis shows.
const src = { width: 40, height: 20 };

/** The four source corners, labelled, so a failure names which one moved wrong. */
const CORNERS = {
  topLeft: [0, 0],
  topRight: [src.width, 0],
  bottomLeft: [0, src.height],
  bottomRight: [src.width, src.height],
} as const;

function mappedCorners(state: Orient) {
  const m = transformFor(src, state);
  const out: Record<string, { x: number; y: number }> = {};
  for (const [name, [x, y]] of Object.entries(CORNERS)) {
    out[name] = apply(m, x, y);
  }
  return out;
}

describe("outputSize", () => {
  it("keeps the size for 0 and 180", () => {
    expect(outputSize(src, { ...IDENTITY, rotate: 0 })).toEqual(src);
    expect(outputSize(src, { ...IDENTITY, rotate: 180 })).toEqual(src);
  });
  it("swaps width and height for a quarter turn", () => {
    expect(outputSize(src, { ...IDENTITY, rotate: 90 })).toEqual({ width: 20, height: 40 });
    expect(outputSize(src, { ...IDENTITY, rotate: 270 })).toEqual({ width: 20, height: 40 });
  });
});

describe("transformFor keeps the whole image on the canvas", () => {
  it("maps every corner inside the output box, for all eight orientations", () => {
    const states: Orient[] = [];
    for (const rotate of [0, 90, 180, 270] as const) {
      for (const flipH of [false, true]) {
        for (const flipV of [false, true]) {
          states.push({ rotate, flipH, flipV });
        }
      }
    }
    for (const state of states) {
      const out = outputSize(src, state);
      for (const p of Object.values(mappedCorners(state))) {
        expect(p.x).toBeGreaterThanOrEqual(-0.0001);
        expect(p.y).toBeGreaterThanOrEqual(-0.0001);
        expect(p.x).toBeLessThanOrEqual(out.width + 0.0001);
        expect(p.y).toBeLessThanOrEqual(out.height + 0.0001);
      }
    }
  });
});

describe("transformFor places specific corners where the eye expects", () => {
  it("does nothing for the identity", () => {
    const c = mappedCorners(IDENTITY);
    expect(c.topLeft).toEqual({ x: 0, y: 0 });
    expect(c.bottomRight).toEqual({ x: 40, y: 20 });
  });

  it("sends the source top-left to the top-right on a 90 clockwise turn", () => {
    // Output is 20 wide, 40 tall; the old top-left corner swings to the top-right.
    const c = mappedCorners({ ...IDENTITY, rotate: 90 });
    expect(c.topLeft).toEqual({ x: 20, y: 0 });
    expect(c.topRight).toEqual({ x: 20, y: 40 });
  });

  it("mirrors left-to-right", () => {
    const c = mappedCorners({ ...IDENTITY, flipH: true });
    expect(c.topLeft).toEqual({ x: 40, y: 0 });
    expect(c.topRight).toEqual({ x: 0, y: 0 });
  });

  it("mirrors top-to-bottom", () => {
    const c = mappedCorners({ ...IDENTITY, flipV: true });
    expect(c.topLeft).toEqual({ x: 0, y: 20 });
    expect(c.bottomLeft).toEqual({ x: 0, y: 0 });
  });
});

describe("the orientation operations", () => {
  it("adds up to a full turn and back to identity", () => {
    let s = IDENTITY;
    for (let i = 0; i < 4; i++) s = rotateCW(s);
    expect(s.rotate).toBe(0);
    expect(isIdentity(s)).toBe(true);
  });

  it("turns the two ways in opposite directions", () => {
    expect(rotateCW(IDENTITY).rotate).toBe(90);
    expect(rotateCCW(IDENTITY).rotate).toBe(270);
  });

  it("toggles each flip", () => {
    expect(flipHorizontal(IDENTITY).flipH).toBe(true);
    expect(flipHorizontal(flipHorizontal(IDENTITY)).flipH).toBe(false);
    expect(flipVertical(IDENTITY).flipV).toBe(true);
  });

  it("knows when it is a no-op", () => {
    expect(isIdentity(IDENTITY)).toBe(true);
    expect(isIdentity({ ...IDENTITY, flipH: true })).toBe(false);
    expect(isIdentity({ ...IDENTITY, rotate: 180 })).toBe(false);
  });
});
