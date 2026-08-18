import { afterEach, describe, expect, it, vi } from "vitest";
import { revealResult } from "./revealResult";

type Stub = {
  el: HTMLElement;
  scrolled: Array<ScrollIntoViewOptions | boolean | undefined>;
};

/**
 * A stand-in element with a controllable bounding box, since jsdom is not in
 * play here and the real rules are all geometry.
 */
function makeElement(top: number, height: number): Stub {
  const scrolled: Stub["scrolled"] = [];
  const el = {
    tagName: "DIV",
    getBoundingClientRect: () => ({
      top,
      bottom: top + height,
      height,
      left: 0,
      right: 0,
      width: 400,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }),
    scrollIntoView: (options?: ScrollIntoViewOptions | boolean) => {
      scrolled.push(options);
    },
  } as unknown as HTMLElement;
  return { el, scrolled };
}

function setUp({
  viewport = 800,
  activeTag = "BODY",
  activeType = "text",
  reducedMotion = false,
}: {
  viewport?: number;
  activeTag?: string;
  activeType?: string;
  reducedMotion?: boolean;
} = {}) {
  vi.stubGlobal("window", {
    innerHeight: viewport,
    matchMedia: () => ({ matches: reducedMotion }),
  });
  vi.stubGlobal("document", {
    documentElement: { clientHeight: viewport },
    activeElement: { tagName: activeTag, type: activeType, isContentEditable: false },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("revealResult", () => {
  it("scrolls a result that is below the fold", () => {
    setUp();
    const { el, scrolled } = makeElement(1400, 400);
    expect(revealResult(el)).toBe(true);
    expect(scrolled).toHaveLength(1);
    expect(scrolled[0]).toMatchObject({ behavior: "smooth", block: "nearest" });
  });

  it("leaves the page alone when the result is already on screen", () => {
    setUp();
    const { el, scrolled } = makeElement(100, 400);
    expect(revealResult(el)).toBe(false);
    expect(scrolled).toHaveLength(0);
  });

  it("does not move the page while someone is typing", () => {
    // The whole reason for the guard: a caret that runs away mid-sentence.
    for (const type of ["text", "email", "number", "date", "search"]) {
      setUp({ activeTag: "INPUT", activeType: type });
      const { el, scrolled } = makeElement(1400, 400);
      expect([type, revealResult(el)]).toEqual([type, false]);
      expect(scrolled).toHaveLength(0);
    }
    setUp({ activeTag: "TEXTAREA" });
    expect(revealResult(makeElement(1400, 400).el)).toBe(false);
  });

  it("still reveals when focus is on a control that is not text entry", () => {
    // Focus lands on the hidden file input the moment a photo is chosen, which
    // is exactly when the result needs bringing into view. Treating that as
    // typing meant the reveal never fired on the main path.
    for (const type of ["file", "checkbox", "radio", "range", "button"]) {
      setUp({ activeTag: "INPUT", activeType: type });
      const { el, scrolled } = makeElement(1400, 400);
      expect([type, revealResult(el)]).toEqual([type, true]);
      expect(scrolled).toHaveLength(1);
    }
  });

  it("jumps instantly when reduced motion is asked for", () => {
    setUp({ reducedMotion: true });
    const { el, scrolled } = makeElement(1400, 400);
    expect(revealResult(el)).toBe(true);
    expect(scrolled[0]).toMatchObject({ behavior: "auto" });
  });

  it("still scrolls a result taller than the viewport", () => {
    // Such a result can never be "half visible" by its own height, so the rule
    // falls back to a share of the viewport instead.
    setUp({ viewport: 700 });
    const tall = makeElement(900, 3000);
    expect(revealResult(tall.el)).toBe(true);

    const tallAndOnScreen = makeElement(40, 3000);
    expect(revealResult(tallAndOnScreen.el)).toBe(false);
  });

  it("does nothing without an element", () => {
    setUp();
    expect(revealResult(null)).toBe(false);
  });

  it("does not treat a zero-height element as visible", () => {
    setUp();
    const { el } = makeElement(0, 0);
    expect(revealResult(el)).toBe(true);
  });
});
