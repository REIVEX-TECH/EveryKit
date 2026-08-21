"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HUB_HOSTNAME, HUB_URL, KIT_NAME } from "@/lib/site";
import { currentTool } from "@/lib/breadcrumb";
import { Wordmark } from "./Wordmark";

/**
 * The shared EveryKit header: a breadcrumb on the left, one hub link on the
 * right, nothing else.
 *
 * EveryKit / Kit / Tool. The wordmark goes to the hub, the kit name to this
 * kit's own home, and the third segment appears only on a tool page and points
 * at that tool's own path.
 *
 * This replaces a lockup that was itself one link to the kit's home. That
 * worked but answered only one question: it could take you back to the start of
 * this kit and nowhere else, and it gave no sense of where in the site you
 * were. Splitting it into segments makes both the position and the two ways out
 * legible in the same row, which is what a breadcrumb is for.
 *
 * A client component only because it needs the current path. Nothing else here
 * is dynamic, and the markup is small enough that the cost is a rounding error.
 *
 * The links carry a 24px minimum height. At this type size a bare anchor is
 * about 22px tall, which is under WCAG 2.5.8, and these are standalone
 * navigation rather than links inside a sentence, so the inline exception does
 * not cover them.
 */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const tool = currentTool(pathname);

  return (
    <header className="border-b border-line">
      <div className="ek-shell flex h-16 items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-[15px] sm:gap-2 sm:text-[17px]">
            <li className="shrink-0">
              <a
                href={HUB_URL}
                className="inline-flex min-h-[24px] items-center no-underline"
              >
                <Wordmark />
              </a>
            </li>

            <Separator />

            <li className="shrink-0">
              <Link
                href="/"
                aria-current={tool ? undefined : "page"}
                className="inline-flex min-h-[24px] items-center text-text-light no-underline hover:text-primary-dark"
              >
                {KIT_NAME}
              </Link>
            </li>

            {tool ? (
              <>
                <Separator />
                {/*
                  The one segment allowed to shrink. On a narrow screen a long
                  tool name would otherwise push the hub link off the row, and
                  the two segments before this one are the ones you navigate
                  with.
                */}
                <li className="min-w-0">
                  <Link
                    href={tool.href}
                    aria-current="page"
                    className="block min-h-[24px] truncate leading-6 text-foreground no-underline hover:text-primary-dark"
                  >
                    {tool.name}
                  </Link>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <a
          href={HUB_URL}
          className="inline-flex min-h-[24px] shrink-0 items-center gap-1 text-[14px] text-text-light no-underline hover:text-primary-dark"
        >
          All kits<span aria-hidden="true">→</span>
          <span className="hidden sm:inline">{HUB_HOSTNAME}</span>
        </a>
      </div>
    </header>
  );
}

/** Decoration between segments, so a screen reader does not read slashes out. */
function Separator() {
  return (
    <li aria-hidden="true" className="shrink-0 text-line-strong">
      /
    </li>
  );
}
