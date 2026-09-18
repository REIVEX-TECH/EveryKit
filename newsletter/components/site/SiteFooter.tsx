import Link from "next/link";
import { HUB_URL, PARENT_NAME, PARENT_URL } from "@/lib/site";

/**
 * The shared EveryKit footer, identical across every kit. Attribution line plus
 * three links. Nothing else belongs here — the per-country links that used to
 * sit in this footer now live in <OtherSizes />, which is a real navigation
 * section rather than footer furniture.
 *
 * The three nav links carry a 24px minimum height. At this type size a bare
 * anchor is about 22px tall, under the WCAG 2.5.8 target minimum, and they are
 * standalone navigation rather than links inside a sentence, so the inline
 * exception does not cover them. The attribution link above them is inside a
 * sentence and is left alone. The text size does not change; only the hit area.
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
          <a href={HUB_URL} className="inline-flex min-h-[24px] items-center text-[14px] text-text-light no-underline hover:text-primary-dark">
            All kits
          </a>
          <Link
            href="/privacy"
            className="inline-flex min-h-[24px] items-center text-[14px] text-text-light no-underline hover:text-primary-dark"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-[24px] items-center text-[14px] text-text-light no-underline hover:text-primary-dark"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
