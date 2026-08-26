"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogEntry } from "@/data/kits";

/**
 * The command bar: type what you need, not what we call it.
 *
 * Progressive enhancement first: the whole catalogue is server-rendered below
 * this, so a crawler and a no-JavaScript visitor both see every tool and every
 * link. This only makes finding one faster.
 *
 * It matches three ways, in order of confidence: the tool's name, its synonyms,
 * and its intents, the whole-need phrases in the registry ("scan paper to pdf",
 * "compress image to 100kb"). A query that is not a substring of any of those
 * still lands if its meaningful words all appear somewhere in a tool's entry, so
 * "remove the background from my photo" finds the background remover even though
 * nobody wrote that exact sentence. It is driveable from the keyboard: the
 * arrows move the highlight, Enter opens the top hit, Escape clears.
 */

/** The three needs that cycle through the empty box, to show what it takes. */
const EXAMPLE_INTENTS = [
  "passport photo for a us visa",
  "compress an image to 100kb",
  "scan paper to pdf",
];

/**
 * Words too common to carry meaning in a need phrase. Dropped before the
 * word-by-word fallback so "how do i compress an image" leans on "compress" and
 * "image", not on "how" and "do".
 */
const STOP = new Set([
  "a", "an", "the", "to", "of", "for", "my", "me", "i", "is", "it", "in", "on",
  "do", "does", "how", "what", "with", "from", "get", "make", "need", "want",
  "and", "or", "into", "your", "you", "this", "that", "can",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function ToolSearch({ entries }: { entries: CatalogEntry[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Rotate the placeholder through the three examples while the box is empty.
  // Held still for anyone who asks for reduced motion: the swap is small, but
  // the setting is a plain instruction to stop things moving, so it does.
  useEffect(() => {
    if (query !== "") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setExampleIndex((i) => (i + 1) % EXAMPLE_INTENTS.length);
    }, 3200);
    return () => clearInterval(id);
  }, [query]);

  // Precompute each entry's lowercased haystack and intent text once.
  const indexed = useMemo(
    () =>
      entries.map((entry) => {
        const name = entry.tool.name.toLowerCase();
        const intents = entry.tool.intents ?? [];
        const hay = [name, entry.kitName.toLowerCase(), ...entry.tool.synonyms, ...intents]
          .join(" | ")
          .toLowerCase();
        return { entry, name, hay, intentText: intents.join(" | ").toLowerCase() };
      }),
    [entries],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return [];
    const qTokens = tokenize(q);

    const scored: Array<{ entry: CatalogEntry; tier: number; overlap: number; name: string }> = [];
    for (const { entry, name, hay, intentText } of indexed) {
      let tier: number;
      if (name === q) tier = 0;
      else if (name.startsWith(q)) tier = 1;
      else if (name.includes(q)) tier = 2;
      else if (hay.includes(q)) tier = 3;
      else if (qTokens.length > 0 && qTokens.every((t) => hay.includes(t))) tier = 4;
      else if (qTokens.length >= 2 && qTokens.filter((t) => hay.includes(t)).length >= Math.max(2, qTokens.length - 1)) tier = 5;
      else continue;

      // Within a tier, a tool whose intents carry the query words wins: that is
      // the signal that this is the job the person is describing.
      const overlap = qTokens.reduce((n, t) => n + (intentText.includes(t) ? 1 : 0), 0);
      scored.push({ entry, tier, overlap, name });
    }

    return scored
      .sort(
        (a, b) =>
          a.tier - b.tier ||
          b.overlap - a.overlap ||
          a.name.length - b.name.length ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 8)
      .map((s) => s.entry);
  }, [query, indexed]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === "Enter") {
      const chosen = results[active];
      if (chosen) window.location.href = chosen.href;
    } else if (event.key === "Escape") {
      setQuery("");
    }
  }

  const showList = query.trim() !== "" && results.length > 0;

  return (
    <div className="mx-auto max-w-[520px]">
      <div className="relative">
        <label htmlFor="tool-search" className="sr-only">
          Search every tool, or describe what you need
        </label>
        <input
          id="tool-search"
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls="tool-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={`Try “${EXAMPLE_INTENTS[exampleIndex]}”`}
          className="w-full rounded-full border border-line bg-background px-5 py-3 text-[16px] outline-none focus:border-primary"
        />
      </div>

      {query.trim() !== "" ? (
        <ul
          ref={listRef}
          id="tool-search-results"
          role="listbox"
          className="mt-2 overflow-hidden rounded-[14px] border border-line bg-background text-left shadow-card"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-[14px] text-text-light">
              Nothing matches that. Try a word for what the tool does, like scan, compress or invoice.
            </li>
          ) : (
            results.map((entry, index) => (
              <li key={entry.href} role="option" aria-selected={index === active}>
                <a
                  href={entry.href}
                  onMouseEnter={() => setActive(index)}
                  className={[
                    "flex items-baseline justify-between gap-3 px-4 py-2.5 no-underline",
                    index === active ? "bg-primary/5" : "",
                  ].join(" ")}
                >
                  <span className="text-[15px] text-foreground">{entry.tool.name}</span>
                  <span className="shrink-0 text-[13px] text-text-light">
                    {entry.kitName.replace(/^EveryKit /, "")}
                  </span>
                </a>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
