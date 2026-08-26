"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Download, FileDown } from "lucide-react";
import {
  CLASS_COLORS,
  DAYS,
  blockPosition,
  formatTime,
  parseTime,
  scheduleFromQuery,
  scheduleQuery,
  timeRange,
  type ClassBlock,
} from "@/lib/teach/timetable";
import { CopyButton, Field, Input, Note, useTake } from "./ui";

let counter = 0;

/** Weekdays always show; a weekend day appears only if it has a class. */
function visibleDays(blocks: ClassBlock[]): number[] {
  const days = new Set([0, 1, 2, 3, 4]);
  for (const block of blocks) if (block.day > 4) days.add(block.day);
  return [...days].sort((a, b) => a - b);
}

export function TimetableTool() {
  const [blocks, setBlocks] = useState<ClassBlock[]>([]);
  const [shareUrl, setShareUrl] = useState("");

  // Draft for the add form.
  const [day, setDay] = useState(0);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<string>(CLASS_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = scheduleFromQuery(window.location.search);
    if (fromUrl.length > 0) setBlocks(fromUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = scheduleQuery(blocks);
    window.history.replaceState(null, "", query || window.location.pathname);
    setShareUrl(blocks.length > 0 ? `${window.location.origin}${window.location.pathname}${query}` : "");
  }, [blocks]);

  const range = useMemo(() => timeRange(blocks), [blocks]);
  const days = useMemo(() => visibleDays(blocks), [blocks]);

  function addClass() {
    const s = parseTime(start);
    const e = parseTime(end);
    if (name.trim() === "") return setError("Give the class a name.");
    if (s === null || e === null) return setError("Enter valid start and end times.");
    if (e <= s) return setError("The end time has to be after the start.");
    counter += 1;
    setBlocks((current) => [
      ...current,
      { id: `c${counter}`, day, start: s, end: e, name: name.trim(), location: location.trim(), color },
    ]);
    setName("");
    setLocation("");
    setError(null);
  }

  const remove = (id: string) => setBlocks((current) => current.filter((b) => b.id !== id));

  return (
    <div className="flex flex-col gap-5">
      {/* Add form */}
      <div className="ek-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Class" htmlFor="tt-name">
            <Input id="tt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calculus" />
          </Field>
          <Field label="Location" htmlFor="tt-loc">
            <Input id="tt-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Room 204" />
          </Field>
          <Field label="Day" htmlFor="tt-day">
            <select
              id="tt-day"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
            >
              {DAYS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" htmlFor="tt-start">
              <Input id="tt-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="End" htmlFor="tt-end">
              <Input id="tt-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-text-light">Colour</span>
          {CLASS_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
            />
          ))}
          <button type="button" onClick={addClass} className="ek-btn ek-btn-accent ml-auto">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add class
          </button>
        </div>
        {error ? <Note tone="bad">{error}</Note> : null}
      </div>

      {/* Grid */}
      {blocks.length > 0 ? (
        <>
          <Grid blocks={blocks} range={range} days={days} onRemove={remove} />
          <ExportRow blocks={blocks} range={range} days={days} />
          {shareUrl ? (
            <div>
              <CopyButton text={shareUrl} label="Copy the share link" className="ek-btn ek-btn-quiet" />
              <Note tone="quiet">
                The whole timetable is in that link and in this page only. Nothing is uploaded and
                nothing is stored on a server.
              </Note>
            </div>
          ) : null}
        </>
      ) : (
        <Note tone="quiet">Add a class above and the weekly grid appears here.</Note>
      )}
    </div>
  );
}

const ROW = 56;
const HEADER = 34;

