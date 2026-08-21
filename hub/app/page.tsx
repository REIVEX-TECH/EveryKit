import type { Metadata } from "next";
import { KitDirectory } from "@/components/KitDirectory";
import { CATEGORIES, kits } from "@/data/kits";
import { PARENT_NAME, PARENT_URL, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME}: small tools for everyday problems`,
  description:
    "Small single-purpose web tools that do one everyday job in about a minute: passport photos, formal letters. Files are processed in your browser and never uploaded.",
  alternates: { canonical: absoluteUrl("/") },
  openGraph: { url: absoluteUrl("/") },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: absoluteUrl("/"),
      description: "Small tools for everyday problems.",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "EveryKit by Reivex",
      url: absoluteUrl("/"),
      parentOrganization: { "@type": "Organization", name: PARENT_NAME, url: PARENT_URL },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="ek-shell py-12 sm:py-16">
        <div className="text-center">
          {/*
            The headline is the h1 now, rather than the wordmark. The lockup is
            already in the header on every page, and a page whose only heading
            is the brand name says nothing about what the page is for.

            The width holds the break between the two thoughts, and it is in
            pixels rather than ch on purpose: a ch is a font metric, so the
            container itself resized when IBM Plex replaced the fallback and the
            page scored a small layout shift for it. Measured at 0.0021 with ch
            against 0.0002 with these. The two values are the two type sizes.
          */}
          <h1 className="mx-auto max-w-[340px] text-[34px] leading-[1.15] sm:max-w-[420px] sm:text-[44px]">
            Small tools for everyday problems
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[17px] text-text-light sm:text-[19px]">
            Free, done in a minute. Your files never leave your device.
          </p>
        </div>

        <div className="mt-9">
          <KitDirectory kits={kits} categories={CATEGORIES} />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          Runs entirely in your browser.
        </p>

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">How every kit works</h2>
          <div className="mt-6 max-w-[640px] space-y-3 text-[16px] text-text-light">
            <p>
              Nothing is uploaded. Your file is processed in your own browser,
              so it never reaches a server of ours.
            </p>
            <p>
              You see the finished result at full quality, so you know whether
              it worked before you take it.
            </p>
            <p>
              Free to use, with no account and nothing to cancel.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * The tick beside the browser line.
 *
 * Decorative, so it is hidden from screen readers: the sentence next to it
 * already says the thing, and "green tick" is not extra information. Success
 * green is the only place this colour appears on the page.
 */
function Tick() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
