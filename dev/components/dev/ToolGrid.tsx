"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactElement } from "react";
import { CATEGORIES, tools, type Category } from "@/data/tools";

/**
 * The thirteen tools as a launcher, matching the grid on the hub.
 *
 * Same rules as the hub's: one white glyph on one flat tint, corners at 23
 * percent of the size, one shadow, pinned by slug so a tool added later never
 * reshuffles the colours of the ones already here.
 */

const ACCENT = "#ff8a4c";
const BLUES = ["#1d81f2", "#1769d4", "#2f6fd0", "#3d8ae8", "#145cb8"] as const;

/**
 * JSON takes the one accent square. It is the tool most people arrive for, and
 * the mark carries one orange tile among blues for the same reason.
 */
const TINTS: Record<string, string> = {
  json: ACCENT,
  base64: BLUES[0],
  url: BLUES[1],
  uuid: BLUES[2],
  hash: BLUES[3],
  jwt: BLUES[4],
  regex: BLUES[0],
  diff: BLUES[1],
  timestamp: BLUES[2],
  cron: BLUES[4],
  color: BLUES[3],
  markdown: BLUES[0],
  "json-to-csv": BLUES[2],
  "convert-data": BLUES[4],
  "json-yaml": BLUES[3],
  "json-to-types": BLUES[1],
  "sql-formatter": BLUES[0],
  password: BLUES[4],
  "base-converter": BLUES[2],
  "curl-converter": BLUES[3],
};

