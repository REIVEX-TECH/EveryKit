import { HUB_HOSTNAME, HUB_URL, KIT_NAME } from "@/lib/site";
import { Wordmark } from "./Wordmark";

/**
 * The shared EveryKit header: wordmark to the hub, separator, kit name on the
 * left; a single link back to the hub on the right. Nothing else goes here.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="ek-shell flex h-16 items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-[17px]">
          <a href={HUB_URL} className="no-underline">
            <Wordmark />
          </a>
          <span aria-hidden="true" className="text-line-strong">
            /
          </span>
          <span className="text-text-light">{KIT_NAME}</span>
        </p>

        <a href={HUB_URL} className="text-[14px] text-text-light no-underline hover:text-primary-dark">
          All kits <span aria-hidden="true">→</span>{" "}
          <span className="hidden sm:inline">{HUB_HOSTNAME}</span>
        </a>
      </div>
    </header>
  );
}
