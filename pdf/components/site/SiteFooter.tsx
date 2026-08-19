import Link from "next/link";
import { HUB_URL, PARENT_NAME, PARENT_URL } from "@/lib/site";

/**
 * The shared EveryKit footer, identical across every kit. Attribution line plus
 * three links. Nothing else belongs here — the per-country links that used to
 * sit in this footer now live in <OtherSizes />, which is a real navigation
 * section rather than footer furniture.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-bg-soft">
      <div className="ek-shell flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] text-text-light">
          An EveryKit tool by{" "}
          <a className="ek-link" href={PARENT_URL} rel="noopener">
            {PARENT_NAME}
          </a>
        </p>

        <nav className="flex gap-6" aria-label="Footer">
          <a href={HUB_URL} className="text-[14px] text-text-light no-underline hover:text-primary-dark">
            All kits
          </a>
          <Link
            href="/privacy"
            className="text-[14px] text-text-light no-underline hover:text-primary-dark"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[14px] text-text-light no-underline hover:text-primary-dark"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
