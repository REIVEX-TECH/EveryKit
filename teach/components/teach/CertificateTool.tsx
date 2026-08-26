"use client";

import { useState } from "react";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, Select, useTake } from "./ui";

type TemplateId = "classic" | "gold" | "fun";

const TEMPLATES: { id: TemplateId; label: string; ink: [number, number, number] }[] = [
  { id: "classic", label: "Classic blue", ink: [0.11, 0.51, 0.95] },
  { id: "gold", label: "Warm gold", ink: [0.78, 0.55, 0.12] },
  { id: "fun", label: "Bright orange", ink: [1, 0.54, 0.3] },
];

export function CertificateTool() {
  const [name, setName] = useState("");
  const [award, setAward] = useState("Star of the week");
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [error, setError] = useState<string | null>(null);
  const { take, gate } = useTake("Download");

  async function exportPdf() {
    if (!name.trim()) return setError("Add the name to go on the certificate.");
    setError(null);

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const tpl = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0];
    const ink = rgb(...tpl.ink);
    const dark = rgb(0.09, 0.09, 0.09);
    const grey = rgb(0.27, 0.27, 0.27);
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const [pw, ph] = [842, 595];
    const page = pdf.addPage([pw, ph]);
    const centre = (text: string, y: number, size: number, f = font, color = dark) => {
      const s = safe(text);
      page.drawText(s, { x: (pw - f.widthOfTextAtSize(s, size)) / 2, y, size, font: f, color });
    };

    // Double border.
    page.drawRectangle({ x: 24, y: 24, width: pw - 48, height: ph - 48, borderWidth: 3, borderColor: ink });
    page.drawRectangle({ x: 34, y: 34, width: pw - 68, height: ph - 68, borderWidth: 1, borderColor: ink });

    centre("Certificate", 470, 40, bold, ink);
    centre("This certificate is proudly presented to", 410, 13, font, grey);
    centre(name.trim(), 350, 34, bold, dark);
    page.drawLine({ start: { x: 220, y: 338 }, end: { x: pw - 220, y: 338 }, thickness: 1, color: ink });
    centre("for", 305, 13, italic, grey);
    centre(award.trim() || "outstanding work", 270, 22, font, dark);

    const y = 120;
    if (date.trim()) {
      page.drawText(safe(date.trim()), { x: 130, y, size: 12, font, color: dark });
      page.drawLine({ start: { x: 130, y: y + 16 }, end: { x: 300, y: y + 16 }, thickness: 0.75, color: grey });
      page.drawText("Date", { x: 130, y: y - 16, size: 10, font, color: grey });
    }
    if (from.trim()) {
      const s = safe(from.trim());
      const x = pw - 130 - font.widthOfTextAtSize(s, 12);
      page.drawText(s, { x, y, size: 12, font, color: dark });
      page.drawLine({ start: { x: pw - 300, y: y + 16 }, end: { x: pw - 130, y: y + 16 }, thickness: 0.75, color: grey });
      page.drawText("Awarded by", { x: pw - 300, y: y - 16, size: 10, font, color: grey });
    }

    saveBlob(pdfBlob(await pdf.save()), "certificate.pdf");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Name" htmlFor="name" note="Who the certificate is for.">
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace Hopper" />
      </Field>
      <Field label="Award" htmlFor="award">
        <Input id="award" value={award} onChange={(e) => setAward(e.target.value)} placeholder="e.g. Star of the week" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="date" note="Optional.">
          <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 26 August 2026" />
        </Field>
        <Field label="Awarded by" htmlFor="from" note="Optional.">
          <Input id="from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Miss Khan" />
        </Field>
      </div>
      <Field label="Style" htmlFor="template">
        <Select id="template" value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)}>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      {error ? <Note tone="bad">{error}</Note> : null}

      <div>
        <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-accent">
          Download PDF
        </button>
        {gate}
      </div>

      <Note tone="quiet">The certificate is drawn on your device, ready to print on A4 landscape. Nothing is uploaded.</Note>
    </div>
  );
}
