import Link from "next/link";
import { PARENT_NAME, PARENT_URL } from "@/lib/site";

/**
 * The shared EveryKit footer. Same shape the kits render, with "All kits"
 * pointing home rather than across a subdomain.
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
              className="text-[14px] text-text-light no-underline hover:text-primary-dark"
            >
              All kits
            </Link>
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

        <p className="mt-6 border-t border-line pt-6 text-[13px] text-text-light">
          Built by{" "}
          <a className="ek-link" href={PARENT_URL} rel="noopener">
            {PARENT_NAME}
          </a>{" "}
          — a product engineering studio
        </p>
      </div>
    </footer>
  );
}
