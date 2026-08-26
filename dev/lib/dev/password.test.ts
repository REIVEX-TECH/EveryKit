import { describe, expect, it } from "vitest";
import { buildPool, entropyBits, strengthLabel, CHAR_SETS } from "./password";

describe("buildPool", () => {
  it("joins the chosen sets", () => {
    expect(buildPool(["lower", "digits"], false)).toBe(CHAR_SETS.lower + CHAR_SETS.digits);
  });

  it("drops look-alike characters when asked", () => {
    const pool = buildPool(["lower", "upper", "digits"], true);
    for (const c of ["l", "I", "1", "O", "0", "o"]) expect(pool.includes(c)).toBe(false);
    // A plain unambiguous character survives.
    expect(pool.includes("a")).toBe(true);
  });
});

describe("entropyBits", () => {
  it("is log2(pool) per character times length", () => {
    // A 10-character password from lowercase (26) is 10 * log2(26).
    expect(entropyBits(26, 10)).toBeCloseTo(47.004, 2);
    // 95 printable ASCII at length 16 is a common strong target.
    expect(entropyBits(95, 16)).toBeCloseTo(105.09, 1);
  });

  it("is zero for a degenerate pool or length", () => {
    expect(entropyBits(1, 20)).toBe(0);
    expect(entropyBits(50, 0)).toBe(0);
  });
});

describe("strengthLabel", () => {
  it("labels by bit thresholds", () => {
    expect(strengthLabel(30)).toBe("weak");
    expect(strengthLabel(50)).toBe("fair");
    expect(strengthLabel(70)).toBe("strong");
    expect(strengthLabel(120)).toBe("very strong");
  });
});
