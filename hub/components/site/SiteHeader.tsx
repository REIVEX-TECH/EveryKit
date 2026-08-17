import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * The hub's own header. Same wordmark as the kits, but no kit name beside it
 * and no "All kits" link — this is where that link goes.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="ek-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-[17px] no-underline">
          <Wordmark />
        </Link>
        <Link
          href="/about"
          className="text-[14px] text-text-light no-underline hover:text-primary-dark"
        >
          About
        </Link>
      </div>
    </header>
  );
}