const stroke = {
  fill: "none",
  stroke: "#ffffff",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const solid = { fill: "#ffffff" } as const;

/** One glyph per tool, on a 24 unit grid, each the thing the tool is about. */
const GLYPHS: Record<string, ReactElement> = {
  json: (
    <>
      <path d="M9.5 3.5C7 3.5 7 7 7 8.4c0 1.9-1 3.6-2.6 3.6C6 12 7 13.7 7 15.6c0 1.4 0 4.9 2.5 4.9" {...stroke} />
      <path d="M14.5 3.5C17 3.5 17 7 17 8.4c0 1.9 1 3.6 2.6 3.6C18 12 17 13.7 17 15.6c0 1.4 0 4.9-2.5 4.9" {...stroke} />
    </>
  ),
  base64: (
    <>
      <path d="M4 8.5L7 12l-3 3.5M20 8.5L17 12l3 3.5" {...stroke} />
      <path d="M13.6 4.4l-3.2 15.2" {...stroke} />
    </>
  ),
  url: (
    <>
      <path d="M10.2 13.8a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.3 1.3" {...stroke} />
      <path d="M13.8 10.2a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3" {...stroke} />
    </>
  ),
  uuid: (
    <>
      <rect x="3.4" y="6.4" width="17.2" height="11.2" rx="2.4" {...stroke} />
      <circle cx="7.6" cy="12" r="1.3" {...solid} />
      <circle cx="12" cy="12" r="1.3" {...solid} />
      <circle cx="16.4" cy="12" r="1.3" {...solid} />
    </>
  ),
  hash: (
    <>
      <path d="M9.4 3.6L7.6 20.4M16.4 3.6l-1.8 16.8" {...stroke} />
      <path d="M3.8 8.6h16.4M3.2 15.4h16.4" {...stroke} />
    </>
  ),
  jwt: (
    <>
      <path d="M12 3.2l7 3v5.4c0 4.2-2.9 7.4-7 9.2-4.1-1.8-7-5-7-9.2V6.2z" {...stroke} />
      <path d="M8.8 12.2l2.2 2.2 4.2-4.6" {...stroke} />
    </>
  ),
  regex: (
    <>
      <path d="M12 4.4v9M8.2 6.6l7.6 4.4M15.8 6.6l-7.6 4.4" {...stroke} />
      <circle cx="6.6" cy="18" r="1.8" {...solid} />
      <circle cx="17.4" cy="18" r="1.8" {...solid} />
    </>
  ),
  diff: (
    <>
      <path d="M6.6 4.2v10.4M3.6 7.2h6M3.6 18.2h6" {...stroke} />
      <path d="M14.4 6.2h6M14.4 17.8h6M17.4 14.8v6" {...stroke} />
    </>
  ),
  timestamp: (
    <>
      <circle cx="12" cy="12" r="8.2" {...stroke} />
      <path d="M12 7.2V12l3.4 2" {...stroke} />
    </>
  ),
  cron: (
    <>
      <rect x="3.6" y="5" width="16.8" height="15.4" rx="2.4" {...stroke} />
      <path d="M3.6 9.6h16.8M8.4 3.4v3.2M15.6 3.4v3.2" {...stroke} />
      <rect x="10.6" y="12.4" width="2.8" height="2.8" rx="0.8" {...solid} />
      <rect x="15.4" y="16.2" width="2.8" height="2.8" rx="0.8" {...solid} />
    </>
  ),
  color: (
    <>
      <circle cx="12" cy="12" r="8.4" {...stroke} />
      <circle cx="9" cy="9.2" r="1.5" {...solid} />
      <circle cx="15" cy="9.2" r="1.5" {...solid} />
      <circle cx="9" cy="14.8" r="1.5" {...solid} />
      <circle cx="15" cy="14.8" r="1.5" {...solid} />
    </>
  ),
  markdown: (
    <>
      <rect x="2.8" y="6" width="18.4" height="12" rx="2" {...stroke} />
      <path d="M6 15V9l2.4 2.6L10.8 9v6" {...stroke} />
      <path d="M15 9v6M15 15l-2-2.2M15 15l2-2.2" {...stroke} />
    </>
  ),
  "json-to-csv": (
    <>
      <path d="M9.6 4.4C7.4 4.4 7.8 8 5.8 8v0c2 0 1.6 3.6 3.8 3.6" {...stroke} transform="translate(0 4)" />
      <path d="M14.4 4.4c2.2 0 1.8 3.6 3.8 3.6v0c-2 0-1.6 3.6-3.8 3.6" {...stroke} transform="translate(0 4)" />
    </>
  ),
  "convert-data": (
    <>
      <rect x="3.4" y="4.6" width="7.4" height="14.8" rx="1.4" {...stroke} />
      <rect x="13.2" y="4.6" width="7.4" height="14.8" rx="1.4" {...stroke} />
      <path d="M9 9.4l2.4 2.6-2.4 2.6" {...stroke} />
      <path d="M15 9.4l-2.4 2.6 2.4 2.6" {...stroke} />
    </>
  ),
  "json-yaml": (
    <>
      <path d="M8.5 4.5C6.6 4.5 6.6 8 6.6 9c0 1.6-0.9 3-2.2 3 1.3 0 2.2 1.4 2.2 3 0 1 0 4.5 1.9 4.5" {...stroke} />
      <path d="M14 6l2.4 3 2.4-3M16.4 9v5" {...stroke} />
    </>
  ),
  "json-to-types": (
    <>
      <path d="M4 8V6.4A1.4 1.4 0 0 1 5.4 5H8M4 16v1.6A1.4 1.4 0 0 0 5.4 19H8" {...stroke} />
      <path d="M12.4 9.4h5M14.9 9.4V16" {...stroke} />
    </>
  ),
  "sql-formatter": (
    <>
      <ellipse cx="12" cy="6" rx="6.6" ry="2.6" {...stroke} />
      <path d="M5.4 6v6c0 1.4 3 2.6 6.6 2.6s6.6-1.2 6.6-2.6V6" {...stroke} />
      <path d="M5.4 12v5c0 1.4 3 2.6 6.6 2.6s6.6-1.2 6.6-2.6v-5" {...stroke} />
    </>
  ),
  password: (
    <>
      <rect x="4.4" y="10.4" width="15.2" height="9.2" rx="2" {...stroke} />
      <path d="M8 10.4V8a4 4 0 0 1 8 0v2.4" {...stroke} />
      <circle cx="12" cy="15" r="1.4" {...solid} />
    </>
  ),
  "base-converter": (
    <>
      <path d="M6.5 4.6v14.8M6.5 4.6H9M6.5 19.4H9M6.5 12H8.6" {...stroke} />
      <path d="M13.6 8.6a2.4 2.4 0 1 1 3.8 2c-1.4 1.2-3.8 2.4-3.8 4.4h4" {...stroke} />
    </>
  ),
  "curl-converter": (
    <>
      <path d="M8.4 7.2L4.6 12l3.8 4.8" {...stroke} />
      <path d="M15.6 7.2L19.4 12l-3.8 4.8" {...stroke} />
      <path d="M13.4 5.4l-2.8 13.2" {...stroke} />
    </>
  ),
};

/** The chips: "All" first, then each category, mirroring the hub's row. */
const FILTERS: Array<{ id: Category | "all"; label: string }> = [
  { id: "all", label: "All" },
  ...CATEGORIES,
];

/**
 * The tools as a launcher, filtered by a row of category chips.
 *
 * The chip row matches the hub's exactly: a filled blue chip for the active
 * filter, outlined chips for the rest, each a real button carrying
 * `aria-pressed`. "All" is selected by default, so the server renders every
 * tile and a crawler sees the whole catalogue; clicking a chip filters the grid.
 */
export function ToolGrid() {
  const [active, setActive] = useState<Category | "all">("all");
  const visible = active === "all" ? tools : tools.filter((tool) => tool.category === active);
  const countFor = (id: Category | "all") =>
    id === "all" ? tools.length : tools.filter((tool) => tool.category === id).length;

  return (
    <div>
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap justify-center gap-2"
      >
        {FILTERS.map((filter) => {
          const selected = active === filter.id;
          const count = countFor(filter.id);
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={selected}
              aria-label={`${filter.label}, ${count} ${count === 1 ? "tool" : "tools"}`}
              onClick={() => setActive(filter.id)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-[background-color,border-color] duration-150 ${
                selected
                  ? "bg-primary-dark text-white"
                  : "border border-line bg-background text-foreground hover:border-line-strong"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <ul className="mt-8 grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-x-4 lg:grid-cols-8">
        {visible.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/${tool.slug}`}
              title={`${tool.title}, ${tool.blurb.toLowerCase()}`}
              className="group flex flex-col items-center no-underline"
            >
              <span
                style={{ backgroundColor: TINTS[tool.slug] ?? BLUES[0] }}
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
    </div>
  );
}
