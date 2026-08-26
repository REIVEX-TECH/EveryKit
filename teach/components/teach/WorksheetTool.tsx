"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, Select, TextBox, useTake } from "./ui";

type Space = "none" | "lines" | "box";
type Question = { text: string; space: Space };

export function WorksheetTool() {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ text: "", space: "lines" }]);
  const { take, gate } = useTake("Download");

  const setQuestion = (i: number, patch: Partial<Question>) =>
    setQuestions(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const addQuestion = () => setQuestions([...questions, { text: "", space: "lines" }]);
  const removeQuestion = (i: number) =>
    setQuestions(questions.length === 1 ? questions : questions.filter((_, j) => j !== i));

  async function exportPdf() {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const lineColor = rgb(0.7, 0.75, 0.8);
    const [pw, ph] = [595, 842];
    const margin = 50;
    const width = pw - 2 * margin;
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

    let page = pdf.addPage([pw, ph]);
    let y = ph - margin;
    const need = (space: number) => {
      if (y - space < margin) {
        page = pdf.addPage([pw, ph]);
        y = ph - margin;
      }
    };
    const wrap = (text: string, size: number, f = font): string[] => {
      const words = safe(text).split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) > width && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines.length ? lines : [""];
    };
    const drawLines = (text: string, size: number, f: typeof font, gap: number) => {
      for (const line of wrap(text, size, f)) {
        need(gap);
        page.drawText(line, { x: margin, y, size, font: f });
        y -= gap;
      }
    };

    if (title.trim()) drawLines(title.trim(), 18, bold, 24);
    if (instructions.trim()) {
      y -= 4;
      drawLines(instructions.trim(), 11, font, 15);
    }
    y -= 10;

    questions.forEach((q, i) => {
      const text = `${i + 1}. ${q.text || ""}`;
      drawLines(text, 12, font, 17);
      if (q.space === "lines") {
        for (let k = 0; k < 3; k += 1) {
          need(22);
          y -= 8;
          page.drawLine({ start: { x: margin, y }, end: { x: pw - margin, y }, thickness: 0.5, color: lineColor });
          y -= 6;
        }
      } else if (q.space === "box") {
        need(90);
        y -= 6;
        page.drawRectangle({ x: margin, y: y - 78, width, height: 78, borderWidth: 0.5, borderColor: lineColor });
        y -= 84;
      }
      y -= 12;
    });

    saveBlob(pdfBlob(await pdf.save()), "worksheet.pdf");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title" htmlFor="title">
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fractions practice" />
      </Field>
      <Field label="Instructions" htmlFor="instructions" note="Optional. Shown under the title.">
        <TextBox
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="min-h-[80px]"
          placeholder="Answer all questions. Show your working."
        />
      </Field>

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <div key={i} className="ek-card p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 text-[14px] font-semibold text-text-light">{i + 1}.</span>
              <TextBox
                aria-label={`Question ${i + 1}`}
                value={q.text}
                onChange={(e) => setQuestion(i, { text: e.target.value })}
                className="min-h-[60px]"
                placeholder="Type the question."
              />
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                aria-label={`Remove question ${i + 1}`}
                className="ek-btn ek-btn-quiet mt-1 h-8 w-8 shrink-0 justify-center p-0"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 pl-6">
              <label className="flex items-center gap-2 text-[13px] text-text-light">
                Answer space
                <Select
                  aria-label={`Answer space for question ${i + 1}`}
                  value={q.space}
                  onChange={(e) => setQuestion(i, { space: e.target.value as Space })}
                  className="w-40"
                >
                  <option value="none">None</option>
                  <option value="lines">A few lines</option>
                  <option value="box">A working box</option>
                </Select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addQuestion} className="ek-btn ek-btn-quiet">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add question
        </button>
        <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-accent">
          Download PDF
        </button>
        {gate}
      </div>

      <Note tone="quiet">The worksheet is built on your device. Nothing is uploaded.</Note>
    </div>
  );
}
