"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
 * The directory of letter types, filterable. Fourteen is enough that typing
 * "landlord" beats reading the whole list, and few enough that the list is
 * still worth showing in full.
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
          {matches.map((type) => (
            <li key={type.slug}>
              <Link
                href={`/letter/${type.slug}`}
                className="ek-card block p-4 no-underline transition-colors hover:border-primary"
              >
                <span className="block text-[16px] font-semibold text-foreground">
                  {type.title}
                </span>
                <span className="mt-1 block text-[14px] text-text-light">
                  {type.whoItsFor}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
