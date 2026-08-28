"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { specSizeLabel, specs, type PhotoSpec } from "@/data/specs";

/**
 * A searchable index of every supported document, grouped by country.
 *
 * Two jobs at once: a visitor who arrived on the landing can find their exact
 * document by typing "uk visa" or "pan", and a crawler gets a real internal link
 * to each of the country pages, which is how a page of long-tail specs gets
 * found in the first place. Every link is in the server-rendered HTML; the box
 * only filters what is already there.
 */
export function DocumentIndex() {
  const [query, setQuery] = useState("");

  const byCountry = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map<string, PhotoSpec[]>();
    for (const spec of specs) {
      const hay = `${spec.country} ${spec.document} ${specSizeLabel(spec)}`.toLowerCase();
      if (q !== "" && !hay.includes(q)) continue;
      const list = groups.get(spec.country) ?? [];
      list.push(spec);
      groups.set(spec.country, list);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [query]);

  const total = specs.length;

  return (
    <section className="mt-20 border-t border-line pt-12" aria-labelledby="find-your-document">
      <h2 id="find-your-document" className="text-[22px]">
        Find your document
      </h2>
      <p className="mt-2 max-w-[640px] text-[15px] text-text-light">
        {total} passport, visa and ID photo sizes, by country. Each is verified against the issuing
        authority and opens a page for that exact document.
      </p>

      <label className="mt-5 block max-w-[420px]">
        <span className="sr-only">Search documents</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by country or document, like uk visa or PAN"
          className="w-full rounded-full border border-line bg-background px-5 py-3 text-[16px] outline-none focus:border-primary"
        />
      </label>

      {byCountry.length === 0 ? (
        <p className="mt-6 text-[15px] text-text-light">
          Nothing matches that yet. Try a country name, or a document like passport or visa.
        </p>
      ) : (
        <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {byCountry.map(([country, group]) => (
            <div key={country}>
              <h3 className="text-[15px] font-semibold">{country}</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {group.map((spec) => (
                  <li key={spec.slug}>
                    <Link
                      href={`/photo/${spec.slug}`}
                      className="inline-block text-[14px] text-text-light no-underline hover:text-primary-dark hover:underline"
                    >
                      {spec.document}
                      <span className="ml-1 text-[13px] text-text-light">({specSizeLabel(spec)})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
