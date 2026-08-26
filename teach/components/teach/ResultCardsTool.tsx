"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { parseResultTable, resultTotals } from "@/lib/teach/results";
import { letterFor, DEFAULT_SCALE, type GradeBand } from "@/lib/teach/gradebook";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, TextBox, useTake } from "./ui";

const SAMPLE = "Name,Maths,Science,English\nAda Lovelace,88,92,79\nGrace Hopper,74,81,90";

export function ResultCardsTool() {
  const [heading, setHeading] = useState("");
  const [text, setText] = useState("");
  const [max, setMax] = useState(100);
  const [perPage, setPerPage] = useState<1 | 4>(4);
  const [scale, setScale] = useState<GradeBand[]>(DEFAULT_SCALE);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { take, gate } = useTake("Download");

  const table = useMemo(() => parseResultTable(text), [text]);

  function setBand(i: number, patch: Partial<GradeBand>) {
    setScale(scale.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }
  function addBand() {
    setScale([...scale, { grade: "", min: 0 }]);
  }
  function removeBand(i: number) {
    if (scale.length === 1) return;
    setScale(scale.filter((_, j) => j !== i));
  }

  function onUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function exportPdf() {
    if (table.students.length === 0) return setError("Add a roster with a header row and a student per line.");
    setError(null);

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.09, 0.09, 0.09);
    const grey = rgb(0.35, 0.35, 0.35);
    const line = rgb(0.8, 0.83, 0.86);
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

    const [pw, ph] = [595, 842];
    const margin = 36;
    const gap = 16;
    const cols = perPage === 1 ? 1 : 2;
    const rows = perPage === 1 ? 1 : 2;
    const cardW = (pw - 2 * margin - (cols - 1) * gap) / cols;
    const cardH = (ph - 2 * margin - (rows - 1) * gap) / rows;

    const drawCard = (page: import("pdf-lib").PDFPage, x: number, yTop: number, student: (typeof table.students)[number]) => {
      const totals = resultTotals(student.marks, max);
      const grade = letterFor(totals.percentage, scale);
      page.drawRectangle({ x, y: yTop - cardH, width: cardW, height: cardH, borderWidth: 1, borderColor: line });
      let y = yTop - 22;
      if (heading.trim()) {
        page.drawText(safe(heading.trim()), { x: x + 14, y, size: 9, font, color: grey });
        y -= 14;
      }
      page.drawText(safe(student.name).slice(0, 40), { x: x + 14, y, size: 14, font: bold, color: ink });
      y -= 20;
      // Subject rows
      table.subjects.forEach((subject, i) => {
        const mark = student.marks[i];
        page.drawText(safe(subject).slice(0, 26), { x: x + 14, y, size: 10, font, color: ink });
        const markText = mark === null ? "-" : `${mark} / ${max}`;
        page.drawText(markText, { x: x + cardW - 14 - font.widthOfTextAtSize(markText, 10), y, size: 10, font, color: ink });
        y -= 15;
      });
      // Footer totals
      const footY = yTop - cardH + 44;
      page.drawLine({ start: { x: x + 14, y: footY + 20 }, end: { x: x + cardW - 14, y: footY + 20 }, thickness: 0.75, color: line });
      const pct = totals.percentage === null ? "-" : `${totals.percentage.toFixed(1)}%`;
      page.drawText(`Total ${totals.total} / ${totals.possible}`, { x: x + 14, y: footY + 4, size: 10, font, color: ink });
      page.drawText(`${pct}`, { x: x + 14, y: footY - 12, size: 10, font, color: grey });
      page.drawText(`Grade ${grade}`, { x: x + cardW - 14 - bold.widthOfTextAtSize(`Grade ${grade}`, 13), y: footY - 8, size: 13, font: bold, color: ink });
    };

    const perSheet = cols * rows;
    let page = pdf.addPage([pw, ph]);
    table.students.forEach((student, i) => {
      const slot = i % perSheet;
      if (slot === 0 && i !== 0) page = pdf.addPage([pw, ph]);
      const col = slot % cols;
      const rowIdx = Math.floor(slot / cols);
      const x = margin + col * (cardW + gap);
      const yTop = ph - margin - rowIdx * (cardH + gap);
      drawCard(page, x, yTop, student);
    });

    saveBlob(pdfBlob(await pdf.save()), "result-cards.pdf");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Heading" htmlFor="heading" note="Optional. Printed small on every slip, like the term or class.">
        <Input id="heading" value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="e.g. Autumn term, Year 9" />
      </Field>
      <Field label="Roster" htmlFor="roster" note="First row is Name then a column per subject. Or upload a CSV.">
        <TextBox id="roster" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[140px]" placeholder={SAMPLE} />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <button type="button" onClick={() => fileRef.current?.click()} className="ek-btn ek-btn-quiet">
          Upload CSV
        </button>
        <button type="button" onClick={() => setText(SAMPLE)} className="text-[13px] text-primary hover:text-primary-dark">
          Use an example
        </button>
        <span className="text-[13px] text-text-light">
          {table.students.length} {table.students.length === 1 ? "student" : "students"}, {table.subjects.length} {table.subjects.length === 1 ? "subject" : "subjects"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Each subject out of" htmlFor="max">
          <Input id="max" type="number" min={1} value={max} onChange={(e) => setMax(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
        <Field label="Slips per page" htmlFor="per">
          <div className="mt-1 flex gap-2">
            {([4, 1] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={perPage === n}
                onClick={() => setPerPage(n)}
                className={`rounded-full border px-4 py-2 text-[14px] ${perPage === n ? "border-primary bg-primary/10 text-primary-dark" : "border-line text-text-light hover:border-line-strong"}`}
              >
                {n === 4 ? "Four per page" : "One per page"}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <details className="rounded-[12px] border border-line p-3">
        <summary className="cursor-pointer text-[14px] font-semibold">Grade scale</summary>
        <div className="mt-3 flex flex-col gap-2">
          {scale.map((band, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input aria-label={`Grade ${i + 1}`} value={band.grade} onChange={(e) => setBand(i, { grade: e.target.value })} className="w-20" placeholder="A" />
              <span className="text-[13px] text-text-light">from</span>
              <Input aria-label={`Grade ${i + 1} minimum percent`} type="number" value={band.min} onChange={(e) => setBand(i, { min: Number(e.target.value) || 0 })} className="w-24" />
              <span className="text-[13px] text-text-light">%</span>
              <button type="button" onClick={() => removeBand(i)} aria-label={`Remove grade ${i + 1}`} className="ml-auto text-text-light hover:text-danger">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addBand} className="ek-btn ek-btn-quiet mt-1 w-fit">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add grade
          </button>
        </div>
      </details>

      {error ? <Note tone="bad">{error}</Note> : null}

      <div>
        <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-accent">
          Download PDF
        </button>
        {gate}
      </div>

      <Note tone="quiet">The slips are made on your device. The roster is never uploaded.</Note>
    </div>
  );
}
