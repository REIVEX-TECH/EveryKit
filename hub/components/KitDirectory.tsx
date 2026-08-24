"use client";

import { useEffect, useMemo, useState } from "react";
import { AppGlyph, tintFor } from "@/components/AppIcon";
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
  /** Tool names per kit slug, for the chip previews. From the registry. */
  toolsByKit: Record<string, string[]>;
};

/**
 * The directory: a centred row of category chips, and below them the kits laid
 * out the way a phone lays out its apps.
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
export function KitDirectory({ kits, categories, toolsByKit }: Props) {
  const [active, setActive] = useState<KitCategory | "all">("all");

  // The chip preview. It is a hover and keyboard-focus affordance only: on a
  // touch device, tapping a chip filters as it always has, and no popover
  // appears. `hoverCapable` gates it to devices with a real pointer, computed
  // after mount so the server and the first client render agree (no popover).
  const [preview, setPreview] = useState<KitCategory | "all" | null>(null);
  const [hoverCapable, setHoverCapable] = useState(false);
  useEffect(() => {
    setHoverCapable(window.matchMedia("(hover: hover)").matches);
  }, []);
  const showPreview = (id: KitCategory | "all") => {
    if (hoverCapable) setPreview(id);
  };
  const clearPreview = () => setPreview(null);

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

  // The live kits a chip's preview should list.
  const previewKits = (id: KitCategory | "all"): DirectoryKit[] =>
    (id === "all" ? kits : kits.filter((k) => k.category === id)).filter(
      (k) => k.status === "live",
    );

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
            <span
              key={category.id}
              className="relative"
              onMouseEnter={() => showPreview(category.id)}
              onMouseLeave={clearPreview}
            >
              <button
                type="button"
                aria-pressed={selected}
                // The count is here and not on screen, so the chip still answers
                // "how many" to anyone who cannot scan the grid below it.
                aria-label={`${category.label}, ${count} ${count === 1 ? "tool" : "tools"}`}
                onClick={() => {
                  setActive(category.id);
                  clearPreview();
                }}
                onFocus={() => showPreview(category.id)}
                onBlur={clearPreview}
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

              {preview === category.id ? (
                <CategoryPreview kits={previewKits(category.id)} toolsByKit={toolsByKit} />
              ) : null}
            </span>
          );
        })}
      </div>

      {/*
        Four across on a phone, eight at the full content width, which is what
        puts the icons at roughly the size a home screen uses at each. The
        column count is the only thing that changes: the tile sizes itself from
        the column, so nothing has to be re-tuned per breakpoint.
      */}
      <ul className="mt-10 grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-x-4 lg:grid-cols-8">
        {visible.map((kit) => (
          <li key={kit.slug}>
            {kit.status === "live" ? (
              <a
                href={kit.url}
                // The whole tile is the link, icon and label together, so the
                // target is the square plus its caption rather than a 56px
                // icon with a hairline of text under it.
                title={kit.name}
                aria-label={kit.name}
                className="group flex flex-col items-center no-underline"
              >
                <Tile kit={kit} />
              </a>
            ) : (
              <div className="flex flex-col items-center" title={kit.name}>
                <Tile kit={kit} muted />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The little card that appears under a category chip on hover or keyboard
 * focus. It names the kits on that shelf and their top few tools, so the shelf
 * can be previewed before it is opened.
 *
 * It is `aria-hidden`: everything in it is already reachable by activating the
 * chip, which filters the grid below, and by the full catalogue further down
 * the page, so reading it aloud as well would only double the announcement. It
 * is a pointer-and-keyboard-sighted convenience, not a second source of truth.
 * A touch tap never opens it; it filters, as it always did.
 */
function CategoryPreview({
  kits,
  toolsByKit,
}: {
  kits: DirectoryKit[];
  toolsByKit: Record<string, string[]>;
}) {
  const MAX_KITS = 6;
  const shown = kits.slice(0, MAX_KITS);
  const moreKits = kits.length - shown.length;

  return (
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-full z-20 mt-2 block w-[260px] -translate-x-1/2 rounded-[12px] border border-line bg-background p-3 text-left shadow-card"
    >
      <span className="flex flex-col gap-2">
        {shown.map((kit) => {
          const tools = toolsByKit[kit.slug] ?? [];
          const top = tools.slice(0, 3);
          const extra = tools.length - top.length;
          return (
            <span key={kit.slug} className="block">
              <span className="block text-[13px] font-semibold text-foreground">
                {kit.name.replace(/^EveryKit /, "")}
              </span>
              {top.length > 0 ? (
                <span className="block text-[12px] leading-snug text-text-light">
                  {top.join(", ")}
                  {extra > 0 ? ` and ${extra} more` : null}
                </span>
              ) : null}
            </span>
          );
        })}
        {moreKits > 0 ? (
          <span className="block text-[12px] text-text-light">
            and {moreKits} more {moreKits === 1 ? "kit" : "kits"}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/**
 * One app icon and its name.
 *
 * The square is sized in pixels rather than by the column, so a wide column at
 * a middling viewport does not inflate the icons past the size that makes this
 * read as a launcher. It is centred in whatever column it lands in.
 *
 * The corner radius is a percentage, which keeps the same proportion at both
 * sizes and lands in the 22 to 24 percent range a phone icon uses. It is a
 * rounded rectangle rather than a true superellipse: a real squircle needs a
 * clip path per size, and at 56 and 64 pixels nobody can tell the two apart.
 *
 * One shadow, the card token this site already uses, and nothing else. No
 * gradient, no inner highlight, no glass.
 */
function Tile({ kit, muted = false }: { kit: DirectoryKit; muted?: boolean }) {
  return (
    <>
      <span
        style={{ backgroundColor: tintFor(kit.slug) }}
        className={`flex h-14 w-14 items-center justify-center rounded-[23%] shadow-card transition-transform duration-150 lg:h-16 lg:w-16 ${
          muted ? "opacity-40" : "group-hover:-translate-y-0.5"
        }`}
      >
        <AppGlyph slug={kit.slug} name={kit.name} />
      </span>

      {/*
        One line, clipped with an ellipsis when the column is narrower than the
        name. The full name is still the text in the DOM and is repeated in the
        title and the accessible name, so nothing is lost to the clipping but
        the pixels.
      */}
      <span className="mt-2 block w-full truncate text-center text-[12px] leading-tight text-text-light">
        {kit.name}
      </span>

      {muted ? (
        <span className="mt-1 rounded-full border border-line px-1.5 py-0.5 text-[10px] text-text-light">
          soon
        </span>
      ) : null}
    </>
  );
}
