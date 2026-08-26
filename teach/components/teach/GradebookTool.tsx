"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  DEFAULT_SCALE,
  classSummary,
  letterFor,
  weightedTotal,
  type Assessment,
  type GradeBand,
} from "@/lib/teach/gradebook";
import { toCsv } from "@/lib/teach/csv";
import { DownloadButton, Note } from "./ui";

type Student = { name: string; scores: Array<number | null> };

const FIELD =
  "w-full rounded-[8px] border border-line bg-background px-2 py-1.5 text-[14px] outline-none focus:border-primary";

let sid = 0;

export function GradebookTool() {
  const [assessments, setAssessments] = useState<Assessment[]>([
    { name: "Assignment 1", max: 100, weight: 50 },
    { name: "Final", max: 100, weight: 50 },
  ]);
  const [students, setStudents] = useState<Array<Student & { id: number }>>([
    { id: ++sid, name: "", scores: [null, null] },
  ]);
  const [scale, setScale] = useState<GradeBand[]>(DEFAULT_SCALE);

  const totals = useMemo(
    () => students.map((s) => weightedTotal(s.scores, assessments)),
    [students, assessments],
  );
  const summary = useMemo(() => classSummary(totals), [totals]);

  function addAssessment() {
    setAssessments((a) => [...a, { name: `Item ${a.length + 1}`, max: 100, weight: 10 }]);
    setStudents((list) => list.map((s) => ({ ...s, scores: [...s.scores, null] })));
  }
  function removeAssessment(index: number) {
    setAssessments((a) => a.filter((_, i) => i !== index));
    setStudents((list) => list.map((s) => ({ ...s, scores: s.scores.filter((_, i) => i !== index) })));
  }
  function setAssessment(index: number, patch: Partial<Assessment>) {
    setAssessments((a) => a.map((x, i) => (i === index ? { ...x, ...patch } : x)));
  }

  function addStudent() {
    setStudents((list) => [...list, { id: ++sid, name: "", scores: assessments.map(() => null) }]);
  }
  function setName(id: number, name: string) {
    setStudents((list) => list.map((s) => (s.id === id ? { ...s, name } : s)));
  }
  function setScore(id: number, index: number, value: string) {
    const num = value.trim() === "" ? null : Number.parseFloat(value);
    setStudents((list) =>
      list.map((s) =>
        s.id === id
          ? { ...s, scores: s.scores.map((v, i) => (i === index ? (Number.isFinite(num) ? num : null) : v)) }
          : s,
      ),
    );
  }
  function removeStudent(id: number) {
    setStudents((list) => (list.length === 1 ? list : list.filter((s) => s.id !== id)));
  }

  const csv = () => {
    const header = ["Name", ...assessments.map((a) => a.name), "Total %", "Grade"];
    const rows = students.map((s, r) => {
      const total = totals[r];
      return [
        s.name,
        ...s.scores.map((v) => (v === null ? "" : v)),
        total === null ? "" : Math.round(total * 10) / 10,
        letterFor(total, scale),
      ];
    });
    return toCsv([header, ...rows]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Assessments */}
      <div className="ek-card p-4">
        <h2 className="text-[15px] font-semibold">Assessments</h2>
        <div className="mt-3 flex flex-col gap-2">
          {assessments.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                aria-label={`Assessment ${i + 1} name`}
                value={a.name}
                onChange={(e) => setAssessment(i, { name: e.target.value })}
                className={`${FIELD} flex-[2]`}
              />
              <label className="flex items-center gap-1 text-[12px] text-text-light">
                out of
                <input
                  aria-label={`Assessment ${i + 1} maximum`}
                  type="number"
                  min={1}
                  value={a.max}
                  onChange={(e) => setAssessment(i, { max: Number.parseFloat(e.target.value) || 0 })}
                  className={`${FIELD} w-16`}
                />
              </label>
              <label className="flex items-center gap-1 text-[12px] text-text-light">
                weight
                <input
                  aria-label={`Assessment ${i + 1} weight`}
                  type="number"
                  min={0}
                  value={a.weight}
                  onChange={(e) => setAssessment(i, { weight: Number.parseFloat(e.target.value) || 0 })}
                  className={`${FIELD} w-16`}
                />
              </label>
              <button
                type="button"
                onClick={() => removeAssessment(i)}
                aria-label={`Remove ${a.name}`}
                className="ek-btn ek-btn-quiet h-8 w-8 shrink-0 justify-center p-0"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addAssessment} className="ek-btn ek-btn-quiet mt-3">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add assessment
        </button>
      </div>

      {/* Students table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[14px]">
          <thead>
            <tr className="text-left text-[12px] text-text-light">
              <th className="p-2">Student</th>
              {assessments.map((a, i) => (
                <th key={i} className="p-2 text-center">
                  {a.name}
                </th>
              ))}
              <th className="p-2 text-center">Total</th>
              <th className="p-2 text-center">Grade</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {students.map((s, r) => {
              const total = totals[r];
              return (
                <tr key={s.id} className="border-t border-line">
                  <td className="p-1">
                    <input
                      aria-label={`Student ${r + 1} name`}
                      value={s.name}
                      onChange={(e) => setName(s.id, e.target.value)}
                      placeholder="Name"
                      className={`${FIELD} min-w-[120px]`}
                    />
                  </td>
                  {s.scores.map((v, i) => (
                    <td key={i} className="p-1">
                      <input
                        aria-label={`${s.name || `Student ${r + 1}`} ${assessments[i].name}`}
                        type="number"
                        value={v ?? ""}
                        onChange={(e) => setScore(s.id, i, e.target.value)}
                        className={`${FIELD} w-16 text-center`}
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center tabular-nums">
                    {total === null ? "—" : `${Math.round(total * 10) / 10}%`}
                  </td>
                  <td className="p-2 text-center font-semibold">{letterFor(total, scale)}</td>
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => removeStudent(s.id)}
                      aria-label={`Remove student ${r + 1}`}
                      className="ek-btn ek-btn-quiet h-8 w-8 justify-center p-0"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={addStudent} className="ek-btn ek-btn-quiet">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add student
        </button>
        <span className="text-[14px] text-text-light">
          {summary.average === null
            ? "No marks yet"
            : `Class average ${Math.round(summary.average * 10) / 10}%, high ${Math.round(summary.high! * 10) / 10}%, low ${Math.round(summary.low! * 10) / 10}%`}
        </span>
      </div>

      <ScaleEditor scale={scale} onChange={setScale} />

      <div>
        <DownloadButton
          build={() => new Blob([csv()], { type: "text/csv" })}
          filename="gradebook.csv"
          label="Download CSV"
          className="ek-btn ek-btn-accent"
        />
      </div>

      <Note tone="quiet">
        Nothing is uploaded. Your students&apos; names and their scores are worked on in this page
        and are gone when you close the tab.
      </Note>
    </div>
  );
}

function ScaleEditor({ scale, onChange }: { scale: GradeBand[]; onChange: (s: GradeBand[]) => void }) {
  return (
    <details className="ek-card p-4">
      <summary className="cursor-pointer text-[14px] font-semibold">Grade scale</summary>
      <p className="mt-2 text-[13px] text-text-light">
        The lowest percentage that earns each letter. A 90 is not an A everywhere, so set the cutoffs
        your marking uses.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {scale.map((band, i) => (
          <label key={i} className="flex items-center gap-1 text-[13px]">
            <input
              aria-label={`${band.grade} label`}
              value={band.grade}
              onChange={(e) => onChange(scale.map((b, j) => (j === i ? { ...b, grade: e.target.value } : b)))}
              className={`${FIELD} w-14 text-center`}
            />
            <span className="text-text-light">≥</span>
            <input
              aria-label={`${band.grade} minimum`}
              type="number"
              value={band.min}
              onChange={(e) =>
                onChange(scale.map((b, j) => (j === i ? { ...b, min: Number.parseFloat(e.target.value) || 0 } : b)))
              }
              className={`${FIELD} w-16`}
            />
          </label>
        ))}
      </div>
    </details>
  );
}
