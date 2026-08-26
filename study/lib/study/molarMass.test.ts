import { describe, expect, it } from "vitest";
import { parseFormula, molarMass, breakdown } from "./molarMass";

function mass(formula: string): number {
  const parsed = parseFormula(formula);
  if ("error" in parsed) throw new Error(parsed.error);
  return molarMass(parsed.counts);
}

describe("parseFormula and molarMass", () => {
  it("computes water", () => {
    expect(mass("H2O")).toBeCloseTo(18.015, 2);
  });

  it("computes sulfuric acid", () => {
    // 2(1.008) + 32.06 + 4(15.999)
    expect(mass("H2SO4")).toBeCloseTo(98.072, 2);
  });

  it("handles a bracketed group, calcium hydroxide", () => {
    // 40.078 + 2(15.999 + 1.008)
    expect(mass("Ca(OH)2")).toBeCloseTo(74.092, 2);
  });

  it("handles a nested group, ammonium sulfate", () => {
    expect(mass("(NH4)2SO4")).toBeCloseTo(132.134, 2);
  });

  it("handles a hydrate written with a dot and coefficient", () => {
    // CuSO4 is 159.602; plus 5 x 18.015 for the water.
    expect(mass("CuSO4.5H2O")).toBeCloseTo(249.677, 2);
    expect(mass("CuSO4·5H2O")).toBeCloseTo(mass("CuSO4.5H2O"), 6);
  });

  it("treats symbols case-sensitively, Co is not CO", () => {
    expect(mass("Co")).toBeCloseTo(58.933, 2);
    expect(mass("CO")).toBeCloseTo(28.01, 2);
    expect(mass("Co")).not.toBeCloseTo(mass("CO"), 1);
  });

  it("sorts the breakdown by heaviest contribution", () => {
    const parsed = parseFormula("H2SO4");
    if ("error" in parsed) throw new Error(parsed.error);
    const rows = breakdown(parsed.counts);
    expect(rows[0].element.symbol).toBe("O"); // 4 x 16 dominates
    expect(rows.map((r) => r.element.symbol)).toContain("H");
  });

  it("rejects an unknown symbol, an unbalanced bracket and a stray character", () => {
    expect(parseFormula("Xz2")).toHaveProperty("error");
    expect(parseFormula("Ca(OH2")).toHaveProperty("error");
    expect(parseFormula("H2O)")).toHaveProperty("error");
    expect(parseFormula("H2@O")).toHaveProperty("error");
  });

  it("returns an empty error for empty input", () => {
    expect(parseFormula("   ")).toEqual({ error: "" });
  });
});
