import { AppGlyph, tintFor } from "@/components/AppIcon";
import type { Flagship } from "@/data/kits";

/**
 * The "Start here" row: six flagship tools shown above the full launcher.
 *
 * The point of the row is the moat. Every tile here is a job that ends in a
 * file at an exact size, made on the device and never uploaded, which is the
 * one thing a chat assistant cannot hand back. So these six sit first, slightly
 * larger than a launcher tile, each with a line saying what you get, and the
 * whole catalogue stays below unchanged.
 *
 * Server-rendered: the tiles are plain links, so a crawler and a no-JavaScript
 * visitor get the same six deep links, and nothing here waits on the client.
 */
export function FlagshipRow({ items }: { items: Array<Flagship & { href: string }> }) {
  return (
    <section aria-labelledby="start-here">
      <h2 id="start-here" className="text-[15px] font-semibold uppercase tracking-wide text-text-light">
        Start here
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={`${item.kitSlug}${item.path}`}>
            <a
              href={item.href}
              className="group flex h-full items-center gap-3.5 rounded-2xl border border-line bg-background p-4 no-underline shadow-card transition-transform duration-150 hover:-translate-y-0.5"
            >
              <span
                style={{ backgroundColor: tintFor(item.kitSlug) }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[23%]"
              >
                <AppGlyph slug={item.kitSlug} name={item.label} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-foreground group-hover:text-primary-dark">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-text-light">
                  {item.outcome}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
