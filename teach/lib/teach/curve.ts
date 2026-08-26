/**
 * The maths behind the grade-curve tool.
 *
 * Curving is a policy choice, not a formula, so this file does not decide
 * anything: it computes the statistics, the z-scores and the percentiles, and
 * assigns grades by whichever method and cutoffs the teacher chose. Every piece
 * is a pure function so the tool can show its working and the tests can pin it.
 */

import { parseCsv } from "./csv";

export type Student = { name: string; mark: number };

/**
 * Read a list of names and marks from pasted text or an uploaded CSV.
 *
 * Accepts "Name, Mark" rows and a plain column of marks alike. A row whose last
 * field is not a number (a header like "Name,Mark", or a blank) is skipped. A
 * name that itself contains a comma survives if it was quoted, because the CSV
 * reader handles that. A row with only a mark is given a placeholder name.
 */
export function parseMarks(text: string): Student[] {
  const rows = parseCsv(text);
  const students: Student[] = [];
  for (const row of rows) {
    const markField = row[row.length - 1].trim();
    const mark = Number.parseFloat(markField);
    if (!Number.isFinite(mark)) continue; // header, blank, or non-numeric
    const name =
      row.length >= 2 ? row.slice(0, -1).join(", ").trim() : "";
    students.push({ name: name || `Student ${students.length + 1}`, mark });
  }
  return students;
}

export type Stats = {
  count: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
};

/** Descriptive statistics. Standard deviation is the population one (÷ n). */
export function stats(marks: number[]): Stats {
  const count = marks.length;
  if (count === 0) return { count: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 };
  const sorted = [...marks].sort((a, b) => a - b);
  const mean = marks.reduce((s, m) => s + m, 0) / count;
  const median =
    count % 2 === 1
      ? sorted[(count - 1) / 2]
      : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
  const variance = marks.reduce((s, m) => s + (m - mean) ** 2, 0) / count;
  return { count, mean, median, sd: Math.sqrt(variance), min: sorted[0], max: sorted[count - 1] };
}

/** How many standard deviations above (positive) or below the mean a mark is. */
export function zScore(mark: number, mean: number, sd: number): number {
  return sd === 0 ? 0 : (mark - mean) / sd;
}

/**
 * Percentile rank: the share of the class at or below this mark, 0 to 100.
 * Uses the "cumulative frequency including ties" convention, so the top mark is
 * 100 and everyone with the same mark shares a percentile.
 */
export function percentile(mark: number, marks: number[]): number {
  const atOrBelow = marks.filter((m) => m <= mark).length;
  return (atOrBelow / marks.length) * 100;
}

/** A histogram of marks into `bins` equal-width buckets across the range. */
export function histogram(marks: number[], bins = 10): Array<{ from: number; to: number; count: number }> {
  if (marks.length === 0) return [];
  const min = Math.min(...marks);
  const max = Math.max(...marks);
  const width = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }));
  for (const mark of marks) {
    let index = Math.floor((mark - min) / width);
    if (index >= bins) index = bins - 1; // the max lands in the last bucket
    if (index < 0) index = 0;
    buckets[index].count += 1;
  }
  return buckets;
}

export type ZBand = { grade: string; minZ: number };

export const DEFAULT_Z_BANDS: ZBand[] = [
  { grade: "A", minZ: 1 },
  { grade: "B", minZ: 0 },
  { grade: "C", minZ: -1 },
  { grade: "D", minZ: -2 },
  { grade: "F", minZ: Number.NEGATIVE_INFINITY },
];

/** The grade for a z-score: the first band, high to low, whose floor it clears. */
export function gradeByZ(z: number, bands: ZBand[]): string {
  const ordered = [...bands].sort((a, b) => b.minZ - a.minZ);
  for (const band of ordered) {
    if (z >= band.minZ) return band.grade;
  }
  return ordered[ordered.length - 1]?.grade ?? "F";
}

export type Quota = { grade: string; pct: number };

export const DEFAULT_QUOTAS: Quota[] = [
  { grade: "A", pct: 15 },
  { grade: "B", pct: 35 },
  { grade: "C", pct: 35 },
  { grade: "D", pct: 10 },
  { grade: "F", pct: 5 },
];

/**
 * Assign grades by percentile quota: the top `pct`% by mark get the first
 * grade, the next slice the second, and so on. Returns a grade per student in
 * the SAME order as the input.
 */
export function gradesByQuota(students: Student[], quotas: Quota[]): string[] {
  const n = students.length;
  const order = students
    .map((s, i) => ({ i, mark: s.mark }))
    .sort((a, b) => b.mark - a.mark);
  const grades = new Array<string>(n).fill(quotas[quotas.length - 1]?.grade ?? "F");
  let placed = 0;
  for (const quota of quotas) {
    const take = Math.round((quota.pct / 100) * n);
    for (let k = 0; k < take && placed < n; k += 1) {
      grades[order[placed].i] = quota.grade;
      placed += 1;
    }
  }
  // Any remainder from rounding falls to the last grade already filled in.
  return grades;
}

/**
 * Linear scale-up: multiply every mark so the top becomes `target` (default
 * 100), capped at `target`. A gentle curve that lifts everyone by the same
 * proportion rather than re-ranking them.
 */
export function linearScale(marks: number[], target = 100): number[] {
  const max = Math.max(...marks, 0);
  if (max === 0) return marks.map(() => 0);
  const factor = target / max;
  return marks.map((m) => Math.min(target, Math.round(m * factor * 10) / 10));
}

export type PercentBand = { grade: string; min: number };

export const DEFAULT_PERCENT_SCALE: PercentBand[] = [
  { grade: "A", min: 90 },
  { grade: "B", min: 80 },
  { grade: "C", min: 70 },
  { grade: "D", min: 60 },
  { grade: "F", min: 0 },
];

/** The grade for a percentage mark against a scale, high to low. */
export function gradeByPercent(mark: number, scale: PercentBand[]): string {
  const ordered = [...scale].sort((a, b) => b.min - a.min);
  for (const band of ordered) {
    if (mark >= band.min) return band.grade;
  }
  return ordered[ordered.length - 1]?.grade ?? "F";
}

/** Count how many students landed in each grade, in a fixed grade order. */
export function gradeCounts(grades: string[], order: string[]): Array<{ grade: string; count: number }> {
  return order.map((grade) => ({ grade, count: grades.filter((g) => g === grade).length }));
}
