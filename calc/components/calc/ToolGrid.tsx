import Link from "next/link";
import type { ReactElement } from "react";
import { tools } from "@/data/tools";

/**
 * The five tools as a launcher, matching the grid on the hub.
 *
 * Same rules: one white glyph on one flat tint, corners at 23 percent, one
 * shadow, pinned by slug so a tool added later never reshuffles the colours.
 */

const TINTS: Record<string, string> = {
  age: "#ff8a4c",
  "date-difference": "#1d81f2",
  units: "#1769d4",
  emi: "#2f6fd0",
  percentage: "#145cb8",
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
  age: (
    <>
      <circle cx="12" cy="8.4" r="3.4" {...solid} />
      <path d="M5.8 19.8c0-3.4 2.8-6 6.2-6s6.2 2.6 6.2 6z" {...solid} />
    </>
  ),
  "date-difference": (
    <>
      <rect x="3.6" y="5" width="16.8" height="15.4" rx="2.4" {...stroke} />
      <path d="M3.6 9.6h16.8M8.4 3.4v3.2M15.6 3.4v3.2" {...stroke} />
      <path d="M8.2 15h7.6M12.6 12.4l3.2 2.6-3.2 2.6" {...stroke} />
    </>
  ),
  units: (
    <>
      <rect x="2.8" y="8.4" width="18.4" height="7.2" rx="1.8" {...stroke} />
      <path d="M7 8.4v3.4M12 8.4v4.4M17 8.4v3.4" {...stroke} />
    </>
  ),
  emi: (
    <>
      <rect x="4.4" y="3.4" width="15.2" height="17.2" rx="2.4" {...stroke} />
      <path d="M8 7.6h8" {...stroke} />
      <rect x="7.6" y="11.4" width="2.4" height="2.4" rx="0.6" {...solid} />
      <rect x="14" y="11.4" width="2.4" height="2.4" rx="0.6" {...solid} />
      <rect x="7.6" y="16" width="2.4" height="2.4" rx="0.6" {...solid} />
      <rect x="14" y="16" width="2.4" height="2.4" rx="0.6" {...solid} />
    </>
  ),
  percentage: (
    <>
      <path d="M5.4 18.6L18.6 5.4" {...stroke} strokeWidth={2} />
      <circle cx="7.6" cy="7.6" r="2.6" {...stroke} />
      <circle cx="16.4" cy="16.4" r="2.6" {...stroke} />
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
