"use client";

import { useState } from "react";
import { parseRoster } from "@/lib/teach/roster";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, TextBox, useTake } from "./ui";

function datesInRange(start: string, end: string, skipWeekends: boolean): Date[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return [];
  const out: Date[] = [];
  const day = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  let guard = 0;
  while (day <= last && guard < 400) {
    const dow = day.getDay();
    if (!(skipWeekends && (dow === 0 || dow === 6))) out.push(new Date(day));
    day.setDate(day.getDate() + 1);
    guard += 1;
  }
  return out;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function AttendanceTool() {
  const [className, setClassName] = useState("");
  const [text, setText] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { take, gate } = useTake("Download");

  async function exportPdf() {
    const students = parseRoster(text);
    const dates = datesInRange(start, end, skipWeekends);
    if (students.length === 0) return setError("Add at least one student.");
    if (dates.length === 0) return setError("Pick a valid start and end date.");
    setError(null);

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const line = rgb(0.75, 0.79, 0.83);
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

    const [pw, ph] = [842, 595];
    const margin = 36;
    const nameW = 150;
    const cellW = 26;
    const rowH = 20;
    const perPageDates = Math.floor((pw - 2 * margin - nameW) / cellW);
    const perPageRows = Math.floor((ph - 2 * margin - 50) / rowH);

    for (const dateGroup of chunk(dates, perPageDates)) {
      for (const rowGroup of chunk(students, perPageRows)) {
        const page = pdf.addPage([pw, ph]);
        let y = ph - margin;
        page.drawText(safe(className.trim() || "Attendance"), { x: margin, y, size: 15, font: bold });
        y -= 24;

        const headerY = y;
        page.drawText("Student", { x: margin, y: headerY, size: 9, font: bold });
        dateGroup.forEach((d, i) => {
          const x = margin + nameW + i * cellW + 3;
          page.drawText(`${d.getDate()}/${d.getMonth() + 1}`, { x, y: headerY, size: 8, font });
        });
        y -= 8;
        page.drawLine({ start: { x: margin, y }, end: { x: pw - margin, y }, thickness: 0.5, color: line });
        y -= rowH;

        rowGroup.forEach((name) => {
          page.drawText(safe(name).slice(0, 26), { x: margin, y: y + 5, size: 10, font });
          dateGroup.forEach((_, i) => {
            const x = margin + nameW + i * cellW + 5;
            page.drawRectangle({ x, y: y + 1, width: 14, height: 14, borderWidth: 0.5, borderColor: line });
          });
          y -= rowH;
          page.drawLine({ start: { x: margin, y: y + rowH - 3 }, end: { x: pw - margin, y: y + rowH - 3 }, thickness: 0.3, color: line });
        });
      }
    }

    saveBlob(pdfBlob(await pdf.save()), "attendance.pdf");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Class name" htmlFor="class">
        <Input id="class" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Year 9 Science" />
      </Field>
      <Field label="Students" htmlFor="roster" note="One name a line.">
        <TextBox id="roster" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[120px]" placeholder={"Ada Lovelace\nGrace Hopper"} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From" htmlFor="start">
          <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="To" htmlFor="end">
          <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" checked={skipWeekends} onChange={(e) => setSkipWeekends(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
        Skip weekends
      </label>

      {error ? <Note tone="bad">{error}</Note> : null}

      <div>
        <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-accent">
          Download PDF
        </button>
        {gate}
      </div>

      <Note tone="quiet">
        The register is drawn on your device and printed by you. Nothing is uploaded, and no record of
        who was in is kept here.
      </Note>
    </div>
  );
}
