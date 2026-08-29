import type { Metadata } from "next";
import { kits } from "@/data/kits";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * A landing for visitors arriving from a local government unit (LGU) referral.
 *
 * It is written to the EveryKit design system (ek-shell, ek-card, ek-btn and the
 * shared tokens), not to guessed utility classes, so it sits inside the shared
 * header and footer like every other hub page. It is marked noindex because it is
 * a referral entry point rather than an organic search page; it still passes link
 * equity on, and returns a normal 200.
 */

export const metadata: Metadata = {
  title: "Free tools for your documents",
  description:
    "EveryKit's free tools for the documents an office asks for: passport and ID photos, PDFs, background removal and formal letters. Everything runs in your browser, so your files are never uploaded.",
  alternates: { canonical: absoluteUrl("/from-lgu") },
  robots: { index: false, follow: true },
  openGraph: { url: absoluteUrl("/from-lgu") },
};

/** The kits most useful for the paperwork an LGU visitor usually needs. */
const FEATURED_SLUGS = ["photos", "background", "pdf", "letters"] as const;

const bySlug = new Map(kits.map((kit) => [kit.slug, kit]));

export default function FromLguPage() {
  const featured = FEATURED_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (kit): kit is NonNullable<typeof kit> => Boolean(kit && kit.status === "live"),
  );

  return (
    <div className="ek-shell py-14 sm:py-16">
      <div className="max-w-[680px]">
        <h1 className="text-[32px] leading-[1.15] sm:text-[40px]">
          Free tools for the documents you were sent to sort out
        </h1>
        <p className="mt-4 text-[17px] text-text-light sm:text-[19px]">
          {SITE_NAME} is a set of small, free web tools. If you were pointed here
          to prepare a photo, a form or a letter, the tool you need is below.
          Everything runs in your own browser, so the file you upload never leaves
          your device and we never see it.
        </p>
      </div>

      <div className="mt-6 max-w-[680px]">
        <p className="ek-card bg-bg-soft p-4 text-[15px] text-text-light">
          Your ID scan, your passport photo and your documents stay on your phone
          or computer. There is nothing to upload, no account to make, and nothing
          to pay.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {featured.map((kit) => (
          <a
            key={kit.slug}
            href={kit.url}
            className="ek-card group flex flex-col p-5 no-underline transition-transform duration-150 hover:-translate-y-0.5"
          >
            <span className="text-[17px] font-semibold text-foreground group-hover:text-primary-dark">
              {kit.name.replace(/^EveryKit /, "")}
            </span>
            <span className="mt-1 flex-1 text-[15px] text-text-light">{kit.tagline}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-primary-dark">
              Open the tool<span aria-hidden="true">→</span>
            </span>
          </a>
        ))}
      </div>

      <div className="mt-10">
        <a href={absoluteUrl("/")} className="ek-btn ek-btn-accent">
          See every tool
        </a>
      </div>

      <p className="mt-8 max-w-[680px] text-[14px] text-text-light">
        Free to use, with no account and nothing to cancel. Every tool works on a
        phone as well as a computer.
      </p>
    </div>
  );
}
