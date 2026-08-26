import Link from "next/link";
import type { ReactElement } from "react";
import { CATEGORIES, tools } from "@/data/tools";

/**
 * The tools as a launcher, grouped by category.
 *
 * Eleven tools in one flat grid is a wall; four short labelled sets is a menu.
 * The grouping is the whole reason the kit still reads as simple after this
 * unit. Same tile rules as the hub: one white glyph on one flat tint, corners
 * at 23 percent, one shadow, colours pinned by slug.
 */

const TINTS: Record<string, string> = {
  gpa: "#ff8a4c",
  "final-grade": "#1d81f2",
  citation: "#1769d4",
  "reading-time": "#2f6fd0",
  timer: "#145cb8",
  "exam-countdown": "#3d8ae8",
  flashcards: "#2a74e0",
  timetable: "#1156a8",
  "note-cleaner": "#3579d6",
  "scientific-calculator": "#0e63c4",
  "essay-length": "#4a93ef",
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
  flashcards: (
    <>
      <rect x="5.4" y="7.2" width="13.2" height="9" rx="1.8" {...stroke} transform="rotate(-6 12 12)" />
      <rect x="6.6" y="9" width="13.2" height="9" rx="1.8" {...stroke} />
      <path d="M9.6 13.4h7.2" {...stroke} />
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
  "note-cleaner": (
    <>
      <path d="M5.4 3.6h9.2l4 4v13H5.4z" {...stroke} />
      <path d="M14.6 3.6v4h4" {...stroke} />
      <path d="M8 11.6h6M8 14.6h4" {...stroke} />
      <path d="M16.4 16.2l1 1 2-2.2" {...stroke} />
    </>
  ),
  "scientific-calculator": (
    <>
      <rect x="5" y="3.4" width="14" height="17.2" rx="2.2" {...stroke} />
      <rect x="7.4" y="5.8" width="9.2" height="3" rx="0.8" {...stroke} />
      <path d="M8 13h.02M12 13h.02M16 13h.02M8 16.6h.02M12 16.6h.02M16 16.6h.02" {...stroke} strokeWidth="2.4" />
    </>
  ),
  "essay-length": (
    <>
      <path d="M4 6.4h16M4 10h16M4 13.6h10" {...stroke} />
      <path d="M4 18.4h16" {...stroke} strokeDasharray="2 2" />
      <path d="M4 17.2v2.4M20 17.2v2.4" {...stroke} />
    </>
  ),
};

export function ToolGrid() {
  return (
    <div className="flex flex-col gap-9">
      {CATEGORIES.map((category) => {
        const inCategory = tools.filter((tool) => tool.category === category.id);
        if (inCategory.length === 0) return null;
        return (
          <section key={category.id}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">
              {category.label}
            </h2>
            <ul className="mt-4 grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6">
              {inCategory.map((tool) => (
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
          </section>
        );
      })}
    </div>
  );
}
