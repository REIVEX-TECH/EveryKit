import { describe, expect, it } from "vitest";
import {
  findReplace,
  naturalCompare,
  removeDuplicateLines,
  sortLines,
} from "./lines";

describe("findReplace", () => {
  it("replaces every plain match and counts them", () => {
    const r = findReplace("a cat sat on a mat", { find: "at", replace: "AT", regex: false, caseSensitive: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.output).toBe("a cAT sAT on a mAT");
    expect(r.count).toBe(3);
  });

  it("is case-insensitive when asked", () => {
    const r = findReplace("Cat cat CAT", { find: "cat", replace: "dog", regex: false, caseSensitive: false });
    if (!r.ok) throw new Error(r.error);
    expect(r.output).toBe("dog dog dog");
    expect(r.count).toBe(3);
  });

  it("treats the needle as literal in plain mode", () => {
    // The dots are literal dots, not any-character.
    const r = findReplace("a.b axb a.b", { find: "a.b", replace: "X", regex: false, caseSensitive: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.output).toBe("X axb X");
    expect(r.count).toBe(2);
  });

  it("does not treat $1 in a plain replacement as a back-reference", () => {
    const r = findReplace("price here", { find: "price", replace: "$1", regex: false, caseSensitive: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.output).toBe("$1 here");
  });

  it("supports regex groups and back-references in regex mode", () => {
    const r = findReplace("2027-03-01", { find: "(\\d{4})-(\\d{2})-(\\d{2})", replace: "$3/$2/$1", regex: true, caseSensitive: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.output).toBe("01/03/2027");
    expect(r.count).toBe(1);
  });

  it("reports an invalid regex rather than throwing", () => {
    const r = findReplace("x", { find: "(unclosed", replace: "", regex: true, caseSensitive: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not a valid regular expression/i);
  });

  it("refuses an empty search", () => {
    const r = findReplace("x", { find: "", replace: "y", regex: false, caseSensitive: true });
    expect(r.ok).toBe(false);
  });

  it("counts zero when nothing matches, leaving the text alone", () => {
    const r = findReplace("hello", { find: "zzz", replace: "!", regex: false, caseSensitive: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.count).toBe(0);
    expect(r.output).toBe("hello");
  });
});

describe("removeDuplicateLines", () => {
  it("keeps the first of each line and counts the rest", () => {
    const r = removeDuplicateLines("a\nb\na\nc\nb", { trim: false, caseInsensitive: false });
    expect(r.output).toBe("a\nb\nc");
    expect(r.removed).toBe(2);
  });

  it("keeps the line exactly, comparing a trimmed key", () => {
    // "  a  " and "a" are duplicates under trim, and the first, with its
    // spaces, is what is kept.
    const r = removeDuplicateLines("  a  \na\nb", { trim: true, caseInsensitive: false });
    expect(r.output).toBe("  a  \nb");
    expect(r.removed).toBe(1);
  });

  it("folds case only in the comparison when asked", () => {
    const r = removeDuplicateLines("Apple\napple\nAPPLE", { trim: false, caseInsensitive: true });
    expect(r.output).toBe("Apple");
    expect(r.removed).toBe(2);
  });

  it("treats CRLF and lone CR as line breaks", () => {
    const r = removeDuplicateLines("a\r\nb\ra", { trim: false, caseInsensitive: false });
    expect(r.output).toBe("a\nb");
    expect(r.removed).toBe(1);
  });

  it("removes nothing from all-unique input", () => {
    const r = removeDuplicateLines("a\nb\nc", { trim: false, caseInsensitive: false });
    expect(r.removed).toBe(0);
  });
});

describe("naturalCompare", () => {
  it("orders numbers within text by value, not by character", () => {
    const sorted = ["file10", "file2", "file1"].sort(naturalCompare);
    expect(sorted).toEqual(["file1", "file2", "file10"]);
  });
});

describe("sortLines", () => {
  it("sorts A to Z", () => {
    expect(sortLines("banana\napple\ncherry", "az").output).toBe("apple\nbanana\ncherry");
  });

  it("sorts Z to A", () => {
    expect(sortLines("apple\nbanana\ncherry", "za").output).toBe("cherry\nbanana\napple");
  });

  it("sorts naturally, so file10 comes after file2", () => {
    expect(sortLines("file10\nfile2\nfile1", "natural").output).toBe("file1\nfile2\nfile10");
  });

  it("preserves a trailing newline", () => {
    expect(sortLines("b\na\n", "az").output).toBe("a\nb\n");
  });

  it("adds no trailing newline when there was none", () => {
    expect(sortLines("b\na", "az").output).toBe("a\nb");
  });

  it("shuffles into a permutation of the same lines", () => {
    // A fixed random source makes the shuffle deterministic to assert on.
    const seq = [0.9, 0.1, 0.5, 0.3];
    let i = 0;
    const random = () => seq[i++ % seq.length];
    const out = sortLines("a\nb\nc\nd", "shuffle", random).output.split("\n");
    expect(out.sort()).toEqual(["a", "b", "c", "d"]);
    expect(out).toHaveLength(4);
  });

  it("returns empty for empty input", () => {
    expect(sortLines("", "az").output).toBe("");
  });
});
