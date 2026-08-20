/**
 * GPA, on the four point scale and from percentages.
 *
 * The arithmetic is a weighted mean: every course contributes its grade point
 * multiplied by its credits, and the total is divided by the credits rather
 * than by the number of courses. That distinction is the whole calculator. A
 * plain average of grades tells a student with a one credit elective and a four
 * credit core course something that is simply not their GPA.
 *
 * The scale below is the common United States one. Institutions differ, some
 * cap at 4.0 with no A plus, some run to 4.3, and a few use a different mapping
 * entirely. The page says which one this is rather than presenting it as the
 * only one there is.
 */

export type Scale = "letter" | "percentage";

export type Course = {
  id: string;
  /** Optional. A row without a name still counts. */
  name: string;
  /** As typed, so a half-finished number does not vanish under the cursor. */
  credits: string;
  /** A letter when the scale is letters, a percentage when it is percentages. */
  grade: string;
};

export type GradeOption = { letter: string; points: number };

/** The mapping this calculator uses, stated on the page as well as here. */
export const GRADE_POINTS: GradeOption[] = [
  { letter: "A+", points: 4.0 },
  { letter: "A", points: 4.0 },
  { letter: "A-", points: 3.7 },
  { letter: "B+", points: 3.3 },
  { letter: "B", points: 3.0 },
  { letter: "B-", points: 2.7 },
  { letter: "C+", points: 2.3 },
  { letter: "C", points: 2.0 },
  { letter: "C-", points: 1.7 },
  { letter: "D+", points: 1.3 },
  { letter: "D", points: 1.0 },
  { letter: "D-", points: 0.7 },
  { letter: "F", points: 0.0 },
];

const POINTS_BY_LETTER = new Map(GRADE_POINTS.map((g) => [g.letter, g.points]));

/**
 * A percentage, turned into grade points.
 *
 * The usual United States bands. The boundaries are inclusive at the bottom, so
 * exactly 90 is an A minus rather than a B plus, which is the way every syllabus
 * that uses these bands writes them.
 */
export function pointsFromPercentage(percentage: number): number {
  if (percentage >= 97) return 4.0;
  if (percentage >= 93) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 87) return 3.3;
  if (percentage >= 83) return 3.0;
  if (percentage >= 80) return 2.7;
  if (percentage >= 77) return 2.3;
  if (percentage >= 73) return 2.0;
  if (percentage >= 70) return 1.7;
  if (percentage >= 67) return 1.3;
  if (percentage >= 63) return 1.0;
  if (percentage >= 60) return 0.7;
  return 0.0;
}

export type RowProblem = { id: string; message: string };

export type GpaResult = {
  /** Null when nothing can be worked out yet. */
  gpa: number | null;
  totalCredits: number;
  totalPoints: number;
  /** Courses that counted towards the answer. */
  counted: number;
  problems: RowProblem[];
};

/** A number as typed, or null when it is not one. */
function parseNumber(raw: string): number | null {
  const text = raw.trim();
  if (text === "") return null;
  if (!/^\d*\.?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * The weighted GPA, and a friendly message for every row that cannot count.
 *
 * A row that is entirely empty is not a problem: it is a row somebody has not
 * filled in yet, and shouting at them for it while they type is hostile. A row
 * with a grade and no credits, or with zero credits, is a problem, because it
 * looks like it should count and silently does not.
 */
export function calculateGpa(courses: Course[], scale: Scale): GpaResult {
  let totalPoints = 0;
  let totalCredits = 0;
  let counted = 0;
  const problems: RowProblem[] = [];

  for (const course of courses) {
    const blank = course.credits.trim() === "" && course.grade.trim() === "";
    if (blank) continue;

    const credits = parseNumber(course.credits);
    if (credits === null) {
      problems.push({
        id: course.id,
        message: "Add the number of credits for this course.",
      });
      continue;
    }
    if (credits <= 0) {
      // Zero credits would contribute nothing and divide by nothing, so the
      // row would vanish from the answer without saying why.
      problems.push({
        id: course.id,
        message: "Credits have to be more than zero, or the course cannot count towards a GPA.",
      });
      continue;
    }
    if (credits > 30) {
      problems.push({ id: course.id, message: "That is more credits than any one course carries." });
      continue;
    }

    let points: number | null = null;
    if (scale === "letter") {
      const letter = course.grade.trim().toUpperCase();
      points = POINTS_BY_LETTER.get(letter) ?? null;
      if (points === null) {
        problems.push({ id: course.id, message: "Pick a grade for this course." });
        continue;
      }
    } else {
      const percentage = parseNumber(course.grade);
      if (percentage === null) {
        problems.push({ id: course.id, message: "Add a percentage for this course." });
        continue;
      }
      if (percentage > 100) {
        problems.push({ id: course.id, message: "A percentage cannot be above 100." });
        continue;
      }
      points = pointsFromPercentage(percentage);
    }

    totalPoints += points * credits;
    totalCredits += credits;
    counted += 1;
  }

  return {
    gpa: totalCredits > 0 ? totalPoints / totalCredits : null,
    totalCredits,
    totalPoints,
    counted,
    problems,
  };
}

/** Two decimal places, which is how every transcript prints it. */
export function formatGpa(gpa: number): string {
  return gpa.toFixed(2);
}

/** The nearest letter to a GPA, for the line under the number. */
export function nearestLetter(gpa: number): string {
  let best = GRADE_POINTS[GRADE_POINTS.length - 1];
  let distance = Infinity;
  // Walked from the bottom so a tie lands on the lower letter, which is the
  // honest direction to round a grade.
  for (let i = GRADE_POINTS.length - 1; i >= 0; i--) {
    const gap = Math.abs(GRADE_POINTS[i].points - gpa);
    if (gap < distance) {
      distance = gap;
      best = GRADE_POINTS[i];
    }
  }
  return best.letter;
}

export function emptyCourse(id: string): Course {
  return { id, name: "", credits: "", grade: "" };
}
