import Link from "next/link";
import type { ReactElement } from "react";
import { tools } from "@/data/tools";

/**
 * The three tools as a launcher, matching the grid on the hub.
 *
 * Same rules everywhere: one white glyph on one flat tint, corners at 23
 * percent of the size, one shadow, and the colours pinned by slug so adding
 * one later never reshuffles the ones already here.
 */

const TINTS: Record<string, string> = {
  resize: "#ff8a4c",
  convert: "#1d81f2",
  "strip-exif": "#1769d4",
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
  resize: (
    <>
      <rect x="2.8" y="7" width="11" height="11" rx="1.8" {...stroke} />
      <path d="M16.4 12.6V19h-6.4" {...stroke} strokeDasharray="2.4 2.2" />
      <path d="M15.4 4.4h5.4v5.4M20.8 4.4l-6.2 6.2" {...stroke} />
    </>
  ),
  convert: (
    <>
      <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2" {...stroke} />
      <circle cx="8.4" cy="10" r="1.6" {...solid} />
      <path d="M4.4 16.8l4.6-4.4 3.2 3 2.8-2.6 4.4 4.2" {...stroke} />
    </>
  ),
  "strip-exif": (
    <>
      <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2" {...stroke} />
      <circle cx="12" cy="11" r="2.4" {...stroke} />
      <path d="M4.4 4l15.2 16" {...stroke} strokeWidth={2} />
    </>
  ),
};

export function ToolGrid() {
  return (
    <ul className="grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6 lg:grid-cols-8">
      {tools.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/${item.slug}`}
            title={`${item.title}, ${item.blurb.toLowerCase()}`}
            className="group flex flex-col items-center no-underline"
          >
            <span
              style={{ backgroundColor: TINTS[item.slug] ?? "#1d81f2" }}
              className="flex h-14 w-14 items-center justify-center rounded-[23%] shadow-card transition-transform duration-150 group-hover:-translate-y-0.5 lg:h-16 lg:w-16"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[55%] w-[55%]">
                {GLYPHS[item.slug]}
              </svg>
            </span>
            <span className="mt-2 block w-full truncate text-center text-[12px] leading-tight text-foreground">
              {item.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
