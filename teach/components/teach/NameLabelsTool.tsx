"use client";

import { useState } from "react";
import { parseRoster } from "@/lib/teach/roster";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, Select, TextBox, useTake } from "./ui";

type SizeId = "small" | "badge" | "tag";

const SIZES: Record<SizeId, { label: string; cols: number; rows: number; name: number; tent: boolean }> = {
  small: { label: "Small labels (24 a page)", cols: 3, rows: 8, name: 12, tent: false },
  badge: { label: "Name badges (10 a page)", cols: 2, rows: 5, name: 18, tent: false },
  tag: { label: "Folded desk tags (4 a page)", cols: 1, rows: 4, name: 22, tent: true },
};

export function NameLabelsTool() {
  const [text, setText] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [size, setSize] = useState<SizeId>("badge");
  const [error, setError] = useState<string | null>(null);
  const { take, gate } = useTake("Download");

  async function exportPdf() {
    const names = parseRoster(text);
    if (names.length === 0) return setError("Add at least one name.");
    setError(null);

    const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.09, 0.09, 0.09);
    const grey = rgb(0.4, 0.4, 0.4);
    const line = rgb(0.8, 0.83, 0.86);
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

    const [pw, ph] = [595, 842];
    const margin = 36;
    const spec = SIZES[size];
    const cellW = (pw - 2 * margin) / spec.cols;
    const cellH = (ph - 2 * margin) / spec.rows;
    const perPage = spec.cols * spec.rows;
    const sub = subtitle.trim();

    // A centred string, clipped to fit the cell width at the given size.
    const centre = (page: import("pdf-lib").PDFPage, s: string, cx: number, y: number, sz: number, f: typeof font, color: import("pdf-lib").RGB, flip = false) => {
      let text = safe(s);
      while (text.length > 1 && f.widthOfTextAtSize(text, sz) > cellW - 24) text = text.slice(0, -1);
      const w = f.widthOfTextAtSize(text, sz);
      if (flip) page.drawText(text, { x: cx + w / 2, y, size: sz, font: f, color, rotate: degrees(180) });
      else page.drawText(text, { x: cx - w / 2, y, size: sz, font: f, color });
    };

    let page = pdf.addPage([pw, ph]);
    names.forEach((name, i) => {
      const slot = i % perPage;
      if (slot === 0 && i !== 0) page = pdf.addPage([pw, ph]);
      const col = slot % spec.cols;
      const rowIdx = Math.floor(slot / spec.cols);
      const x = margin + col * cellW;
      const yTop = ph - margin - rowIdx * cellH;
      const cx = x + cellW / 2;

      page.drawRectangle({ x, y: yTop - cellH, width: cellW, height: cellH, borderWidth: 0.75, borderColor: line });

      if (spec.tent) {
        // A tent card: the top half printed upside down, so when the sheet is
        // folded along the middle the name reads from both sides of the desk.
        const mid = yTop - cellH / 2;
        page.drawLine({ start: { x, y: mid }, end: { x: x + cellW, y: mid }, thickness: 0.5, color: line, dashArray: [3, 3] });
        centre(page, name, cx, mid + cellH / 4 - 6, spec.name, bold, ink);
        if (sub) centre(page, sub, cx, mid + cellH / 4 - 24, 11, font, grey);
        centre(page, name, cx, mid - cellH / 4 + 6, spec.name, bold, ink, true);
        if (sub) centre(page, sub, cx, mid - cellH / 4 + 24, 11, font, grey, true);
      } else {
        const midY = yTop - cellH / 2;
        centre(page, name, cx, midY + (sub ? 2 : -4), spec.name, bold, ink);
        if (sub) centre(page, sub, cx, midY - spec.name + 2, spec.name > 14 ? 11 : 8, font, grey);
      }
    });

    saveBlob(pdfBlob(await pdf.save()), "name-labels.pdf");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Names" htmlFor="roster" note="One name a line.">
        <TextBox id="roster" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[140px]" placeholder={"Ada Lovelace\nGrace Hopper\nAlan Turing"} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Shared line" htmlFor="sub" note="Optional. Printed under every name.">
          <Input id="sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Room 12" />
        </Field>
        <Field label="Size" htmlFor="size">
          <Select id="size" value={size} onChange={(e) => setSize(e.target.value as SizeId)}>
            {(Object.keys(SIZES) as SizeId[]).map((id) => (
              <option key={id} value={id}>
                {SIZES[id].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? <Note tone="bad">{error}</Note> : null}

      <div>
        <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-accent">
          Download PDF
        </button>
        {gate}
      </div>

      <Note tone="quiet">The labels are drawn on your device, ready to print and cut. Nothing is uploaded.</Note>
    </div>
  );
}
