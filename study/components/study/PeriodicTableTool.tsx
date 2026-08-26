"use client";

import { useMemo, useState } from "react";
import { elements, CATEGORY_TINT, type Element } from "@/data/elements";
import { Note } from "./ui";

const CATEGORIES = Object.keys(CATEGORY_TINT) as Array<keyof typeof CATEGORY_TINT>;

function matches(element: Element, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return (
    element.name.toLowerCase().includes(q) ||
    element.symbol.toLowerCase() === q ||
    element.symbol.toLowerCase().startsWith(q) ||
    String(element.z) === q
  );
}

function Cell({ element, dim, selected, onSelect }: { element: Element; dim: boolean; selected: boolean; onSelect: () => void }) {
  const isF = element.category === "lanthanide" || element.category === "actinide";
  const col = isF ? element.z - (element.category === "lanthanide" ? 57 : 89) + 3 : element.group ?? 3;
  const row = isF ? 1 : element.period;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${element.name}, symbol ${element.symbol}, atomic number ${element.z}, mass ${element.mass}`}
      aria-pressed={selected}
      style={{ gridColumn: col, gridRow: row, backgroundColor: CATEGORY_TINT[element.category], opacity: dim ? 0.25 : 1 }}
      className={`flex aspect-square min-w-[34px] flex-col items-start justify-center rounded-[4px] px-1 leading-none text-foreground transition-opacity ${
        selected ? "ring-2 ring-primary-dark" : ""
      }`}
    >
      <span className="text-[8px] tabular-nums opacity-80">{element.z}</span>
      <span className="w-full text-center text-[13px] font-semibold">{element.symbol}</span>
    </button>
  );
}

export function PeriodicTableTool() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Element | null>(null);

  const main = useMemo(() => elements.filter((e) => e.category !== "lanthanide" && e.category !== "actinide"), []);
  const lanth = useMemo(() => elements.filter((e) => e.category === "lanthanide"), []);
  const actin = useMemo(() => elements.filter((e) => e.category === "actinide"), []);

  const detail = selected;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex-1">
          <span className="sr-only">Search elements</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, symbol or number"
            className="w-full rounded-full border border-line bg-background px-4 py-2 text-[15px] outline-none focus:border-primary sm:max-w-[320px]"
          />
        </label>
      </div>

      {detail ? (
        <div aria-live="polite" className="ek-card p-4" style={{ borderLeft: `6px solid ${CATEGORY_TINT[detail.category]}` }}>
          <div className="flex items-baseline gap-3">
            <span className="text-[32px] font-semibold">{detail.symbol}</span>
            <span className="text-[18px]">{detail.name}</span>
            <span className="ml-auto text-[14px] text-text-light">number {detail.z}</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[14px] sm:grid-cols-4">
            <div><dt className="text-text-light">Atomic mass</dt><dd className="font-semibold tabular-nums">{detail.mass}{detail.estimated ? "*" : ""}</dd></div>
            <div><dt className="text-text-light">Category</dt><dd className="font-semibold">{detail.category}</dd></div>
            <div><dt className="text-text-light">Group</dt><dd className="font-semibold">{detail.group ?? "f-block"}</dd></div>
            <div><dt className="text-text-light">Period</dt><dd className="font-semibold">{detail.period}</dd></div>
          </dl>
          {detail.estimated ? <p className="mt-2 text-[13px] text-text-light">* No stable isotope: the mass is the mass number of the best-known isotope.</p> : null}
        </div>
      ) : (
        <Note tone="quiet">Pick an element to see its details. Everything is a reference; nothing is stored or sent anywhere.</Note>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
            {main.map((e) => (
              <Cell key={e.z} element={e} dim={!matches(e, query)} selected={selected?.z === e.z} onSelect={() => setSelected(e)} />
            ))}
          </div>
          <div className="mt-[3px] grid gap-[3px]" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
            {lanth.map((e) => (
              <Cell key={e.z} element={e} dim={!matches(e, query)} selected={selected?.z === e.z} onSelect={() => setSelected(e)} />
            ))}
            {actin.map((e) => (
              <Cell key={e.z} element={e} dim={!matches(e, query)} selected={selected?.z === e.z} onSelect={() => setSelected(e)} />
            ))}
          </div>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-text-light">
        {CATEGORIES.map((c) => (
          <li key={c} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ backgroundColor: CATEGORY_TINT[c] }} />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
