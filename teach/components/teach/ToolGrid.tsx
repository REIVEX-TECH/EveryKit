"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactElement } from "react";
import { CATEGORIES, tools, type Category } from "@/data/tools";

/**
 * The tools as a launcher, filtered by a row of category chips.
 *
 * The chip row matches the hub's exactly: a filled blue chip for the active
 * filter, outlined chips for the rest, each a real button carrying
 * `aria-pressed`. "All" is selected by default, so the server renders every tile
 * and a crawler sees the whole set; clicking a chip filters the grid. Same tiles
 * as every kit: one white glyph on one flat tint, corners at 23 percent.
 */

const TINTS: Record<string, string> = {
  rubric: "#ff8a4c",
  gradebook: "#1d81f2",
  worksheet: "#1769d4",
  curve: "#0e63c4",
  "bubble-sheet": "#2461c0",
  "result-cards": "#1b6fd6",
  "random-picker": "#2f6fd0",
  groups: "#3d8ae8",
  seating: "#145cb8",
  attendance: "#2a74e0",
  "name-labels": "#2d80e4",
  certificate: "#3579d6",
  timetable: "#1156a8",
  timer: "#4a93ef",
  "lesson-plan": "#2f6fd0",
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
  rubric: (
    <>
      <rect x="3.6" y="4.4" width="16.8" height="15.2" rx="2" {...stroke} />
      <path d="M9 4.4v15.2M3.6 9.6h16.8M3.6 14.4h16.8" {...stroke} />
    </>
  ),
  gradebook: (
    <>
      <rect x="4.4" y="3.4" width="15.2" height="17.2" rx="2" {...stroke} />
      <path d="M7.6 8h5M7.6 12h5" {...stroke} />
      <path d="M14.6 15.6l1.6 1.6 3-3.4" {...stroke} />
    </>
  ),
  worksheet: (
    <>
      <path d="M5.4 3.6h9.2l4 4v13H5.4z" {...stroke} />
      <path d="M14.6 3.6v4h4" {...stroke} />
      <path d="M8 11.6h8M8 14.6h8M8 17.4h5" {...stroke} />
    </>
  ),
  curve: (
    <>
      <path d="M3.6 18.4c3-0.2 4.2-11 8.4-11s5.4 10.8 8.4 11" {...stroke} />
      <path d="M3.6 20.4h16.8" {...stroke} />
    </>
  ),
  "bubble-sheet": (
    <>
      <rect x="4.4" y="3.6" width="15.2" height="16.8" rx="2" {...stroke} />
      <circle cx="8" cy="8.4" r="1.5" {...solid} />
      <circle cx="8" cy="14.4" r="1.5" {...stroke} />
      <path d="M11.6 8.4h5M11.6 14.4h5" {...stroke} />
    </>
  ),
  "result-cards": (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="13.2" rx="2" {...stroke} />
      <path d="M6.6 9h5M6.6 12.4h7" {...stroke} />
      <circle cx="16.4" cy="10.4" r="2.4" {...solid} />
    </>
  ),
  "random-picker": (
    <>
      <circle cx="12" cy="8" r="3.4" {...stroke} />
      <path d="M5.6 20c0-3.6 2.8-6 6.4-6s6.4 2.4 6.4 6" {...stroke} />
      <circle cx="12" cy="8" r="0.9" {...solid} />
    </>
  ),
  groups: (
    <>
      <circle cx="8" cy="8.4" r="2.6" {...stroke} />
      <circle cx="16" cy="8.4" r="2.6" {...stroke} />
      <path d="M3.4 18.4c0-2.8 2-4.6 4.6-4.6s4.6 1.8 4.6 4.6" {...stroke} />
      <path d="M12.8 14.2c0.9-0.3 1.9-0.4 3.2-0.4 2.6 0 4.6 1.8 4.6 4.6" {...stroke} />
    </>
  ),
  seating: (
    <>
      <rect x="3.6" y="4.4" width="4.6" height="4.6" rx="1" {...stroke} />
      <rect x="15.8" y="4.4" width="4.6" height="4.6" rx="1" {...stroke} />
      <rect x="9.7" y="4.4" width="4.6" height="4.6" rx="1" {...solid} />
      <rect x="3.6" y="14" width="4.6" height="4.6" rx="1" {...stroke} />
      <rect x="9.7" y="14" width="4.6" height="4.6" rx="1" {...stroke} />
      <rect x="15.8" y="14" width="4.6" height="4.6" rx="1" {...stroke} />
    </>
  ),
  attendance: (
    <>
      <rect x="4.4" y="3.6" width="15.2" height="16.8" rx="2" {...stroke} />
      <path d="M7.4 8l1.4 1.4 2.4-2.6M7.4 14l1.4 1.4 2.4-2.6" {...stroke} />
      <path d="M13.6 8h3.4M13.6 14h3.4" {...stroke} />
    </>
  ),
  "name-labels": (
    <>
      <rect x="3.6" y="6.4" width="16.8" height="11.2" rx="2.4" {...stroke} />
      <circle cx="8.4" cy="12" r="2" {...solid} />
      <path d="M12 10.4h5.2M12 13.6h3.4" {...stroke} />
    </>
  ),
  certificate: (
    <>
      <circle cx="12" cy="9.6" r="5.4" {...stroke} />
      <path d="M9.4 14l-1.4 6 4-2.2 4 2.2-1.4-6" {...stroke} />
      <path d="M9.6 9.6l1.6 1.6 3.2-3.2" {...stroke} />
    </>
  ),
  timetable: (
    <>
      <rect x="3.6" y="4.6" width="16.8" height="15" rx="2" {...stroke} />
      <path d="M3.6 8.6h16.8M9 8.6v11M15 8.6v11" {...stroke} />
      <rect x="4.4" y="10" width="3.6" height="3" rx="0.6" {...solid} />
      <rect x="10" y="13.4" width="3.6" height="3" rx="0.6" {...solid} />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.4" r="7.4" {...stroke} />
      <path d="M12 9.6v3.8l2.6 1.6" {...stroke} />
      <path d="M9.4 2.8h5.2" {...stroke} />
    </>
  ),
  "lesson-plan": (
    <>
      <path d="M6 3.6h9l3.4 3.4V20.4H6z" {...stroke} />
      <path d="M15 3.6v3.4h3.4" {...stroke} />
      <path d="M8.8 11.2l1.2 1.2 2.2-2.4" {...stroke} />
      <path d="M13.6 11.6h3M8.8 15.6l1.2 1.2 2.2-2.4M13.6 16h3" {...stroke} />
    </>
  ),
};

/** The chips: "All" first, then each category, mirroring the hub's row. */
const FILTERS: Array<{ id: Category | "all"; label: string }> = [
  { id: "all", label: "All" },
  ...CATEGORIES,
];

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

      <ul className="mt-8 grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6">
        {visible.map((tool) => (
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
    </div>
  );
}
