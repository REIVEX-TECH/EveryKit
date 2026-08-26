import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUOTAS,
  DEFAULT_Z_BANDS,
  gradeByPercent,
  gradeByZ,
  gradesByQuota,
  histogram,
  linearScale,
  parseMarks,
  percentile,
  stats,
  DEFAULT_PERCENT_SCALE,
  type Student,
} from "./curve";

describe("stats", () => {
  it("computes count, mean, median, population sd, min and max", () => {
    const s = stats([50, 60, 70, 80, 90]);
    expect(s.count).toBe(5);
    expect(s.mean).toBe(70);
    expect(s.median).toBe(70);
    expect(s.sd).toBeCloseTo(Math.sqrt(200), 6); // ~14.142
    expect(s.min).toBe(50);
    expect(s.max).toBe(90);
  });

  it("takes the mean of the middle two for an even count", () => {
    expect(stats([10, 20, 30, 40]).median).toBe(25);
  });

  it("is all zero for an empty list", () => {
    expect(stats([])).toEqual({ count: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 });
  });
});

describe("z-score and percentile", () => {
  it("gives standard deviations from the mean", () => {
    expect(zScoreOf(90)).toBeCloseTo(Math.sqrt(2), 6); // 20 / 14.142
    expect(zScoreOf(70)).toBe(0);
  });

  it("gives the share at or below, so the top mark is 100", () => {
    const marks = [50, 60, 70, 80, 90];
    expect(percentile(70, marks)).toBe(60);
    expect(percentile(90, marks)).toBe(100);
    expect(percentile(50, marks)).toBe(20);
  });
});

function zScoreOf(mark: number): number {
  const s = stats([50, 60, 70, 80, 90]);
  return (mark - s.mean) / s.sd;
}

describe("gradeByZ", () => {
  it("assigns by the first band the z-score clears", () => {
    expect(gradeByZ(1.5, DEFAULT_Z_BANDS)).toBe("A");
    expect(gradeByZ(0.5, DEFAULT_Z_BANDS)).toBe("B");
    expect(gradeByZ(-0.5, DEFAULT_Z_BANDS)).toBe("C");
    expect(gradeByZ(-1.5, DEFAULT_Z_BANDS)).toBe("D");
    expect(gradeByZ(-3, DEFAULT_Z_BANDS)).toBe("F");
  });
});

describe("gradesByQuota", () => {
  it("gives the top slice the first grade, in mark order", () => {
    // 20 students, marks 1..20, default quotas 15/35/35/10/5 -> 3/7/7/2/1.
    const students: Student[] = Array.from({ length: 20 }, (_, i) => ({
      name: `S${i}`,
      mark: i + 1,
    }));
    const grades = gradesByQuota(students, DEFAULT_QUOTAS);
    const count = (g: string) => grades.filter((x) => x === g).length;
    expect(count("A")).toBe(3);
    expect(count("B")).toBe(7);
    expect(count("C")).toBe(7);
    expect(count("D")).toBe(2);
    expect(count("F")).toBe(1);
    // The top mark (20) is the last student and must be an A.
    expect(grades[19]).toBe("A");
    // The bottom mark (1) is the first student and must be the lowest grade.
    expect(grades[0]).toBe("F");
  });
});

describe("linearScale and gradeByPercent", () => {
  it("stretches so the top mark becomes the target", () => {
    expect(linearScale([40, 50], 100)).toEqual([80, 100]);
  });

  it("assigns a letter from the percentage scale", () => {
    expect(gradeByPercent(95, DEFAULT_PERCENT_SCALE)).toBe("A");
    expect(gradeByPercent(85, DEFAULT_PERCENT_SCALE)).toBe("B");
    expect(gradeByPercent(59, DEFAULT_PERCENT_SCALE)).toBe("F");
  });
});

describe("histogram", () => {
  it("buckets marks and puts the max in the last bucket", () => {
    const h = histogram([0, 0, 5, 10], 2);
    expect(h).toHaveLength(2);
    expect(h[0].count).toBe(2); // the two 0s
    expect(h[1].count).toBe(2); // the 5 and the 10
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(4);
  });
});

describe("parseMarks with messy input", () => {
  it("reads Name,Mark rows, skips a header, handles quoted names and bare marks", () => {
    const text =
      'Name,Mark\n' +
      "Ada,85\n" +
      '"Lovelace, Ada",92\n' +
      "\n" + // blank row
      "70\n" + // just a mark
      "Bob,"; // missing mark
    const students = parseMarks(text);
    expect(students).toEqual([
      { name: "Ada", mark: 85 },
      { name: "Lovelace, Ada", mark: 92 },
      { name: "Student 3", mark: 70 },
    ]);
  });

  it("reads a plain column of marks", () => {
    expect(parseMarks("55\n66\n77")).toEqual([
      { name: "Student 1", mark: 55 },
      { name: "Student 2", mark: 66 },
      { name: "Student 3", mark: 77 },
    ]);
  });

  it("treats marks as strings and coerces them", () => {
    expect(parseMarks("Ada, 85 \nBob,90")).toEqual([
      { name: "Ada", mark: 85 },
      { name: "Bob", mark: 90 },
    ]);
  });
});
