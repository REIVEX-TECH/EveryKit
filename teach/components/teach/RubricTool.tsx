"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { tablePdf } from "@/lib/teach/pdfTable";
import { saveBlob } from "@/lib/teach/download";
import { Field, Input, Note, useTake } from "./ui";

const CELL =
  "w-full rounded-[8px] border border-line bg-background px-2 py-1.5 text-[14px] outline-none focus:border-primary";

export function RubricTool() {
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState<string[]>(["Understanding", "Presentation"]);
  const [levels, setLevels] = useState<string[]>(["Excellent", "Good", "Needs work"]);
  const [points, setPoints] = useState<number[][]>([
    [4, 2, 0],
    [4, 2, 0],
  ]);
  const { take, gate } = useTake("Download");

  function setCriterion(i: number, value: string) {
    setCriteria(criteria.map((c, j) => (j === i ? value : c)));
  }
  function setLevel(i: number, value: string) {
    setLevels(levels.map((l, j) => (j === i ? value : l)));
  }
  function setCell(r: number, c: number, value: string) {
    const n = Number.parseFloat(value);
    setPoints(points.map((row, i) => (i === r ? row.map((v, j) => (j === c ? (Number.isFinite(n) ? n : 0) : v)) : row)));
  }
  function addCriterion() {
    setCriteria([...criteria, ""]);
    setPoints([...points, levels.map(() => 0)]);
  }
  function removeCriterion(i: number) {
    if (criteria.length === 1) return;
    setCriteria(criteria.filter((_, j) => j !== i));
    setPoints(points.filter((_, j) => j !== i));
  }
  function addLevel() {
    setLevels([...levels, ""]);
    setPoints(points.map((row) => [...row, 0]));
  }
  function removeLevel(i: number) {
    if (levels.length === 1) return;
    setLevels(levels.filter((_, j) => j !== i));
    setPoints(points.map((row) => row.filter((_, j) => j !== i)));
  }

  const rowTotals = points.map((row) => row.reduce((s, v) => s + v, 0));
  const total = rowTotals.reduce((s, v) => s + v, 0);

  async function exportPdf() {
    const blob = await tablePdf({
      title: title.trim() || "Grading rubric",
      subtitle: [`Total points: ${total}`],
      landscape: true,
      headers: ["Criterion", ...levels.map((l, i) => l || `Level ${i + 1}`), "Max"],
      rows: criteria.map((c, r) => [c || `Criterion ${r + 1}`, ...points[r], rowTotals[r]]),
    });
    saveBlob(blob, "rubric.pdf");
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="Rubric title" htmlFor="title">
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Essay rubric" />
      </Field>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="p-1 text-left text-[12px] text-text-light">Criterion</th>
              {levels.map((l, i) => (
                <th key={i} className="p-1">
                  <div className="flex items-center gap-1">
                    <input
                      aria-label={`Level ${i + 1} name`}
                      value={l}
                      onChange={(e) => setLevel(i, e.target.value)}
                      placeholder={`Level ${i + 1}`}
                      className={`${CELL} min-w-[90px]`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLevel(i)}
                      aria-label={`Remove level ${i + 1}`}
                      className="shrink-0 text-text-light hover:text-danger"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-1 text-[12px] text-text-light">Max</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, r) => (
              <tr key={r} className="border-t border-line">
                <td className="p-1">
                  <div className="flex items-center gap-1">
                    <input
                      aria-label={`Criterion ${r + 1} name`}
                      value={c}
                      onChange={(e) => setCriterion(r, e.target.value)}
                      placeholder={`Criterion ${r + 1}`}
                      className={`${CELL} min-w-[130px]`}
                    />
                    <button
                      type="button"
                      onClick={() => removeCriterion(r)}
                      aria-label={`Remove criterion ${r + 1}`}
                      className="shrink-0 text-text-light hover:text-danger"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                {points[r].map((v, cIdx) => (
                  <td key={cIdx} className="p-1">
                    <input
                      aria-label={`${c || `Criterion ${r + 1}`}, ${levels[cIdx] || `level ${cIdx + 1}`} points`}
                      type="number"
                      value={v}
                      onChange={(e) => setCell(r, cIdx, e.target.value)}
                      className={`${CELL} w-16 text-center`}
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-semibold tabular-nums">{rowTotals[r]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={addCriterion} className="ek-btn ek-btn-quiet">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add criterion
        </button>
        <button type="button" onClick={addLevel} className="ek-btn ek-btn-quiet">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add level
        </button>
        <span className="ml-auto text-[14px] text-text-light">Total {total} points</span>
      </div>

      <div>
        <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-accent">
          Download PDF
        </button>
        {gate}
      </div>

      <Note tone="quiet">The rubric is drawn on your device. Nothing is uploaded.</Note>
    </div>
  );
}
