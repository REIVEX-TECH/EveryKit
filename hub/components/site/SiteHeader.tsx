import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * The hub's own header. Same wordmark as the kits, but no kit name beside it
 * and no "All kits" link — this is where that link goes.
 *
 * The links carry a 24px minimum height, matching the kits: at this type size a
 * bare anchor is about 22px tall, under WCAG 2.5.8, and these are standalone
 * navigation rather than links inside a sentence.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="ek-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex min-h-[24px] items-center text-[17px] no-underline">
          <Wordmark />
        </Link>
        <Link
          href="/about"
          className="inline-flex min-h-[24px] items-center text-[14px] text-text-light no-underline hover:text-primary-dark"
        >
          About
        </Link>
      </div>
    </header>
  );
}
