import type { Metadata } from "next";
import Link from "next/link";
import { ToolGrid } from "@/components/calc/ToolGrid";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}, everyday calculators that just answer` },
  description:
    "Age, the days between two dates, unit conversion, loan instalments, percentages, discounts, VAT and trip fuel cost. Everyday calculators that run in your browser.",
  alternates: { canonical: absoluteUrl("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description: "Browser-based everyday calculators, grouped by dates, everyday maths and money. Nothing is stored.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />


      <div className="ek-shell py-10 sm:py-14">
        <div className="text-center">
          <h1 className="mx-auto max-w-[340px] text-[32px] leading-[1.15] sm:max-w-[460px] sm:text-[40px]">
            Everyday calculators that just answer
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[17px] text-text-light">
            No adverts between you and the number, no sign in, and nothing typed here leaves your
            device.
          </p>
        </div>

        <div className="mt-10">
          <ToolGrid />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          Worked out in your browser, stored nowhere.
        </p>

        <section className="mt-16 max-w-[64ch]">
          <h2 className="text-[22px]">Small things these get right</h2>
          <p className="mt-3 text-[16px] text-text-light">
            The date tools count whole calendar days, so a clock change cannot move an answer, and
            an age turns over on the birthday rather than a day either side of it. The unit
            converter treats temperature as the offset scale it is instead of multiplying it like
            a ratio, which is the most common bug in a converter.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            The loan schedule is worked out in whole cents, so it ends at exactly zero rather than
            a few cents either side. And the percentage page says out loud that a 25 percent rise
            is not undone by a 25 percent fall.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">Every calculator</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/${tool.slug}`}
                  className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
                >
                  {tool.title}
                  <span className="text-text-light">, {tool.blurb.toLowerCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** The success token as a mark, where its contrast is fine. */
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
