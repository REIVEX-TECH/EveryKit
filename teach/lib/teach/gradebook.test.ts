import { describe, expect, it } from "vitest";
import { DEFAULT_SCALE, classSummary, letterFor, weightedTotal, type Assessment } from "./gradebook";

const assessments: Assessment[] = [
  { name: "Quiz", max: 10, weight: 25 },
  { name: "Final", max: 100, weight: 75 },
];

describe("weightedTotal", () => {
  it("weights each score by its weight and its maximum", () => {
    // Quiz 8/10 = 80%, Final 90/100 = 90%. 0.25*80 + 0.75*90 = 87.5.
    expect(weightedTotal([8, 90], assessments)).toBeCloseTo(87.5, 6);
  });

  it("leaves a blank score out rather than counting it as zero", () => {
    // Only the final is marked, so the total is just the final's percentage.
    expect(weightedTotal([null, 90], assessments)).toBeCloseTo(90, 6);
  });

  it("is null when nothing is marked", () => {
    expect(weightedTotal([null, null], assessments)).toBeNull();
  });
});

describe("letterFor", () => {
  it("maps a percentage to a letter on the scale", () => {
    expect(letterFor(87.5, DEFAULT_SCALE)).toBe("B");
    expect(letterFor(90, DEFAULT_SCALE)).toBe("A");
    expect(letterFor(59, DEFAULT_SCALE)).toBe("F");
    expect(letterFor(null, DEFAULT_SCALE)).toBe("—");
  });

  it("honours an edited scale", () => {
    const scale = [
      { grade: "Pass", min: 50 },
      { grade: "Fail", min: 0 },
    ];
    expect(letterFor(55, scale)).toBe("Pass");
    expect(letterFor(40, scale)).toBe("Fail");
  });
});

describe("classSummary", () => {
  it("gives the average, high and low of the marked totals", () => {
    expect(classSummary([80, 90, 100])).toEqual({ average: 90, high: 100, low: 80 });
  });

  it("ignores blanks", () => {
    expect(classSummary([null, 70, null, 90])).toEqual({ average: 80, high: 90, low: 70 });
  });

  it("is all null when nothing is marked", () => {
    expect(classSummary([null, null])).toEqual({ average: null, high: null, low: null });
  });
});
