import Link from "next/link";
import type { ReactElement } from "react";
import { tools } from "@/data/tools";

/**
 * The six tools as a launcher, matching the grid on the hub.
 *
 * Same rules: one white glyph on one flat tint, corners at 23 percent, one
 * shadow, pinned by slug so a tool added later never reshuffles the colours.
 */

const TINTS: Record<string, string> = {
  gpa: "#ff8a4c",
  "final-grade": "#1d81f2",
  citation: "#1769d4",
  "reading-time": "#2f6fd0",
  timer: "#145cb8",
  "exam-countdown": "#3d8ae8",
};

const stroke = {
  fill: "none",
  stroke: "#ffffff",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const solid = { fill: "#ffffff" } as const;

const GLYPHS: Record<string, ReactElement> = {
  gpa: (
    <>
      <path d="M12 4.2L3.4 8.4 12 12.6l8.6-4.2z" {...stroke} />
      <path d="M6.6 10.4v4.8c0 1.8 2.4 3.2 5.4 3.2s5.4-1.4 5.4-3.2v-4.8" {...stroke} />
      <path d="M20.6 8.4v5" {...stroke} />
    </>
  ),
  "final-grade": (
    <>
      <path d="M5.4 3.4h13.2v17.2H5.4z" {...stroke} />
      <path d="M8.6 9.2h6.8M8.6 12.6h6.8" {...stroke} />
      <path d="M8.8 16.4l2 2 4-4.4" {...stroke} />
    </>
  ),
  citation: (
    <>
      <path d="M4.4 14.6c0-4.4 1.8-7.2 5-8.4v2.8c-1.5.9-2.3 2.3-2.4 4.2h2.4v5.4H4.4z" {...solid} />
      <path d="M13.6 14.6c0-4.4 1.8-7.2 5-8.4v2.8c-1.5.9-2.3 2.3-2.4 4.2h2.4v5.4h-5z" {...solid} />
    </>
  ),
  "reading-time": (
    <>
      <path d="M12 6.4c-2-1.6-4.4-2.2-7.6-2v12.4c3.2-.2 5.6.4 7.6 2 2-1.6 4.4-2.2 7.6-2V4.4c-3.2-.2-5.6.4-7.6 2z" {...stroke} />
      <path d="M12 6.4v12.4" {...stroke} />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.4" r="7.4" {...stroke} />
      <path d="M12 9.6v3.8l2.6 1.6" {...stroke} />
      <path d="M9.4 2.8h5.2" {...stroke} />
    </>
  ),
  "exam-countdown": (
    <>
      <rect x="3.6" y="5" width="16.8" height="15.4" rx="2.4" {...stroke} />
      <path d="M3.6 9.6h16.8M8.4 3.4v3.2M15.6 3.4v3.2" {...stroke} />
      <path d="M12 12.4v3l2 1.4" {...stroke} />
    </>
  ),
};

export function ToolGrid() {
  return (
    <ul className="grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-5">
      {tools.map((tool) => (
        <li key={tool.slug}>
          <Link
            href={`/${tool.slug}`}
            title={`${tool.title}, ${tool.blurb.toLowerCase()}`}
            className="group flex flex-col items-center no-underline"
          >
            <span
              style={{ backgroundColor: TINTS[tool.slug] }}
              className="flex h-14 w-14 items-center justify-center rounded-[23%] shadow-card transition-transform duration-150 group-hover:-translate-y-0.5 lg:h-16 lg:w-16"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[55%] w-[55%]">
                {GLYPHS[tool.slug]}
              </svg>
            </span>
            <span className="mt-2 block w-full truncate text-center text-[12px] leading-tight text-foreground">
              {tool.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
