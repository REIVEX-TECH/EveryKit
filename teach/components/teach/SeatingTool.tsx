"use client";

import { useMemo, useState } from "react";
import { parseRoster, shuffle } from "@/lib/teach/roster";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, Select, TextBox, useTake } from "./ui";

type Order = "random" | "alphabetical" | "as-typed";

function arrange(names: string[], order: Order): string[] {
  if (order === "alphabetical") return [...names].sort((a, b) => a.localeCompare(b));
  if (order === "random") return shuffle(names);
  return names;
}

export function SeatingTool() {
  const [className, setClassName] = useState("");
  const [text, setText] = useState("");
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(6);
  const [order, setOrder] = useState<Order>("random");
  const [seed, setSeed] = useState(0);
  const { take, gate } = useTake("Download");

  const seats = useMemo(() => {
    void seed; // re-arrange when the shuffle button bumps the seed
    const names = arrange(parseRoster(text), order);
    const total = Math.max(1, rows) * Math.max(1, cols);
    return Array.from({ length: total }, (_, i) => names[i] ?? "");
  }, [text, rows, cols, order, seed]);

  const nameCount = parseRoster(text).length;
  const capacity = Math.max(1, rows) * Math.max(1, cols);

  function drawToCanvas(): HTMLCanvasElement {
    const scale = 2;
    const cw = 150;
    const ch = 84;
    const pad = 24;
    const top = 70;
    const w = pad * 2 + cols * cw;
    const h = top + pad + rows * ch;
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#171717";
    ctx.font = "600 20px 'IBM Plex Sans', sans-serif";
    ctx.fillText(className.trim() || "Seating plan", pad, 34);

    ctx.fillStyle = "#1769d4";
    ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FRONT OF CLASS", w / 2, 56);
    ctx.textAlign = "left";

    seats.forEach((name, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = pad + c * cw;
      const y = top + r * ch;
      ctx.fillStyle = name ? "#f8fafc" : "#ffffff";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 5, y + 5, cw - 10, ch - 10, 10);
      ctx.fill();
      ctx.stroke();
      if (name) {
        ctx.fillStyle = "#171717";
        ctx.font = "500 14px 'IBM Plex Sans', sans-serif";
        ctx.textAlign = "center";
        const label = name.length > 18 ? `${name.slice(0, 17)}…` : name;
        ctx.fillText(label, x + cw / 2, y + ch / 2 + 5);
        ctx.textAlign = "left";
      }
    });
    return canvas;
  }

  function exportPng() {
    drawToCanvas().toBlob((blob) => {
      if (blob) saveBlob(blob, "seating-plan.png");
    }, "image/png");
  }

  async function exportPdf() {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

    const [pw, ph] = [842, 595];
    const page = pdf.addPage([pw, ph]);
    const margin = 36;
    page.drawText(safe(className.trim() || "Seating plan"), { x: margin, y: ph - margin, size: 16, font: bold });
    const front = "FRONT OF CLASS";
    page.drawText(front, {
      x: (pw - bold.widthOfTextAtSize(front, 10)) / 2,
      y: ph - margin - 22,
      size: 10,
      font: bold,
      color: rgb(0.09, 0.41, 0.83),
    });

    const gridTop = ph - margin - 44;
    const gridH = gridTop - margin;
    const gridW = pw - 2 * margin;
    const cw = gridW / cols;
    const ch = gridH / rows;
    seats.forEach((name, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = margin + c * cw;
      const y = gridTop - (r + 1) * ch;
      page.drawRectangle({
        x: x + 3,
        y: y + 3,
        width: cw - 6,
        height: ch - 6,
        borderWidth: 0.75,
        borderColor: rgb(0.85, 0.88, 0.91),
        color: name ? rgb(0.97, 0.98, 0.99) : undefined,
      });
      if (name) {
        const label = safe(name).slice(0, 22);
        const size = 11;
        page.drawText(label, {
          x: x + (cw - font.widthOfTextAtSize(label, size)) / 2,
          y: y + ch / 2 - 4,
          size,
          font,
          color: rgb(0.09, 0.09, 0.09),
        });
      }
    });

    saveBlob(pdfBlob(await pdf.save()), "seating-plan.pdf");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Class name" htmlFor="class">
        <Input id="class" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Year 7 form room" />
      </Field>
      <Field label="Students" htmlFor="roster" note="One name a line.">
        <TextBox id="roster" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[120px]" placeholder={"Ada Lovelace\nGrace Hopper"} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Rows" htmlFor="rows">
          <Input id="rows" type="number" min={1} max={12} value={rows} onChange={(e) => setRows(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} />
        </Field>
        <Field label="Columns" htmlFor="cols">
          <Input id="cols" type="number" min={1} max={12} value={cols} onChange={(e) => setCols(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} />
        </Field>
        <Field label="Order" htmlFor="order">
          <Select id="order" value={order} onChange={(e) => setOrder(e.target.value as Order)}>
            <option value="random">Random</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="as-typed">As typed</option>
          </Select>
        </Field>
      </div>

      <Note tone={nameCount > capacity ? "bad" : "quiet"}>
        {nameCount} {nameCount === 1 ? "name" : "names"}, {capacity} {capacity === 1 ? "seat" : "seats"}.
        {nameCount > capacity ? " Some names will not fit. Add rows or columns." : ""}
      </Note>

      <div className="overflow-x-auto">
        <div className="mx-auto w-fit rounded-[12px] border border-line bg-bg-soft p-3">
          <p className="mb-2 text-center text-[12px] font-semibold text-primary-dark">Front of class</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(72px, 1fr))` }}>
            {seats.map((name, i) => (
              <div
                key={i}
                aria-label={name || "empty seat"}
                className={`flex h-14 items-center justify-center rounded-[8px] border border-dashed border-line px-1 text-center text-[12px] ${name ? "border-solid bg-background" : "bg-transparent text-text-light"}`}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="ek-btn ek-btn-quiet">
          Shuffle again
        </button>
        <button type="button" onClick={() => take(exportPng)} className="ek-btn ek-btn-accent">
          Download PNG
        </button>
        <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-quiet">
          Download PDF
        </button>
        {gate}
      </div>

      <Note tone="quiet">The plan is drawn on your device. The class list is never uploaded.</Note>
    </div>
  );
}