function Grid({
  blocks,
  range,
  days,
  onRemove,
}: {
  blocks: ClassBlock[];
  range: { startHour: number; endHour: number };
  days: number[];
  onRemove: (id: string) => void;
}) {
  const hours = range.endHour - range.startHour;
  const bodyHeight = hours * ROW;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[520px]">
        {/* Time gutter */}
        <div className="w-[52px] shrink-0">
          <div style={{ height: HEADER }} />
          <div className="relative" style={{ height: bodyHeight }}>
            {Array.from({ length: hours + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute right-1 -translate-y-1/2 text-[11px] text-text-light"
                style={{ top: i * ROW }}
              >
                {formatTime((range.startHour + i) * 60)}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        {days.map((dayIndex) => (
          <div key={dayIndex} className="flex-1 border-l border-line">
            <div
              className="flex items-center justify-center text-[13px] font-semibold"
              style={{ height: HEADER }}
            >
              {DAYS[dayIndex]}
            </div>
            <div
              className="relative"
              style={{
                height: bodyHeight,
                backgroundImage: "linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
                backgroundSize: `100% ${ROW}px`,
              }}
            >
              {blocks
                .filter((b) => b.day === dayIndex)
                .map((b) => {
                  const pos = blockPosition(b, range);
                  return (
                    <div
                      key={b.id}
                      style={{
                        top: pos.top * bodyHeight,
                        height: pos.height * bodyHeight,
                        backgroundColor: b.color,
                      }}
                      className="group absolute inset-x-0.5 overflow-hidden rounded-[6px] p-1.5 text-left text-white"
                    >
                      <div className="truncate text-[12px] font-semibold leading-tight">{b.name}</div>
                      <div className="truncate text-[10px] opacity-90">
                        {formatTime(b.start)}–{formatTime(b.end)}
                      </div>
                      {b.location ? (
                        <div className="truncate text-[10px] opacity-90">{b.location}</div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onRemove(b.id)}
                        aria-label={`Remove ${b.name}`}
                        className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/20 group-hover:flex"
                      >
                        <X aria-hidden="true" className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Draw the timetable to a canvas at a fixed export size. */
function drawTimetable(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blocks: ClassBlock[],
  range: { startHour: number; endHour: number },
  days: number[],
) {
  const gutter = 60;
  const header = 44;
  const hours = range.endHour - range.startHour;
  const gridH = height - header;
  const colW = (width - gutter) / days.length;
  const rowH = gridH / hours;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "middle";

  // Hour lines and labels.
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#64748b";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= hours; i += 1) {
    const y = header + i * rowH;
    ctx.beginPath();
    ctx.moveTo(gutter, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.fillText(formatTime((range.startHour + i) * 60), gutter - 6, y);
  }

  // Day headers and column separators.
  ctx.fillStyle = "#171717";
  ctx.font = "600 14px sans-serif";
  ctx.textAlign = "center";
  days.forEach((dayIndex, col) => {
    const x = gutter + col * colW;
    ctx.fillText(DAYS[dayIndex], x + colW / 2, header / 2);
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(x, header);
    ctx.lineTo(x, height);
    ctx.stroke();
  });

  // Class blocks.
  ctx.textAlign = "left";
  for (const b of blocks) {
    const col = days.indexOf(b.day);
    if (col < 0) continue;
    const pos = blockPosition(b, range);
    const x = gutter + col * colW + 2;
    const y = header + pos.top * gridH + 1;
    const w = colW - 4;
    const h = Math.max(16, pos.height * gridH - 2);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 12px sans-serif";
    ctx.fillText(b.name, x + 6, y + 12, w - 12);
    ctx.font = "10px sans-serif";
    ctx.fillText(`${formatTime(b.start)}–${formatTime(b.end)}`, x + 6, y + 26, w - 12);
    if (b.location && h > 44) ctx.fillText(b.location, x + 6, y + 40, w - 12);
  }
}

function renderCanvas(blocks: ClassBlock[], range: { startHour: number; endHour: number }, days: number[]) {
  const scale = 2;
  const width = Math.max(720, days.length * 150);
  const height = 200 + (range.endHour - range.startHour) * 52;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not draw the timetable.");
  ctx.scale(scale, scale);
  drawTimetable(ctx, width, height, blocks, range, days);
  return canvas;
}

function ExportRow({
  blocks,
  range,
  days,
}: {
  blocks: ClassBlock[];
  range: { startHour: number; endHour: number };
  days: number[];
}) {
  const { take, gate } = useTake("Download");

  const savePng = async () => {
    const canvas = renderCanvas(blocks, range, days);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (blob) saveBlob(blob, "timetable.png");
  };

  const savePdf = async () => {
    const canvas = renderCanvas(blocks, range, days);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const png = await pdf.embedPng(new Uint8Array(await blob.arrayBuffer()));
    const page = pdf.addPage([842, 595]); // A4 landscape, points
    const margin = 24;
    const ratio = Math.min((842 - 2 * margin) / png.width, (595 - 2 * margin) / png.height);
    const w = png.width * ratio;
    const h = png.height * ratio;
    page.drawImage(png, { x: (842 - w) / 2, y: (595 - h) / 2, width: w, height: h });
    const bytes = await pdf.save();
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    saveBlob(new Blob([copy], { type: "application/pdf" }), "timetable.pdf");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => take(() => void savePng())} className="ek-btn ek-btn-accent">
        <Download aria-hidden="true" className="h-4 w-4" />
        Export PNG
      </button>
      <button type="button" onClick={() => take(() => void savePdf())} className="ek-btn ek-btn-quiet">
        <FileDown aria-hidden="true" className="h-4 w-4" />
        Export PDF
      </button>
      {gate}
    </div>
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
