import { describe, expect, it } from "vitest";
import { analyseEssay } from "./essayLength";

describe("analyseEssay", () => {
  it("counts words, characters, and sentences", () => {
    const stats = analyseEssay("Hello world. This is a test!");
    expect(stats.words).toBe(6);
    expect(stats.characters).toBe("Hello world. This is a test!".length);
    expect(stats.charactersNoSpaces).toBe("Helloworld.Thisisatest!".length);
    expect(stats.sentences).toBe(2);
  });

  it("estimates pages at each format, double the length single-spaced", () => {
    // 500 words: 2 pages double, 1 page single.
    const text = Array.from({ length: 500 }, () => "word").join(" ");
    const stats = analyseEssay(text);
    const double = stats.pages.find((p) => p.label === "Double-spaced")!.pages;
    const single = stats.pages.find((p) => p.label === "Single-spaced")!.pages;
    expect(double).toBe(2);
    expect(single).toBe(1);
  });

  it("gives reading and speaking times, speaking slower than reading", () => {
    const text = Array.from({ length: 400 }, () => "word").join(" ");
    const stats = analyseEssay(text);
    expect(stats.readingMinutes).toBeCloseTo(2, 5); // 400 / 200
    expect(stats.speakingMinutes).toBeGreaterThan(stats.readingMinutes);
  });

  it("is all zero for empty text", () => {
    const stats = analyseEssay("");
    expect(stats.words).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.pages.every((p) => p.pages === 0)).toBe(true);
  });
});
