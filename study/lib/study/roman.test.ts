import { describe, expect, it } from "vitest";
import { toRoman, fromRoman } from "./roman";

describe("toRoman", () => {
  it("converts known values", () => {
    expect(toRoman(1)).toEqual({ roman: "I" });
    expect(toRoman(4)).toEqual({ roman: "IV" });
    expect(toRoman(9)).toEqual({ roman: "IX" });
    expect(toRoman(40)).toEqual({ roman: "XL" });
    expect(toRoman(1994)).toEqual({ roman: "MCMXCIV" });
    expect(toRoman(2024)).toEqual({ roman: "MMXXIV" });
    expect(toRoman(3999)).toEqual({ roman: "MMMCMXCIX" });
  });

  it("refuses values outside 1 to 3999 and non-integers", () => {
    expect(toRoman(0)).toHaveProperty("error");
    expect(toRoman(4000)).toHaveProperty("error");
    expect(toRoman(-5)).toHaveProperty("error");
    expect(toRoman(3.5)).toHaveProperty("error");
  });
});

describe("fromRoman", () => {
  it("reads well-formed numerals, case-insensitively", () => {
    expect(fromRoman("IV")).toEqual({ value: 4 });
    expect(fromRoman("mcmxciv")).toEqual({ value: 1994 });
    expect(fromRoman("MMMCMXCIX")).toEqual({ value: 3999 });
  });

  it("rejects malformed numerals and stray letters", () => {
    expect(fromRoman("IIII")).toHaveProperty("error"); // should be IV
    expect(fromRoman("VX")).toHaveProperty("error");
    expect(fromRoman("IC")).toHaveProperty("error");
    expect(fromRoman("ABC")).toHaveProperty("error");
  });

  it("round-trips every value in range", () => {
    for (let n = 1; n <= 3999; n += 1) {
      const r = toRoman(n);
      if ("error" in r) throw new Error(`toRoman failed at ${n}`);
      expect(fromRoman(r.roman)).toEqual({ value: n });
    }
  });

  it("returns an empty error for empty input", () => {
    expect(fromRoman("  ")).toEqual({ error: "" });
  });
});
