"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  GRADE_POINTS,
  calculateGpa,
  emptyCourse,
  formatGpa,
  nearestLetter,
  type Course,
  type Scale,
} from "@/lib/study/gpa";
import { CopyButton, Note } from "./ui";

/**
 * The GPA calculator.
 *
 * Rows are held as the strings that were typed rather than as numbers, so a
 * half-finished "1." does not vanish under the cursor the moment it fails to
 * parse. The arithmetic reads those strings and says what it could not use.
 */
export function GpaTool() {
  const [scale, setScale] = useState<Scale>("letter");
  const [courses, setCourses] = useState<Course[]>([
    emptyCourse("1"),
    emptyCourse("2"),
    emptyCourse("3"),
  ]);

  const result = useMemo(() => calculateGpa(courses, scale), [courses, scale]);
  const problems = new Map(result.problems.map((p) => [p.id, p.message]));

  const update = (id: string, patch: Partial<Course>) =>
    setCourses((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    setCourses((rows) => [...rows, emptyCourse(String(Date.now() + rows.length))]);

  const removeRow = (id: string) =>
    setCourses((rows) => (rows.length === 1 ? rows : rows.filter((row) => row.id !== id)));

  const summary = result.gpa === null
    ? ""
    : `GPA ${formatGpa(result.gpa)} across ${result.totalCredits} credits`;

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-[14px] font-semibold">Grades are</legend>
        <div className="mt-2 flex gap-2">
          {(["letter", "percentage"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={scale === value}
              onClick={() => setScale(value)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                scale === value
                  ? "bg-primary-dark text-white"
                  : "border border-line bg-background hover:border-line-strong"
              }`}
            >
              {value === "letter" ? "Letters" : "Percentages"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        {courses.map((row, index) => (
          <div key={row.id} className="ek-card p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[160px] flex-1">
                <label htmlFor={`name-${row.id}`} className="block text-[13px] font-semibold">
                  Course {index + 1}
                  <span className="ml-1 font-normal text-text-light">optional</span>
                </label>
                <input
                  id={`name-${row.id}`}
                  value={row.name}
                  onChange={(event) => update(row.id, { name: event.target.value })}
                  placeholder="Calculus"
                  className="mt-1.5 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
                />
              </div>

              <div className="w-24">
                <label htmlFor={`credits-${row.id}`} className="block text-[13px] font-semibold">
                  Credits
                </label>
                <input
                  id={`credits-${row.id}`}
                  value={row.credits}
                  onChange={(event) => update(row.id, { credits: event.target.value })}
                  inputMode="decimal"
                  placeholder="3"
                  className="mt-1.5 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
                />
              </div>

              <div className="w-32">
                <label htmlFor={`grade-${row.id}`} className="block text-[13px] font-semibold">
                  Grade
                </label>
                {scale === "letter" ? (
                  <select
                    id={`grade-${row.id}`}
                    value={row.grade}
                    onChange={(event) => update(row.id, { grade: event.target.value })}
                    className="mt-1.5 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
                  >
                    <option value="">Pick one</option>
                    {GRADE_POINTS.map((option) => (
                      <option key={option.letter} value={option.letter}>
                        {option.letter} ({option.points.toFixed(1)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`grade-${row.id}`}
                    value={row.grade}
                    onChange={(event) => update(row.id, { grade: event.target.value })}
                    inputMode="decimal"
                    placeholder="88"
                    className="mt-1.5 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={courses.length === 1}
                aria-label={`Remove course ${index + 1}`}
                className="ek-btn ek-btn-quiet px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {problems.has(row.id) ? (
              <p className="mt-2 text-[13px] text-warn">{problems.get(row.id)}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <button type="button" onClick={addRow} className="ek-btn ek-btn-quiet">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add a course
        </button>
      </div>

      <div className="ek-card bg-bg-soft p-5">
        {result.gpa === null ? (
          <Note tone="quiet">Add a course with credits and a grade to see your GPA.</Note>
        ) : (
          <>
            <p className="text-[13px] text-text-light">Weighted GPA</p>
            <p className="mt-1 text-[44px] font-semibold leading-none tabular-nums">
              {formatGpa(result.gpa)}
            </p>
            <p className="mt-2 text-[14px] text-text-light">
              {result.counted} course{result.counted === 1 ? "" : "s"}, {result.totalCredits}{" "}
              credits, closest to a {nearestLetter(result.gpa)}.
            </p>
            <div className="mt-4">
              <CopyButton text={summary} label="Copy the result" />
            </div>
          </>
        )}
      </div>

      <p className="text-[13px] text-text-light">
        Weighted by credits, which is what a transcript does: a four credit course moves your GPA
        four times as much as a one credit one. The scale here is the common United States four
        point one, where an A is 4.0 and an A minus is 3.7. Institutions differ, so check yours
        against the list in the grade menu.
      </p>
    </div>
  );
}
