import { describe, expect, it } from "vitest";
import {
  describePages,
  normaliseRotation,
  parsePageRanges,
  parseSplitGroups,
} from "./pageRanges";

const ok = (input: string, count = 10) => {
  const result = parsePageRanges(input, count);
  if (!result.ok) throw new Error(`expected a parse, got: ${result.error}`);
  return result.pages;
};

const err = (input: string, count = 10) => {
  const result = parsePageRanges(input, count);
  if (result.ok) throw new Error(`expected a failure, got: ${result.pages}`);
  return result.error;
};

describe("parsePageRanges", () => {
  it("reads the shapes people type", () => {
    expect(ok("1")).toEqual([0]);
    expect(ok("1-3")).toEqual([0, 1, 2]);
    expect(ok("1-3, 7")).toEqual([0, 1, 2, 6]);
    expect(ok("2,4,6")).toEqual([1, 3, 5]);
    expect(ok(" 1 - 2 , 5 ")).toEqual([0, 1, 4]);
  });

  it("treats an open end as 'to the end' and an open start as 'from the start'", () => {
    expect(ok("8-", 10)).toEqual([7, 8, 9]);
    expect(ok("-3", 10)).toEqual([0, 1, 2]);
  });

  it("keeps the order written, because that is the order wanted", () => {
    expect(ok("3,1")).toEqual([2, 0]);
    expect(ok("5-6,1")).toEqual([4, 5, 0]);
  });

  it("keeps a page asked for twice", () => {
    expect(ok("2,2")).toEqual([1, 1]);
  });

  it("says what it could not understand rather than dropping it", () => {
    // Silently ignoring part of a selection is the worst failure a split tool
    // has, because the missing pages are only noticed later.
    expect(err("abc")).toMatch(/not a page number/);
    expect(err("1-abc")).toMatch(/not a page number/);
    expect(err("1--2")).toMatch(/not a page/);
  });

  it("refuses pages the document does not have", () => {
    expect(err("11", 10)).toMatch(/This file has 10 pages, so page 11 does not exist/);
    expect(err("0")).toMatch(/Pages start at 1/);
    expect(err("1-99", 10)).toMatch(/does not exist/);
  });

  it("refuses a backwards range instead of quietly reversing it", () => {
    expect(err("7-3")).toMatch(/comes after/);
  });

  it("asks for input rather than returning nothing", () => {
    expect(err("")).toMatch(/Type which pages/);
    expect(err("  ")).toMatch(/Type which pages/);
    expect(err(",,")).toMatch(/Type which pages/);
  });

  it("handles a single-page document", () => {
    expect(parsePageRanges("1", 1)).toEqual({ ok: true, pages: [0] });
    expect(err("2", 1)).toMatch(/This file has 1 page, so page 2 does not exist/);
  });
});

describe("parseSplitGroups", () => {
  it("makes one output per comma-separated group", () => {
    expect(parseSplitGroups("1-2,3-4", 6)).toEqual({
      ok: true,
      groups: [
        [0, 1],
        [2, 3],
      ],
    });
  });

  it("allows a single page as its own group", () => {
    expect(parseSplitGroups("1,2,3", 3)).toEqual({
      ok: true,
      groups: [[0], [1], [2]],
    });
  });

  it("passes the error up rather than skipping the bad group", () => {
    const result = parseSplitGroups("1-2,99", 6);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/does not exist/);
  });
});

describe("describePages", () => {
  it("collapses runs back into ranges", () => {
    expect(describePages([0, 1, 2])).toBe("1-3");
    expect(describePages([0, 2, 3, 7])).toBe("1, 3-4, 8");
    expect(describePages([4])).toBe("5");
    expect(describePages([])).toBe("");
  });
});

describe("normaliseRotation", () => {
  it("keeps rotation to the four values a PDF accepts", () => {
    expect(normaliseRotation(0)).toBe(0);
    expect(normaliseRotation(90)).toBe(90);
    expect(normaliseRotation(360)).toBe(0);
    expect(normaliseRotation(450)).toBe(90);
    expect(normaliseRotation(-90)).toBe(270);
    expect(normaliseRotation(-450)).toBe(270);
  });
});
