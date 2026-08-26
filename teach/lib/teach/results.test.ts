import { describe, expect, it } from "vitest";
import { parseResultTable, resultTotals } from "./results";
import { letterFor, DEFAULT_SCALE } from "./gradebook";

describe("parseResultTable", () => {
  it("reads a header of subjects and a row per student", () => {
    const text = "Name,Maths,Science,English\nAda,80,90,70\nGrace,60,50,55";
    const table = parseResultTable(text);
    expect(table.subjects).toEqual(["Maths", "Science", "English"]);
    expect(table.students).toEqual([
      { name: "Ada", marks: [80, 90, 70] },
      { name: "Grace", marks: [60, 50, 55] },
    ]);
  });

  it("treats a blank or non-numeric mark as not marked, and quotes a name with a comma", () => {
    const text = 'Name,Maths,Science\n"Lovelace, Ada",,88\nGrace,abc,50';
    const table = parseResultTable(text);
    expect(table.students).toEqual([
      { name: "Lovelace, Ada", marks: [null, 88] },
      { name: "Grace", marks: [null, 50] },
    ]);
  });

  it("skips rows with no name and drops fully blank lines", () => {
    const text = "Name,Maths\nAda,80\n\n,55\nGrace,60";
    const table = parseResultTable(text);
    expect(table.students.map((s) => s.name)).toEqual(["Ada", "Grace"]);
  });

  it("returns empty structures for empty input", () => {
    expect(parseResultTable("")).toEqual({ subjects: [], students: [] });
  });
});

describe("resultTotals", () => {
  it("totals the marks and works the percentage over the possible", () => {
    expect(resultTotals([80, 90, 70], 100)).toEqual({ total: 240, possible: 300, percentage: 80 });
  });

  it("excludes a blank from both the total and the possible", () => {
    // 80 + 60 over two subjects of 100, not three: 140 / 200 = 70 percent.
    expect(resultTotals([80, null, 60], 100)).toEqual({ total: 140, possible: 200, percentage: 70 });
  });

  it("respects a maximum other than 100", () => {
    expect(resultTotals([40, 30], 50)).toEqual({ total: 70, possible: 100, percentage: 70 });
  });

  it("gives a null percentage when nothing is marked", () => {
    expect(resultTotals([null, null], 100)).toEqual({ total: 0, possible: 0, percentage: null });
  });

  it("maps the percentage to a grade on the default scale", () => {
    expect(letterFor(resultTotals([80, 90, 70], 100).percentage, DEFAULT_SCALE)).toBe("B");
    expect(letterFor(resultTotals([95, 92, 91], 100).percentage, DEFAULT_SCALE)).toBe("A");
  });
});
