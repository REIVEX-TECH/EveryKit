import { HUB_HOSTNAME, HUB_URL, KIT_NAME } from "@/lib/site";
import { Wordmark } from "./Wordmark";

/**
 * The shared EveryKit header: wordmark to the hub, separator, kit name on the
 * left; a single link back to the hub on the right. Nothing else goes here.
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
        <p className="flex items-center gap-2 text-[17px]">
          <a href={HUB_URL} className="inline-flex min-h-[24px] items-center no-underline">
            <Wordmark />
          </a>
          <span aria-hidden="true" className="text-line-strong">
            /
          </span>
          <span className="text-text-light">{KIT_NAME}</span>
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
