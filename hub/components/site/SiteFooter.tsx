import Link from "next/link";
import { PARENT_NAME, PARENT_URL } from "@/lib/site";

/**
 * The shared EveryKit footer. Same shape the kits render, with "All kits"
 * pointing home rather than across a subdomain.
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
      <div className="ek-shell py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-text-light">
            An EveryKit tool by{" "}
            <a className="ek-link" href={PARENT_URL} rel="noopener">
              {PARENT_NAME}
            </a>
          </p>

          <nav className="flex gap-6" aria-label="Footer">
            <Link
              href="/"
              className="inline-flex min-h-[24px] items-center text-[14px] text-text-light no-underline hover:text-primary-dark"
            >
              All kits
            </Link>
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

        <p className="mt-6 border-t border-line pt-6 text-[13px] text-text-light">
          Built by{" "}
          <a className="ek-link" href={PARENT_URL} rel="noopener">
            {PARENT_NAME}
          </a>, a product engineering studio
        </p>
      </div>
    </footer>
  );
}
