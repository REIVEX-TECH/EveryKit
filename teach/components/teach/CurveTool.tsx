"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import {
  DEFAULT_PERCENT_SCALE,
  DEFAULT_QUOTAS,
  DEFAULT_Z_BANDS,
  gradeByPercent,
  gradeByZ,
  gradeCounts,
  gradesByQuota,
  histogram,
  linearScale,
  parseMarks,
  percentile,
  stats,
  zScore,
  type Quota,
  type ZBand,
} from "@/lib/teach/curve";
import { toCsv } from "@/lib/teach/csv";
import { tablePdf } from "@/lib/teach/pdfTable";
import { saveBlob } from "@/lib/teach/download";
import { CopyButton, Field, Note, TextBox, useTake } from "./ui";

type Method = "z" | "percentile" | "linear";
const GRADE_ORDER = ["A", "B", "C", "D", "F"];

const FIELD =
  "w-full rounded-[8px] border border-line bg-background px-2 py-1.5 text-[14px] outline-none focus:border-primary";

export function CurveTool() {
  const [text, setText] = useState("");
  const [method, setMethod] = useState<Method>("z");
  const [zBands, setZBands] = useState<ZBand[]>(DEFAULT_Z_BANDS);
  const [quotas, setQuotas] = useState<Quota[]>(DEFAULT_QUOTAS);
  const [target, setTarget] = useState(100);

  const students = useMemo(() => parseMarks(text), [text]);
  const marks = useMemo(() => students.map((s) => s.mark), [students]);
  const st = useMemo(() => stats(marks), [marks]);
  const bars = useMemo(() => histogram(marks, 10), [marks]);
  const maxBar = Math.max(1, ...bars.map((b) => b.count));

  const rows = useMemo(() => {
    if (students.length === 0) return [];
    const quotaGrades = method === "percentile" ? gradesByQuota(students, quotas) : [];
    const scaled = method === "linear" ? linearScale(marks, target) : [];
    return students.map((s, i) => {
      const z = zScore(s.mark, st.mean, st.sd);
      const pct = percentile(s.mark, marks);
      let grade = "";
      let metric = "";
      if (method === "z") {
        grade = gradeByZ(z, zBands);
        metric = z.toFixed(2);
      } else if (method === "percentile") {
        grade = quotaGrades[i];
        metric = `${Math.round(pct)}%`;
      } else {
        grade = gradeByPercent(scaled[i], DEFAULT_PERCENT_SCALE);
        metric = `${scaled[i]}`;
      }
      return { name: s.name, mark: s.mark, metric, grade };
    });
  }, [students, marks, st, method, zBands, quotas, target]);

  const counts = useMemo(() => gradeCounts(rows.map((r) => r.grade), GRADE_ORDER), [rows]);
  const metricLabel = method === "z" ? "z-score" : method === "percentile" ? "Percentile" : "Scaled mark";

  const { take, gate } = useTake("Download");

  function onFile(file: File | undefined) {
    if (!file) return;
    void file.text().then(setText);
  }

  function csvRows(): Array<Array<string | number>> {
    return [
      ["Name", "Raw mark", metricLabel, "Grade"],
      ...rows.map((r) => [r.name, r.mark, r.metric, r.grade]),
    ];
  }
  function exportCsv() {
    saveBlob(new Blob([toCsv(csvRows())], { type: "text/csv" }), "curved-grades.csv");
  }
  async function exportPdf() {
    const blob = await tablePdf({
      title: "Curved grades",
      subtitle: [
        `Method: ${method === "z" ? "standard-deviation bands" : method === "percentile" ? "percentile quotas" : "linear scale-up"}. Curving is a policy choice; check it against your institution's rules.`,
        `Count ${st.count}, mean ${st.mean.toFixed(1)}, median ${st.median.toFixed(1)}, sd ${st.sd.toFixed(2)}, min ${st.min}, max ${st.max}.`,
      ],
      headers: ["Name", "Raw mark", metricLabel, "Grade"],
      rows: rows.map((r) => [r.name, r.mark, r.metric, r.grade]),
    });
    saveBlob(blob, "curved-grades.pdf");
  }

  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Names and marks"
        htmlFor="marks"
        note='One a line, as "Name, Mark", or just a column of marks. A header row is ignored.'
      >
        <TextBox
          id="marks"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Ada, 72\nGrace, 88\nAlan, 65"}
        />
      </Field>

      <label className="ek-btn ek-btn-quiet w-fit cursor-pointer">
        <Upload aria-hidden="true" className="h-4 w-4" />
        Upload a CSV
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>

      {students.length === 0 ? (
        <Note tone="quiet">Paste or upload some marks and the distribution appears here.</Note>
      ) : (
        <>
          {/* Distribution */}
          <div className="ek-card p-4">
            <h2 className="text-[15px] font-semibold">The class, before curving</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
              {[
                ["Count", st.count],
                ["Mean", st.mean.toFixed(1)],
                ["Median", st.median.toFixed(1)],
                ["Std dev", st.sd.toFixed(2)],
                ["Min", st.min],
                ["Max", st.max],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] bg-bg-soft p-2">
                  <div className="text-[11px] text-text-light">{label}</div>
                  <div className="text-[16px] font-semibold tabular-nums">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-28 items-end gap-1" aria-hidden="true">
              {bars.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end">
                  <div
                    style={{ height: `${(b.count / maxBar) * 100}%` }}
                    className="w-full rounded-t bg-primary/70"
                    title={`${Math.round(b.from)}–${Math.round(b.to)}: ${b.count}`}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-text-light">
              Marks from {Math.round(st.min)} to {Math.round(st.max)}, in ten buckets.
            </p>
          </div>

          {/* Method */}
          <fieldset>
            <legend className="text-[14px] font-semibold">Curving method</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                { id: "z", label: "Std-dev bands", detail: "Grade by z-score" },
                { id: "percentile", label: "Percentile quotas", detail: "Top X% get an A" },
                { id: "linear", label: "Linear scale-up", detail: "Lift the top to a target" },
              ].map((m) => (
                <label
                  key={m.id}
                  className={[
                    "flex cursor-pointer flex-col rounded-[12px] border px-3 py-2",
                    method === m.id ? "border-primary bg-primary/5" : "border-line hover:border-line-strong",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2 text-[14px] font-semibold">
                    <input
                      type="radio"
                      name="method"
                      checked={method === m.id}
                      onChange={() => setMethod(m.id as Method)}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    {m.label}
                  </span>
                  <span className="mt-0.5 pl-6 text-[12px] text-text-light">{m.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Editable cutoffs */}
          {method === "z" ? (
            <div className="ek-card p-4">
              <h3 className="text-[14px] font-semibold">Band cutoffs, in standard deviations</h3>
              <p className="mt-1 text-[13px] text-text-light">
                The lowest z-score that earns each grade. Edit them and the table recomputes.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {zBands.map((band, i) => (
                  <label key={i} className="flex items-center gap-1 text-[13px]">
                    <span className="w-6 font-semibold">{band.grade}</span>
                    <span className="text-text-light">z ≥</span>
                    <input
                      aria-label={`${band.grade} minimum z`}
                      type="number"
                      step={0.1}
                      value={Number.isFinite(band.minZ) ? band.minZ : ""}
                      disabled={!Number.isFinite(band.minZ)}
                      onChange={(e) =>
                        setZBands(zBands.map((b, j) => (j === i ? { ...b, minZ: Number.parseFloat(e.target.value) } : b)))
                      }
                      className={`${FIELD} w-20 disabled:opacity-40`}
                      placeholder={Number.isFinite(band.minZ) ? "" : "rest"}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {method === "percentile" ? (
            <div className="ek-card p-4">
              <h3 className="text-[14px] font-semibold">Quota, percent of the class</h3>
              <p className="mt-1 text-[13px] text-text-light">
                The share of the class that gets each grade, highest first. Edit them and the table
                recomputes. They should add up to about 100.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {quotas.map((q, i) => (
                  <label key={i} className="flex items-center gap-1 text-[13px]">
                    <span className="w-6 font-semibold">{q.grade}</span>
                    <input
                      aria-label={`${q.grade} percent`}
                      type="number"
                      min={0}
                      value={q.pct}
                      onChange={(e) =>
                        setQuotas(quotas.map((x, j) => (j === i ? { ...x, pct: Number.parseFloat(e.target.value) || 0 } : x)))
                      }
                      className={`${FIELD} w-16`}
                    />
                    <span className="text-text-light">%</span>
                  </label>
                ))}
                <span className="self-center text-[13px] text-text-light">
                  total {quotas.reduce((s, q) => s + q.pct, 0)}%
                </span>
              </div>
            </div>
          ) : null}

          {method === "linear" ? (
            <div className="ek-card p-4">
              <h3 className="text-[14px] font-semibold">Scale the top mark up to</h3>
              <p className="mt-1 text-[13px] text-text-light">
                Every mark is multiplied so the highest becomes this, then graded on a standard
                percentage scale (90 an A, 80 a B, and so on).
              </p>
              <label className="mt-3 flex items-center gap-2 text-[13px]">
                Target
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={target}
                  onChange={(e) => setTarget(Number.parseFloat(e.target.value) || 100)}
                  className={`${FIELD} w-20`}
                />
              </label>
            </div>
          ) : null}

          {/* Results */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[14px]">
              <thead>
                <tr className="text-left text-[12px] text-text-light">
                  <th className="p-2">Name</th>
                  <th className="p-2 text-center">Raw mark</th>
                  <th className="p-2 text-center">{metricLabel}</th>
                  <th className="p-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-center tabular-nums">{r.mark}</td>
                    <td className="p-2 text-center tabular-nums">{r.metric}</td>
                    <td className="p-2 text-center font-semibold">{r.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2 text-[13px] text-text-light">
            {counts.map((c) => (
              <span key={c.grade} className="rounded-full bg-bg-soft px-2.5 py-1">
                {c.grade}: {c.count}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <CopyButton text={() => rows.map((r) => `${r.name}\t${r.mark}\t${r.metric}\t${r.grade}`).join("\n")} label="Copy" />
            <button type="button" onClick={() => take(exportCsv)} className="ek-btn ek-btn-quiet">
              Download CSV
            </button>
            <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-quiet">
              Download PDF
            </button>
            {gate}
          </div>
        </>
      )}

      <Note tone="quiet">
        Curving is a policy choice, not a formula, and no method here is &quot;the correct&quot; one.
        Standard-deviation bands, percentile quotas and a linear scale-up give different results by
        design. Follow your institution&apos;s rules, and use this to see and check the maths. The
        list is read in your browser and never uploaded.
      </Note>
    </div>
  );
}
