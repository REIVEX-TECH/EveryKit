"use client";

import { useMemo, useRef, useState } from "react";
import type { CatalogEntry } from "@/data/kits";

/**
 * Type-ahead across every tool on the platform.
 *
 * Progressive enhancement: the full catalogue is rendered on the server below
 * this, so a crawler and a visitor with no JavaScript both see every tool and
 * every link. This only makes finding one faster. It searches names, kit names
 * and synonyms, ranks a name that starts with the query above one that merely
 * contains it, and is driveable from the keyboard: the arrows move the
 * highlight, Enter opens it, Escape clears.
 */
export function ToolSearch({ entries }: { entries: CatalogEntry[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return [];
    const scored: Array<{ entry: CatalogEntry; score: number }> = [];
    for (const entry of entries) {
      const name = entry.tool.name.toLowerCase();
      const hay = [name, entry.kitName.toLowerCase(), ...entry.tool.synonyms].join(" ");
      if (!hay.includes(q)) continue;
      // Rank: a name starting with the query first, then a word in the name,
      // then anything matched through a synonym.
      const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2;
      scored.push({ entry, score });
    }
    return scored
      .sort((a, b) => a.score - b.score || a.entry.tool.name.localeCompare(b.entry.tool.name))
      .slice(0, 8)
      .map((s) => s.entry);
  }, [query, entries]);

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
          Search every tool
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
          placeholder="Search every tool, like resize, invoice or QR"
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
              Nothing matches that. Try a word for what the tool does.
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
