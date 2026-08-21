import Link from "next/link";
import type { ReactElement } from "react";
import { tools } from "@/data/tools";

/**
 * The four tools as a launcher, matching the grid on the hub.
 *
 * Same rules everywhere: one white glyph on one flat tint, corners at 23
 * percent of the size, one shadow, and the colours pinned by slug so adding
 * one later never reshuffles the ones already here.
 */

const TINTS: Record<string, string> = {
  "word-counter": "#ff8a4c",
  "case-converter": "#1d81f2",
  "clean-text": "#1769d4",
  "lorem-ipsum": "#2f6fd0",
};

const stroke = {
  fill: "none",
  stroke: "#ffffff",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const GLYPHS: Record<string, ReactElement> = {
  "word-counter": (
    <>
      <path d="M4.4 6.6h15.2M4.4 11h15.2M4.4 15.4h9.4" {...stroke} />
      <path d="M14.6 18.6l2 2 4-4.4" {...stroke} />
    </>
  ),
  "case-converter": (
    <>
      <path d="M3.4 18.4l4.4-11.6 4.4 11.6M4.8 14.8h6" {...stroke} />
      <path d="M20.6 11.4v7M20.6 13.6a3 3 0 1 0 0 4.4" {...stroke} />
    </>
  ),
  "clean-text": (
    <>
      <path d="M9.4 4.4h9M9.4 9h9M9.4 13.6h5.4" {...stroke} />
      <path d="M4.6 12.6l3.2 3.2-4 4h-3.2v-3.2z" {...stroke} transform="translate(3 1)" />
    </>
  ),
  "lorem-ipsum": (
    <>
      <rect x="3.4" y="3.6" width="17.2" height="16.8" rx="2.4" {...stroke} />
      <path d="M6.8 8.4h10.4M6.8 12h10.4M6.8 15.6h6.4" {...stroke} />
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
