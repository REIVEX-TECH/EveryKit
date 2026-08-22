import { describe, expect, it } from "vitest";
import { cornerPosition, displaySize, toPageSpace } from "./placement";

// A4 in points, deliberately not square so a swapped axis cannot hide.
const W = 595;
const H = 842;

describe("displaySize", () => {
  it("leaves an upright page alone", () => {
    expect(displaySize(0, W, H)).toEqual({ width: W, height: H });
    expect(displaySize(180, W, H)).toEqual({ width: W, height: H });
  });

  it("swaps the axes on a quarter turn", () => {
    expect(displaySize(90, W, H)).toEqual({ width: H, height: W });
    expect(displaySize(270, W, H)).toEqual({ width: H, height: W });
  });

  it("normalises whatever the file happens to carry", () => {
    // /Rotate is allowed to be negative or past a full turn.
    expect(displaySize(-90, W, H)).toEqual({ width: H, height: W });
    expect(displaySize(450, W, H)).toEqual({ width: H, height: W });
  });
});

describe("toPageSpace", () => {
  it("changes nothing on an upright page", () => {
    expect(toPageSpace(0, W, H, { x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });

  /**
   * The property that matters: a point placed in the displayed frame must come
   * back to the same displayed point when the page's own rotation is applied to
   * it again. Rotating the page clockwise by R is what a viewer does, so doing
   * it here is the round trip.
   */
  function backToDisplay(
    rotation: number,
    width: number,
    height: number,
    page: { x: number; y: number },
  ) {
    switch (((rotation % 360) + 360) % 360) {
      case 90:
        return { x: page.y, y: width - page.x };
      case 180:
        return { x: width - page.x, y: height - page.y };
      case 270:
        return { x: height - page.y, y: page.x };
      default:
        return page;
    }
  }

  it("round-trips through the viewer's own rotation, at every quarter turn", () => {
    for (const rotation of [0, 90, 180, 270]) {
      const frame = displaySize(rotation, W, H);
      for (const wanted of [
        { x: 0, y: 0 },
        { x: 28, y: 28 },
        { x: frame.width - 28, y: 28 },
        { x: frame.width / 2, y: frame.height / 2 },
        { x: 1, y: frame.height - 1 },
      ]) {
        const inPage = toPageSpace(rotation, W, H, wanted);
        expect(backToDisplay(rotation, W, H, inPage)).toEqual(wanted);
      }
    }
  });

  it("keeps every placement inside the page for a quarter-turned document", () => {
    // The bug this catches: computing in the displayed frame and then writing
    // the numbers straight into page space, which pushes the mark off the sheet
    // whenever the two frames differ.
    const frame = displaySize(90, W, H);
    const spot = cornerPosition("bottom-right", frame.width, frame.height, 40, 10, 28);
    const inPage = toPageSpace(90, W, H, spot);

    expect(inPage.x).toBeGreaterThanOrEqual(0);
    expect(inPage.x).toBeLessThanOrEqual(W);
    expect(inPage.y).toBeGreaterThanOrEqual(0);
    expect(inPage.y).toBeLessThanOrEqual(H);
  });

  it("puts the displayed bottom-left of a 90 degree page near the page's right edge", () => {
    // Stated concretely rather than as a property, so the intent survives a
    // refactor that keeps the round trip but flips a sign.
    expect(toPageSpace(90, W, H, { x: 0, y: 0 })).toEqual({ x: W, y: 0 });
    expect(toPageSpace(270, W, H, { x: 0, y: 0 })).toEqual({ x: 0, y: H });
    expect(toPageSpace(180, W, H, { x: 0, y: 0 })).toEqual({ x: W, y: H });
  });
});

describe("cornerPosition", () => {
  const frame = { width: 400, height: 600 };
  const box = { width: 40, height: 10 };
  const margin = 20;

  it("hangs a box off each corner with the margin kept from both edges", () => {
    expect(cornerPosition("bottom-left", frame.width, frame.height, box.width, box.height, margin))
      .toEqual({ x: 20, y: 20 });
    expect(cornerPosition("bottom-right", frame.width, frame.height, box.width, box.height, margin))
      .toEqual({ x: 340, y: 20 });
    expect(cornerPosition("top-left", frame.width, frame.height, box.width, box.height, margin))
      .toEqual({ x: 20, y: 570 });
    expect(cornerPosition("top-right", frame.width, frame.height, box.width, box.height, margin))
      .toEqual({ x: 340, y: 570 });
  });

  it("centres horizontally for the centre corners, and both ways for centre", () => {
    expect(cornerPosition("bottom-centre", frame.width, frame.height, box.width, box.height, margin))
      .toEqual({ x: 180, y: 20 });
    expect(cornerPosition("top-centre", frame.width, frame.height, box.width, box.height, margin))
      .toEqual({ x: 180, y: 570 });
    expect(cornerPosition("centre", frame.width, frame.height, box.width, box.height, margin))
      .toEqual({ x: 180, y: 295 });
  });

  it("never lets the right edge sit outside the frame", () => {
    const spot = cornerPosition("bottom-right", frame.width, frame.height, box.width, box.height, margin);
    expect(spot.x + box.width).toBe(frame.width - margin);
  });
});
