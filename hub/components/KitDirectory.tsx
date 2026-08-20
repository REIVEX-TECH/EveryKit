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
 * The directory: a centred row of category chips, an app-icon grid below.
 *
 * Filtering is component state, not a route. There is one page of tools and
 * every tool is in the server-rendered HTML — a crawler sees all of them
 * whatever is selected, and nobody waits for a navigation to change shelf.
 *
 * The chips are real buttons carrying `aria-pressed`, so the filter is a set of
 * toggles to a screen reader and reachable by tab and space like any other
 * control. The tool count sits in each chip's accessible name rather than on
 * screen: it was a second line of type per chip, and the grid underneath
 * answers the same question by being visible.
 */
export function KitDirectory({ kits, categories }: Props) {
  const [active, setActive] = useState<KitCategory | "all">("all");

  // A shelf with nothing live on it is not a shelf. This keeps the row honest
  // rather than padding it out with an empty category.
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
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap justify-center gap-2"
      >
        {shown.map((category) => {
          const selected = active === category.id;
          const count = counts.get(category.id) ?? 0;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected}
              // The count is here and not on screen, so the chip still answers
              // "how many" to anyone who cannot scan the grid below it.
              aria-label={`${category.label}, ${count} ${count === 1 ? "tool" : "tools"}`}
              onClick={() => setActive(category.id)}
              // Not `transition-colors`: that shorthand includes outline-color,
              // and a chip whose outline-color is being transitioned keeps the
              // ring at its starting currentColor when focus arrives, so the
              // focus ring came out near black instead of the primary blue the
              // design system asks for. Measured: rgb(23,23,23) with the
              // shorthand, rgb(29,129,242) without it. Only the two colours
              // that actually change on hover are animated.
              className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-[background-color,border-color] duration-150 ${
                selected
                  ? "bg-primary-dark text-white"
                  : "border border-line bg-background text-foreground hover:border-line-strong"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((kit) => (
          <li key={kit.slug}>
            {kit.status === "live" ? (
              <a href={kit.url} className="group block text-center no-underline">
                <Tile kit={kit} />
              </a>
            ) : (
              <div className="text-center">
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
        className={`ek-card mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-[18px] bg-background transition-colors ${
          muted ? "opacity-45" : "group-hover:border-primary"
        }`}
      >
        {/*
          Decorative: the kit's name is right underneath in text, so describing
          the glyph as well would have a screen reader say the same thing twice.
          The tagline follows it off screen, which is the part a picture cannot
          carry.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kit.icon} alt="" width={40} height={40} className="h-10 w-10" />
      </span>
      <span className="mt-2.5 block text-[13px] leading-snug text-foreground">
        {kit.name}
        <span className="sr-only">, {kit.tagline}</span>
      </span>
      {muted ? (
        <span className="mt-1 inline-block rounded-full border border-line px-2 py-0.5 text-[11px] text-text-light">
          soon
        </span>
      ) : null}
    </>
  );
}
