import Link from "next/link";
import type { ReactElement } from "react";
import { kinds } from "@/data/kinds";

/**
 * The eight kinds of code as a launcher, matching the grid on the hub.
 *
 * Same rules everywhere: one white glyph on one flat tint, corners at 23
 * percent of the size, one shadow, and the colours pinned by slug so adding
 * one later never reshuffles the ones already here.
 */

const TINTS: Record<string, string> = {
  url: "#ff8a4c",
  text: "#1d81f2",
  wifi: "#1769d4",
  vcard: "#2f6fd0",
  whatsapp: "#3d8ae8",
  email: "#145cb8",
  sms: "#2a74e0",
  event: "#4a93ef",
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
  url: (
    <>
      <path d="M10.2 13.8a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.3 1.3" {...stroke} />
      <path d="M13.8 10.2a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3" {...stroke} />
    </>
  ),
  text: (
    <>
      <path d="M4.4 6.6h15.2M4.4 11h15.2M4.4 15.4h10.4M4.4 19.8h6.6" {...stroke} />
    </>
  ),
  wifi: (
    <>
      <path d="M3.4 8.6a13 13 0 0 1 17.2 0" {...stroke} />
      <path d="M6.6 12.4a8.4 8.4 0 0 1 10.8 0" {...stroke} />
      <path d="M9.8 16a4 4 0 0 1 4.4 0" {...stroke} />
      <circle cx="12" cy="19.4" r="1.4" {...solid} />
    </>
  ),
  vcard: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" {...stroke} />
      <circle cx="8.6" cy="10.8" r="2.1" {...solid} />
      <path d="M5.2 16.4c0-1.9 1.5-3.4 3.4-3.4s3.4 1.5 3.4 3.4z" {...solid} />
      <path d="M14.6 10h4.2M14.6 13.4h4.2" {...stroke} />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4.4 19.6l1.1-3.8a7.7 7.7 0 1 1 2.9 2.8z" {...stroke} />
      <path d="M9.4 9.6c0 3 1.9 4.9 4.9 4.9" {...stroke} />
    </>
  ),
  email: (
    <>
      <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2" {...stroke} />
      <path d="M4 6.6l8 6.2 8-6.2" {...stroke} />
    </>
  ),
  sms: (
    <>
      <path d="M4.4 5.4h15.2a1.6 1.6 0 0 1 1.6 1.6v8a1.6 1.6 0 0 1-1.6 1.6H9l-4 3.4V16.6H4.4a1.6 1.6 0 0 1-1.6-1.6V7a1.6 1.6 0 0 1 1.6-1.6z" {...stroke} />
      <path d="M7.6 10.8h.01M12 10.8h.01M16.4 10.8h.01" {...stroke} strokeWidth={2.2} />
    </>
  ),
  event: (
    <>
      <rect x="3.4" y="4.8" width="17.2" height="15.4" rx="2.2" {...stroke} />
      <path d="M3.4 9.2h17.2M8 3.2v3.2M16 3.2v3.2" {...stroke} />
      <rect x="7" y="12" width="3.4" height="3.2" rx="0.6" {...solid} />
    </>
  ),
};

export function ToolGrid() {
  return (
    <ul className="grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6 lg:grid-cols-8">
      {kinds.map((item) => (
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
