"use client";

import { useMemo, useState } from "react";
import type { KitCategory } from "@/data/kits";

export type DirectoryKit = {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  status: "live" | "soon";
  category: KitCategory;
  icon: string;
  outputAlt: string;
};

type Props = {
  kits: DirectoryKit[];
  categories: Array<{ id: KitCategory | "all"; label: string }>;
};

/**
 * The directory: category boxes on top, an app-icon grid below.
 *
 * Filtering is component state, not a route. There is one page of tools and
 * every tool is in the server-rendered HTML — a crawler sees all of them
 * whatever is selected, and nobody waits for a navigation to change shelf.
 */
export function KitDirectory({ kits, categories }: Props) {
  const [active, setActive] = useState<KitCategory | "all">("all");

  // A shelf with nothing live on it is not a shelf. With two tools this keeps
  // the row honest rather than padding it out.
  const shown = useMemo(
    () =>
      categories.filter(
        (c) => c.id === "all" || kits.some((k) => k.category === c.id && k.status === "live"),
      ),
    [categories, kits],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("all", kits.filter((k) => k.status === "live").length);
    for (const kit of kits) {
      if (kit.status !== "live") continue;
      map.set(kit.category, (map.get(kit.category) ?? 0) + 1);
    }
    return map;
  }, [kits]);

  const visible = active === "all" ? kits : kits.filter((k) => k.category === active);

  return (
    <div>
      {/* Sized to their content, never a full-width empty shell. */}
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-3">
        {shown.map((category) => {
          const selected = active === category.id;
          const count = counts.get(category.id) ?? 0;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(category.id)}
              className={`ek-card flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                selected ? "border-primary bg-background" : "bg-bg-soft hover:border-line-strong"
              }`}
            >
              <CategoryGlyph id={category.id} />
              <span>
                <span className="block text-[15px] font-semibold text-foreground">
                  {category.label}
                </span>
                <span className="block text-[13px] text-text-light">
                  {count} {count === 1 ? "tool" : "tools"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((kit) => (
          <li key={kit.slug}>
            {kit.status === "live" ? (
              <a href={kit.url} className="group block no-underline">
                <Tile kit={kit} />
              </a>
            ) : (
              <div>
                <Tile kit={kit} muted />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tile({ kit, muted = false }: { kit: DirectoryKit; muted?: boolean }) {
  return (
    <>
      <span
        className={`ek-card flex aspect-square items-center justify-center bg-background transition-colors ${
          muted ? "opacity-45" : "group-hover:border-primary"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kit.icon} alt={kit.outputAlt} width={48} height={48} className="h-12 w-12" />
      </span>
      <span className="mt-3 flex items-baseline gap-2">
        <span className="text-[15px] font-semibold text-foreground">{kit.name}</span>
        {muted ? (
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-text-light">
            soon
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-[13px] text-text-light">{kit.tagline}</span>
    </>
  );
}

/** Small, quiet marks in the same corner-radius language as the brand. */
function CategoryGlyph({ id }: { id: KitCategory | "all" }) {
  const common = { width: 22, height: 22, "aria-hidden": true } as const;
  if (id === "photos") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <rect x="4" y="3" width="16" height="18" rx="3" fill="#1d81f2" />
        <circle cx="12" cy="10" r="3" fill="#ffffff" />
        <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5z" fill="#ffffff" />
      </svg>
    );
  }
  if (id === "documents") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M6 2h8l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" fill="#1d81f2" />
        <path d="M14 2l5 5h-5z" fill="#ff8a4c" />
        <rect x="8" y="11" width="8" height="1.6" rx="0.8" fill="#ffffff" />
        <rect x="8" y="15" width="8" height="1.6" rx="0.8" fill="#ffffff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <rect x="3" y="3" width="8" height="8" rx="2" fill="#1d81f2" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="#ff8a4c" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="#1d81f2" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="#1d81f2" />
    </svg>
  );
}
