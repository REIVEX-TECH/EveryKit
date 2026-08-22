"use client";

import { useMemo, useState } from "react";
import {
  contrastRatio,
  formatHsl,
  formatRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  wcagGrades,
  type Rgb,
} from "@/lib/dev/color";
import { CopyButton, Field, Input, Note } from "./ui";

/**
 * Hex, rgb and hsl of one colour, with a live swatch, and a WCAG contrast
 * check between two colours. The conversions are the reason to have it; the
 * contrast grid is the reason a developer keeps it open.
 */
export function ColorTool() {
  const [foreground, setForeground] = useState("#1d81f2");
  const [background, setBackground] = useState("#ffffff");

  const fg = parseColor(foreground);
  const bg = parseColor(background);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-[17px]">Convert a colour</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field
            label="Colour"
            htmlFor="color-input"
            note="Hex, rgb() or hsl(). The three forms below update as you type."
          >
            <Input
              id="color-input"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              placeholder="#1d81f2"
            />
          </Field>
          <Swatch rgb={fg} />
        </div>
        {fg ? <Conversions rgb={fg} /> : <Note tone="bad">That is not a colour this reads.</Note>}
      </section>

      <section>
        <h2 className="text-[17px]">Check contrast</h2>
        <p className="mt-1 text-[14px] text-text-light">
          Whether text of one colour is readable on the other, against the WCAG thresholds.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Text colour" htmlFor="fg2">
            <div className="flex items-center gap-2">
              <Input id="fg2" value={foreground} onChange={(e) => setForeground(e.target.value)} />
              <Swatch rgb={fg} small />
            </div>
          </Field>
          <Field label="Background colour" htmlFor="bg2">
            <div className="flex items-center gap-2">
              <Input id="bg2" value={background} onChange={(e) => setBackground(e.target.value)} />
              <Swatch rgb={bg} small />
            </div>
          </Field>
        </div>
        {fg && bg ? <Contrast fg={fg} bg={bg} /> : null}
      </section>
    </div>
  );
}

function Swatch({ rgb, small }: { rgb: Rgb | null; small?: boolean }) {
  const size = small ? "h-10 w-10" : "h-16 w-16";
  return (
    <span
      aria-hidden="true"
      className={`${size} shrink-0 rounded-[10px] border border-line`}
      style={{ backgroundColor: rgb ? rgbToHex(rgb) : "transparent" }}
    />
  );
}

function Conversions({ rgb }: { rgb: Rgb }) {
  const hex = rgbToHex(rgb);
  const rgbText = formatRgb(rgb);
  const hslText = formatHsl(rgbToHsl(rgb));
  const rows: Array<[string, string]> = [
    ["HEX", hex],
    ["RGB", rgbText],
    ["HSL", hslText],
  ];
  return (
    <div className="mt-4 flex flex-col gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-12 text-[13px] text-text-light">{label}</span>
          <code className="flex-1 rounded-[8px] bg-bg-soft px-3 py-1.5 text-[14px]">{value}</code>
          <CopyButton text={value} className="ek-btn ek-btn-quiet px-3 py-1.5 text-[13px]" />
        </div>
      ))}
    </div>
  );
}

function Contrast({ fg, bg }: { fg: Rgb; bg: Rgb }) {
  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg]);
  const g = wcagGrades(ratio);

  return (
    <div className="mt-4 ek-card p-5">
      <div
        className="rounded-[10px] p-4 text-center text-[16px]"
        style={{ backgroundColor: rgbToHex(bg), color: rgbToHex(fg) }}
      >
        Sample text at this pairing
      </div>
      <p className="mt-4 text-[26px] tabular-nums">{ratio.toFixed(2)}:1</p>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
        <Grade label="Normal text, AA" pass={g.normalAA} />
        <Grade label="Normal text, AAA" pass={g.normalAAA} />
        <Grade label="Large text, AA" pass={g.largeAA} />
        <Grade label="Large text, AAA" pass={g.largeAAA} />
      </div>
      <p className="mt-3 text-[13px] text-text-light">
        Large text is 18pt, or 14pt bold, and over. AA is the usual target; AAA is stricter.
      </p>
    </div>
  );
}

function Grade({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className={pass ? "font-semibold text-foreground" : "text-danger"}>
        {pass ? "Pass" : "Fail"}
      </span>
    </div>
  );
}
