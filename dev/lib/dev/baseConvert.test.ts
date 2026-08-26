import { describe, expect, it } from "vitest";
import { parseInBase, toBase } from "./baseConvert";

describe("parseInBase", () => {
  it("reads each base", () => {
    expect(parseInBase("ff", 16)).toEqual({ value: 255n });
    expect(parseInBase("1010", 2)).toEqual({ value: 10n });
    expect(parseInBase("777", 8)).toEqual({ value: 511n });
    expect(parseInBase("42", 10)).toEqual({ value: 42n });
  });

  it("tolerates prefixes, separators and case", () => {
    expect(parseInBase("0xFF", 16)).toEqual({ value: 255n });
    expect(parseInBase("0b1010", 2)).toEqual({ value: 10n });
    expect(parseInBase("1010_1010", 2)).toEqual({ value: 170n });
  });

  it("handles negatives and empty input", () => {
    expect(parseInBase("-10", 10)).toEqual({ value: -10n });
    expect(parseInBase("   ", 10)).toEqual({ error: "" });
  });

  it("flags an invalid digit for the base rather than guessing", () => {
    expect(parseInBase("2", 2)).toHaveProperty("error");
    expect(parseInBase("8", 8)).toHaveProperty("error");
    expect(parseInBase("g", 16)).toHaveProperty("error");
  });

  it("keeps very large numbers exact through BigInt", () => {
    const hex = "ffffffffffffffffffffffffffffffff"; // 128 bits of ones
    const parsed = parseInBase(hex, 16);
    expect(parsed).toEqual({ value: (1n << 128n) - 1n });
    if ("value" in parsed) {
      expect(toBase(parsed.value, 10)).toBe("340282366920938463463374607431768211455");
      expect(toBase(parsed.value, 16)).toBe(hex);
    }
  });
});
