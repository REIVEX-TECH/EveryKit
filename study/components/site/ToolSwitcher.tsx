"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { tools } from "@/data/tools";

/**
 * The row of tools, on every tool page.
 *
 * A kit with several tools needs a way across them that is not the back
 * button. Without this the only route from one tool to another is backwards
 * through history, which is invisible on a phone and lost entirely if someone
 * arrived on a tool page from search, which for pages built to be found
 * individually is most people.
 *
 * The current tool is marked with aria-current and carries the filled style, so
 * the row also answers "where am I" rather than only "where can I go". It is
 * not on the kit's home page: that page is the launcher, and a row of pills
 * above a grid of the same tools says the same thing twice.
 *
 * Three things make the overflow legible, because the native scrollbar was
 * doing none of them. On a trackpad it is hidden until you scroll, so the row
 * looked like it simply ended; on a phone it is hidden always. So: the
 * scrollbar is hidden deliberately rather than left to chance, a fade over the
 * right edge shows the row continues, and a chevron sits past the fade. Both
 * appear only while there is more to reach and go when you get to the end.
 *
 * The fade and the chevron are painted with pointer-events: none and sit
 * outside the scrolling box, so neither can swallow a tap and neither can cover
 * a focus ring on the last pill. That last part is why the fade is not simply
 * an overlay on the row.
 */
export function ToolSwitcher({ current }: { current: string | null }) {
  const row = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const [focused, setFocused] = useState(false);

  /** True while there is still row to the right of what is on screen. */
  const measure = useCallback(() => {
    const container = row.current;
    if (!container) return;
    // A pixel of slack: sub-pixel layout means scrollLeft rarely lands exactly
    // on the maximum, and without it the chevron never quite disappears.
    const remaining = container.scrollWidth - container.clientWidth - container.scrollLeft;
    setMore(remaining > 1);
  }, []);

  useEffect(() => {
    const container = row.current;
    if (!container) return;

    // The current pill scrolled into view, which is the only reason this was a
    // client component before the affordance existed. On a later tool the
    // highlighted pill starts off screen, so the row would show the first few
    // and silently fail to say which one you are on. Only the row's own
    // scrollLeft is touched, never scrollIntoView, so this cannot move the page.
    if (current !== null) {
      const active = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (active) {
        const target = active.offsetLeft - (container.clientWidth - active.offsetWidth) / 2;
        const max = container.scrollWidth - container.clientWidth;
        if (max > 0) container.scrollLeft = Math.max(0, Math.min(target, max));
      }
    }

    measure();

    // Measured again after a frame and again after the webfont settles.
    // The first measurement runs before IBM Plex has replaced the fallback, and
    // the pills are narrower in the fallback: on a phone the row genuinely
    // overflowed and the first reading said it did not, so the affordance never
    // appeared. Observing the container alone cannot catch this, because the
    // container's own width is what does not change.
    const frame = requestAnimationFrame(measure);
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) measure();
    });

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    // Also the first pill, which is what actually changes width when the font
    // swaps or a label is translated.
    const first = container.firstElementChild;
    if (first) observer.observe(first);

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [current, measure]);

  /** Nudge the row along, for anyone who would rather press than swipe. */
  const nudge = () => {
    const container = row.current;
    if (!container) return;
    const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    container.scrollBy({
      left: Math.round(container.clientWidth * 0.7),
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return (
    <nav aria-label="Study tools" className="relative border-b border-line">
      <div
        ref={row}
        onScroll={measure}
        // Focus events bubble in React, so one pair here covers every pill.
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="ek-scroll-row ek-shell flex gap-2 overflow-x-auto py-3"
      >
        {tools.map((item) => {
          const active = item.slug === current;
          return (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-[14px] no-underline",
                // Not `transition-colors`: that shorthand includes outline-color
                // in Tailwind v4, and a pill whose outline-color is mid
                // transition keeps its focus ring at the starting currentColor,
                // which comes out near black instead of the primary blue.
                "transition-[background-color,border-color,color] duration-150",
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

      {/*
        The affordance. Hidden from screen readers and from the keyboard: the
        pills are all in the tab order already, so this is a hint for a pointer
        and nothing a keyboard user needs another stop for.

        It also goes while anything in the row has focus. A pill can be fully
        visible and still sit in the last sixty pixels, and a focus ring under a
        fade is a focus ring you cannot see. Scroll padding handles the case
        where there is room to scroll clear; this handles the case where there
        is not. The two requirements genuinely conflict there, and the ring is
        the one that has to win.
      */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 right-0 flex items-center pl-10 pr-1",
          "bg-gradient-to-l from-background via-background transition-opacity duration-200",
          more && !focused ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={nudge}
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-line bg-background text-text-light"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
