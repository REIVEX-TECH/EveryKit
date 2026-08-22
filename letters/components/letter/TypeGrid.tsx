"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ReactElement } from "react";

/**
 * Only what the grid renders. A whole LetterType carries its `build` function,
 * and functions cannot be handed from a server component to a client one.
 */
export type LetterSummary = {
  slug: string;
  title: string;
  whoItsFor: string;
};

/**
 * Which square each letter type gets.
 *
 * Grouped by subject, which is how the data files are grouped, so the colour is
 * a second signal for the same thing the wording says: everything about a visa
 * looks alike, everything about a tenancy looks alike. Pinned by slug rather
 * than by position, so adding a letter never reshuffles the ones already here.
 */
const GROUPS: Record<string, string[]> = {
  visa: ["visa-invitation", "visa-cover-letter", "visa-appeal", "financial-sponsorship"],
  work: ["employment-verification-request", "noc-request", "resignation", "experience-certificate", "salary-certificate-request", "internship-application"],
  consumer: ["complaint-product-service", "refund-request", "bank-transaction-dispute", "complaint-escalation", "bank-account-closure"],
  housing: ["landlord-repair-request", "notice-to-vacate", "rent-increase-response"],
  personal: ["school-absence", "authorization-letter", "character-reference"],
};

const TINTS: Record<string, string> = {
  visa: "#ff8a4c",
  work: "#1d81f2",
  consumer: "#1769d4",
  housing: "#2f6fd0",
  personal: "#145cb8",
};

const stroke = {
  fill: "none",
  stroke: "#ffffff",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const solid = { fill: "#ffffff" } as const;

/** One glyph per group, on a 24 unit grid, in the launcher's language. */
const GLYPHS: Record<string, ReactElement> = {
  visa: (
    <>
      <rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.4" {...stroke} />
      <circle cx="9" cy="10.6" r="2.1" {...solid} />
      <path d="M5.6 15.8c0-1.9 1.5-3.4 3.4-3.4s3.4 1.5 3.4 3.4z" {...solid} />
      <path d="M14.8 9.6h3.8M14.8 13h3.8" {...stroke} />
    </>
  ),
  work: (
    <>
      <rect x="3.2" y="7" width="17.6" height="12.4" rx="2.2" {...stroke} />
      <path d="M9 7V5.4a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5.4V7" {...stroke} />
      <path d="M3.2 12.4h17.6" {...stroke} />
    </>
  ),
  consumer: (
    <>
      <path d="M4.4 5.4h2.6l2 9.6h8.8l1.8-6.8H7.6" {...stroke} />
      <circle cx="10" cy="18.6" r="1.5" {...solid} />
      <circle cx="16.4" cy="18.6" r="1.5" {...solid} />
    </>
  ),
  housing: (
    <>
      <path d="M3.6 11.4L12 4.2l8.4 7.2" {...stroke} />
      <path d="M5.8 12.8v7.2h12.4v-7.2" {...stroke} />
      <path d="M10.2 20v-4.6h3.6V20" {...stroke} />
    </>
  ),
  personal: (
    <>
      <path d="M3.4 6.4h17.2v11.6H3.4z" {...stroke} />
      <path d="M3.4 7l8.6 6 8.6-6" {...stroke} />
    </>
  ),
};

function groupOf(slug: string): string {
  for (const [group, slugs] of Object.entries(GROUPS)) {
    if (slugs.includes(slug)) return group;
  }
  // A letter added later still gets a square rather than an empty one, chosen
  // from its own slug so it does not move when a neighbour is renamed.
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) % 1000;
  return Object.keys(GROUPS)[hash % Object.keys(GROUPS).length];
}

/**
 * The directory of letter types, filterable. Fourteen is enough that typing
 * "landlord" beats reading the whole list, and few enough that the list is
 * still worth showing in full.
 *
 * The tiles carry the same squircle mark the launchers on the other kits use:
 * a white glyph on one flat tint, corners at 23 percent, one shadow. They stay
 * cards rather than becoming a bare icon grid because each letter needs its
 * "who it is for" line, and fourteen unlabelled squares would be a puzzle.
 */
export function TypeGrid({ types }: { types: LetterSummary[] }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return types;
    return types.filter((type) =>
      `${type.title} ${type.whoItsFor}`.toLowerCase().includes(q),
    );
  }, [query, types]);

  return (
    <div>
      <label htmlFor="letter-search" className="sr-only">
        Search the letters
      </label>
      <input
        id="letter-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="What do you need to write?"
        className="w-full max-w-[420px] rounded-[10px] border border-line bg-background px-3 py-2.5 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
      />

      <p aria-live="polite" className="sr-only">
        {matches.length} of {types.length} letters shown
      </p>

      {matches.length === 0 ? (
        <p className="mt-6 text-[15px] text-text-light">
          Nothing matches that yet. The fourteen letters above are all there is
          for now.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {matches.map((type) => {
            const group = groupOf(type.slug);
            return (
              <li key={type.slug}>
                <Link
                  href={`/letter/${type.slug}`}
                  className="ek-card group flex items-start gap-3 p-4 no-underline transition-colors hover:border-primary"
                >
                  <span
                    style={{ backgroundColor: TINTS[group] }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[23%] shadow-card transition-transform duration-150 group-hover:-translate-y-0.5"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[58%] w-[58%]">
                      {GLYPHS[group]}
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold text-foreground">
                      {type.title}
                    </span>
                    <span className="mt-1 block text-[14px] text-text-light">
                      {type.whoItsFor}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
