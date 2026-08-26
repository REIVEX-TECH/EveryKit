"use client";

import { useState } from "react";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, Select, useTake } from "./ui";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

/** Read a typed key like "A B D, c" into an option index per question. */
function parseKey(text: string, options: number): Array<number | null> {
  const letters = (text.toUpperCase().match(/[A-E]/g) ?? []).map((l) => LETTERS.indexOf(l as (typeof LETTERS)[number]));
  return letters.map((i) => (i >= 0 && i < options ? i : null));
}

export function BubbleSheetTool() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState(20);
  const [options, setOptions] = useState(4);
  const [nameField, setNameField] = useState(true);
  const [idField, setIdField] = useState(true);
  const [key, setKey] = useState("");
  const { take, gate } = useTake("Download");

  const keyMarks = parseKey(key, options);
  const keyReady = keyMarks.some((m) => m !== null);

  async function build(filled: Array<number | null> | null) {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.09, 0.09, 0.09);
    const line = rgb(0.2, 0.2, 0.2);
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

    const [pw, ph] = [595, 842];
    const margin = 44;
    const cols = questions > 40 ? 3 : questions > 15 ? 2 : 1;
    const rowH = 26;
    const r = 7;

    let page = pdf.addPage([pw, ph]);
    const header = (p: typeof page) => {
      let hy = ph - margin;
      p.drawText(safe(title.trim() || "Answer sheet"), { x: margin, y: hy, size: 16, font: bold, color: ink });
      if (filled) p.drawText("ANSWER KEY", { x: pw - margin - bold.widthOfTextAtSize("ANSWER KEY", 11), y: hy + 2, size: 11, font: bold, color: rgb(0.8, 0.2, 0.2) });
      hy -= 22;
      if (nameField) {
        p.drawText("Name", { x: margin, y: hy, size: 10, font, color: ink });
        p.drawLine({ start: { x: margin + 34, y: hy - 2 }, end: { x: margin + 250, y: hy - 2 }, thickness: 0.75, color: line });
      }
      if (idField) {
        p.drawText("ID", { x: margin + 280, y: hy, size: 10, font, color: ink });
        p.drawLine({ start: { x: margin + 300, y: hy - 2 }, end: { x: pw - margin, y: hy - 2 }, thickness: 0.75, color: line });
      }
      return hy - 26;
    };

    const topY = header(page);
    const colW = (pw - 2 * margin) / cols;
    const rowsPerCol = Math.max(1, Math.floor((topY - margin) / rowH));
    const perPage = rowsPerCol * cols;

    for (let q = 0; q < questions; q += 1) {
      const local = q % perPage;
      if (local === 0 && q !== 0) {
        page = pdf.addPage([pw, ph]);
        header(page);
      }
      const col = Math.floor(local / rowsPerCol);
      const rowInCol = local % rowsPerCol;
      const x = margin + col * colW;
      const rowY = topY - rowInCol * rowH;

      page.drawText(`${q + 1}.`, { x, y: rowY - 3, size: 10, font, color: ink });
      for (let o = 0; o < options; o += 1) {
        const cx = x + 26 + o * 20 + r;
        const cy = rowY;
        const isFilled = filled ? filled[q] === o : false;
        page.drawCircle({ x: cx, y: cy, size: r, borderWidth: 1, borderColor: line, color: isFilled ? line : undefined });
        page.drawText(LETTERS[o], {
          x: cx - font.widthOfTextAtSize(LETTERS[o], 8) / 2,
          y: cy - 3,
          size: 8,
          font,
          color: isFilled ? rgb(1, 1, 1) : ink,
        });
      }
    }

    return pdfBlob(await pdf.save());
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title" htmlFor="title">
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 3 quiz" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Questions" htmlFor="q">
          <Input id="q" type="number" min={1} max={200} value={questions} onChange={(e) => setQuestions(Math.max(1, Math.min(200, Number(e.target.value) || 1)))} />
        </Field>
        <Field label="Options per question" htmlFor="o">
          <Select id="o" value={options} onChange={(e) => setOptions(Number(e.target.value))}>
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                A to {LETTERS[n - 1]} ({n})
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={nameField} onChange={(e) => setNameField(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
          Name field
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={idField} onChange={(e) => setIdField(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
          ID field
        </label>
      </div>
      <Field label="Answer key" htmlFor="key" note="Optional. Type the correct option per question, like A B D C. Enables the key sheet.">
        <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="A B C D A ..." />
      </Field>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => take(() => void build(null).then((b) => saveBlob(b, "answer-sheet.pdf")))} className="ek-btn ek-btn-accent">
          Download answer sheet
        </button>
        <button
          type="button"
          disabled={!keyReady}
          onClick={() => take(() => void build(keyMarks).then((b) => saveBlob(b, "answer-key.pdf")))}
          className="ek-btn ek-btn-quiet disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download answer key
        </button>
        {gate}
      </div>

      <Note tone="quiet">Both sheets are drawn on your device. Nothing is uploaded.</Note>
    </div>
  );
}
