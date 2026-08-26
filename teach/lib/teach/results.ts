/**
 * Turning a roster of marks into result slips: the parsing and the arithmetic,
 * apart from the layout. Pure and tested, because a percentage printed on a
 * child's report card is not a place for a quiet rounding bug.
 */

import { parseCsv } from "./csv";

export type ResultRow = { name: string; marks: Array<number | null> };
export type ResultTable = { subjects: string[]; students: ResultRow[] };

/**
 * Read a pasted or uploaded table into subjects and per-student marks.
 *
 * The first row is the header: its first cell is the name column (whatever it
 * is labelled) and the rest name the subjects. Every later row is a student,
 * their name first and a mark per subject after. A blank or non-numeric mark
 * becomes null, which means "not marked" rather than zero, so an empty cell does
 * not silently drag a total down.
 */
export function parseResultTable(text: string): ResultTable {
  const rows = parseCsv(text);
  if (rows.length === 0) return { subjects: [], students: [] };

  const header = rows[0];
  const subjects = header.slice(1).map((s) => s.trim()).filter((s) => s !== "");

  const students: ResultRow[] = [];
  for (const row of rows.slice(1)) {
    const name = (row[0] ?? "").trim();
    if (name === "") continue;
    const marks = subjects.map((_, i) => {
      const cell = (row[i + 1] ?? "").trim();
      if (cell === "") return null;
      const value = Number(cell);
      return Number.isFinite(value) ? value : null;
    });
    students.push({ name, marks });
  }
  return { subjects, students };
}

export type ResultTotals = { total: number; possible: number; percentage: number | null };

/**
 * A student's total, the possible total and the percentage.
 *
 * Every subject is out of the same maximum. A blank mark is left out of both the
 * total and the possible, so a percentage is over the subjects actually marked,
 * the same way the gradebook treats a blank. If nothing is marked the percentage
 * is null rather than a division by zero.
 */
export function resultTotals(marks: Array<number | null>, max: number): ResultTotals {
  let total = 0;
  let counted = 0;
  for (const mark of marks) {
    if (mark === null) continue;
    total += mark;
    counted += 1;
  }
  const possible = counted * max;
  const percentage = possible > 0 ? (total / possible) * 100 : null;
  return { total, possible, percentage };
}
