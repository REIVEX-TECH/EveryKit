import Link from "next/link";
import type { ReactElement } from "react";
import { tools } from "@/data/tools";

/**
 * The six tools as a launcher, matching the grid on the hub.
 *
 * Same rules everywhere: one white glyph on one flat tint, corners at 23
 * percent of the size, one shadow, and the colours pinned by slug so adding
 * one later never reshuffles the ones already here.
 */

const TINTS: Record<string, string> = {
  merge: "#ff8a4c",
  split: "#1d81f2",
  extract: "#1769d4",
  organize: "#2f6fd0",
  "images-to-pdf": "#3d8ae8",
  compress: "#145cb8",
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
  merge: (
    <>
      <path d="M4.6 3.6h5.6v2.2H6.8v9.4H4.6z" {...solid} />
      <path d="M9.4 6.6h6l4 4v10.2h-10z" {...stroke} />
      <path d="M15.4 6.6v4h4" {...stroke} />
    </>
  ),
  split: (
    <>
      <path d="M6.4 3.6h5.4l3.4 3.4v3.4H6.4z" {...stroke} />
      <path d="M8.6 13.6h9.2v7h-9.2z" {...stroke} />
      <path d="M3 12h18" {...stroke} strokeDasharray="2.4 2.2" />
    </>
  ),
  extract: (
    <>
      <path d="M5.4 3.6h7.2l4 4v13h-11.2z" {...stroke} />
      <path d="M12.6 3.6v4h4" {...stroke} />
      <path d="M12 10.6v6.2M9.4 14.2l2.6 2.6 2.6-2.6" {...stroke} />
    </>
  ),
  organize: (
    <>
      <rect x="3.4" y="4.4" width="7" height="7" rx="1.6" {...stroke} />
      <rect x="13.6" y="4.4" width="7" height="7" rx="1.6" {...stroke} />
      <rect x="3.4" y="13.6" width="7" height="7" rx="1.6" {...stroke} />
      <rect x="13.6" y="13.6" width="7" height="7" rx="1.6" {...solid} />
    </>
  ),
  "images-to-pdf": (
    <>
      <rect x="3.2" y="5.4" width="11.4" height="9" rx="1.8" {...stroke} />
      <circle cx="6.6" cy="8.6" r="1.2" {...solid} />
      <path d="M4 13l3.2-3 2.4 2.2 2-1.8 2.6 2.6" {...stroke} />
      <path d="M17.4 9.6h3.4v11h-8v-3.4" {...stroke} />
    </>
  ),
  compress: (
    <>
      <path d="M5.4 3.6h7.2l4 4v13h-11.2z" {...stroke} />
      <path d="M12.6 3.6v4h4" {...stroke} />
      <path d="M8.4 12.2h7.2M10.4 15.4l1.6-1.6 1.6 1.6M10.4 9l1.6 1.6L13.6 9" {...stroke} />
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
