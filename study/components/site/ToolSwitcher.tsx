"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { tools } from "@/data/tools";

/**
 * The row of tools, on every tool page and on the home page.
 *
 * A kit with several tools needs a way across them that is not the back
 * button. Without this the only route from one tool to another is backwards
 * through history, which is invisible on a phone and lost entirely if someone
 * arrived on a tool page from search — which, for a kit whose pages are built
 * to be found individually, is most people.
 *
 * The current tool is marked with aria-current and carries the filled style, so
 * the row also answers "where am I" rather than only "where can I go".
 *
 * The row scrolls the current pill into view on mount, which is the only reason
 * this is a client component. The pills are wider than a phone screen, so on a
 * later tool the highlighted one starts off-screen: the row would show the
 * first few tools and silently fail to say which one you are on. Only the
 * row's own scrollLeft is touched, never scrollIntoView, so this can never move
 * the page itself.
 */
export function ToolSwitcher({ current }: { current: string | null }) {
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = row.current;
    if (!container || current === null) return;
    const active = container.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;

    const target =
      active.offsetLeft - (container.clientWidth - active.offsetWidth) / 2;
    const max = container.scrollWidth - container.clientWidth;
    if (max <= 0) return;
    container.scrollLeft = Math.max(0, Math.min(target, max));
  }, [current]);

  return (
    <nav aria-label="Study tools" className="border-b border-line">
      <div ref={row} className="ek-shell flex gap-2 overflow-x-auto py-3">
        {tools.map((item) => {
          const active = item.slug === current;
          return (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-[14px] no-underline transition-colors",
                active
                  // primary-dark, not primary: white on #1d81f2 is 3.88:1,
                  // under the 4.5 that 14px text needs. #1769d4 is 5.24:1.
                  ? "border-primary-dark bg-primary-dark text-white"
                  : "border-line text-text-light hover:border-line-strong hover:text-foreground",
              ].join(" ")}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
