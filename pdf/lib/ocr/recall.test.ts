import { describe, expect, it } from "vitest";
import { wordRecall } from "./recall";

describe("wordRecall", () => {
  it("is 1 for an exact match", () => {
    expect(wordRecall("The quick brown fox", "The quick brown fox")).toBe(1);
  });

  it("ignores case and punctuation", () => {
    expect(wordRecall("Hello, world!", "hello world")).toBe(1);
  });

  it("is the fraction of expected words found", () => {
    // Three of four expected words are present.
    expect(wordRecall("one two three four", "one two three")).toBeCloseTo(0.75, 5);
  });

  it("respects repeats: a dropped duplicate is not perfect", () => {
    expect(wordRecall("the the cat", "the cat")).toBeCloseTo(2 / 3, 5);
  });

  it("is unaffected by extra words the recogniser invents", () => {
    expect(wordRecall("alpha beta", "alpha beta gamma delta")).toBe(1);
  });

  it("treats an empty expectation as perfect", () => {
    expect(wordRecall("", "anything")).toBe(1);
  });
});
