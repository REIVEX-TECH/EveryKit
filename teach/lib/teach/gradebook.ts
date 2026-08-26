/**
 * The maths behind the gradebook: weighted totals, letter grades and the class
 * summary. Pure, so the tool shows the working and the tests pin it.
 */

export type Assessment = { name: string; max: number; weight: number };
export type GradeBand = { grade: string; min: number };

export const DEFAULT_SCALE: GradeBand[] = [
  { grade: "A", min: 90 },
  { grade: "B", min: 80 },
  { grade: "C", min: 70 },
  { grade: "D", min: 60 },
  { grade: "F", min: 0 },
];

/**
 * A student's weighted total, as a percentage, or null if nothing is marked.
 *
 * Each score is taken as a share of its assessment's maximum, multiplied by its
 * weight; the weighted shares are summed and divided by the total weight of the
 * assessments that were actually marked. A blank (null) score is left out
 * rather than counted as a zero, so a total reflects the work done so far.
 */
export function weightedTotal(scores: Array<number | null>, assessments: Assessment[]): number | null {
  let weighted = 0;
  let totalWeight = 0;
  assessments.forEach((assessment, i) => {
    const score = scores[i];
    if (score === null || score === undefined || assessment.max <= 0 || assessment.weight <= 0) return;
    weighted += (score / assessment.max) * assessment.weight;
    totalWeight += assessment.weight;
  });
  return totalWeight === 0 ? null : (weighted / totalWeight) * 100;
}

/** The letter for a percentage against a scale, high to low. */
export function letterFor(pct: number | null, scale: GradeBand[]): string {
  if (pct === null) return "—";
  const ordered = [...scale].sort((a, b) => b.min - a.min);
  for (const band of ordered) {
    if (pct >= band.min) return band.grade;
  }
  return ordered[ordered.length - 1]?.grade ?? "F";
}

/** The class average, highest and lowest across the marked totals. */
export function classSummary(totals: Array<number | null>): { average: number | null; high: number | null; low: number | null } {
  const marked = totals.filter((t): t is number => t !== null);
  if (marked.length === 0) return { average: null, high: null, low: null };
  const average = marked.reduce((s, t) => s + t, 0) / marked.length;
  return { average, high: Math.max(...marked), low: Math.min(...marked) };
}
