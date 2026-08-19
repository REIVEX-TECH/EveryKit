import Link from "next/link";
import { HUB_HOSTNAME, HUB_URL, KIT_NAME } from "@/lib/site";
import { Wordmark } from "./Wordmark";

/**
 * The shared EveryKit header: the wordmark and kit name on the left as one
 * lockup, a single link back to the hub on the right. Nothing else goes here.
 *
 * The lockup links to this kit's own home, not the hub. It used to go to the
 * hub, which meant the one control everybody reaches for to get back to the
 * start of what they are doing took them off the site instead — and left a kit
 * with several tools no way home at all. "All kits" on the right is the
 * explicit hub link, and the only one.
 *
 * The links carry a 24px minimum height. At this type size a bare anchor is
 * about 22px tall, which is under WCAG 2.5.8, and these are standalone
 * navigation rather than links inside a sentence, so the inline exception does
 * not cover them. The text size is unchanged; only the hit area grows.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="ek-shell flex h-16 items-center justify-between gap-4">
        <p className="text-[17px]">
          <Link
            href="/"
            className="inline-flex min-h-[24px] items-center gap-2 no-underline"
          >
            <Wordmark />
            <span aria-hidden="true" className="text-line-strong">
              /
            </span>
            <span className="text-text-light">{KIT_NAME}</span>
          </Link>
        </p>

        <a
          href={HUB_URL}
          className="inline-flex min-h-[24px] items-center gap-1 text-[14px] text-text-light no-underline hover:text-primary-dark"
        >
          All kits<span aria-hidden="true">→</span>
          <span className="hidden sm:inline">{HUB_HOSTNAME}</span>
        </a>
      </div>
    </header>
  );
}
