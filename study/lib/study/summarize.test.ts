import { describe, expect, it } from "vitest";
import {
  cleanText,
  fixSpacing,
  keyPoints,
  normalizeBullets,
  stripDuplicateLines,
  toSentences,
} from "./summarize";

describe("toSentences", () => {
  it("splits on sentence endings and trims", () => {
    expect(toSentences("Hello there. How are you? I am fine!")).toEqual([
      "Hello there.",
      "How are you?",
      "I am fine!",
    ]);
  });
});

describe("keyPoints", () => {
  it("returns everything when there are fewer sentences than asked for", () => {
    const text = "One sentence only.";
    expect(keyPoints(text, 3)).toEqual(["One sentence only."]);
  });

  it("selects the most central sentence and keeps original order", () => {
    // The photosynthesis sentence shares words with every other one, so it is
    // the most central node and should be picked first.
    const text =
      "Photosynthesis converts light energy into chemical energy in plants. " +
      "The weather today is cold and wet. " +
      "Light energy from the sun drives photosynthesis in the leaves. " +
      "My favourite colour is blue. " +
      "Plants use photosynthesis to make the chemical energy they store.";
    const points = keyPoints(text, 2);
    expect(points.length).toBe(2);
    expect(points.join(" ")).toContain("Photosynthesis converts light energy");
    // Output preserves document order.
    const indices = points.map((p) => text.indexOf(p));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("only ever returns sentences from the input, never rewrites them", () => {
    const text =
      "Cells are the basic unit of life. Every cell has a membrane. " +
      "The membrane controls what enters the cell. Ribosomes build proteins.";
    for (const point of keyPoints(text, 2)) {
      expect(text).toContain(point);
    }
  });
});

describe("cleanup", () => {
  it("collapses runs of spaces and removes spaces before punctuation", () => {
    expect(fixSpacing("Hello    world .  Next  line")).toBe("Hello world. Next line");
  });

  it("removes duplicate lines, keeping the first", () => {
    expect(stripDuplicateLines("a\nb\na\nc\nb")).toBe("a\nb\nc");
  });

  it("normalises assorted bullets to a plain dash", () => {
    expect(normalizeBullets("• first\n● second\n* third\n- fourth")).toBe(
      "- first\n- second\n- third\n- fourth",
    );
  });

  it("runs all three together", () => {
    const messy = "• point one\n• point one\n●  point two  ";
    expect(cleanText(messy)).toBe("- point one\n- point two");
  });
});
