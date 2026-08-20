import type { Metadata } from "next";
import Link from "next/link";
import { ToolSwitcher } from "@/components/site/ToolSwitcher";
import { ToolGrid } from "@/components/study/ToolGrid";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}, calculators and helpers for students` },
  description:
    "GPA, what you need on the final, citations in APA 7 and MLA 9, reading time, and a pomodoro timer. Five student tools that run in your browser.",
  alternates: { canonical: absoluteUrl("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  description: "Five browser-based tools for students. Nothing is stored.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ToolSwitcher current={null} />

      <div className="ek-shell py-10 sm:py-14">
        <div className="text-center">
          <h1 className="mx-auto max-w-[340px] text-[32px] leading-[1.15] sm:max-w-[460px] sm:text-[40px]">
            Calculators and helpers for students
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[17px] text-text-light">
            The five that come up every term. Each one runs in this page, so your grades and your
            essay stay on your own device.
          </p>
        </div>

        <div className="mt-10">
          <ToolGrid />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          No account, nothing stored, nothing uploaded.
        </p>

        <section className="mt-16 max-w-[64ch]">
          <h2 className="text-[22px]">What these do differently</h2>
          <p className="mt-3 text-[16px] text-text-light">
            The GPA calculator weights by credits, which is what a registrar does and what a plain
            average of your grades does not. The final grade calculator says when a target is out
            of reach instead of telling you to score 137 percent on the exam. The citation
            generator keeps the italics when you copy, because italics are part of being correct.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            The reading time estimate names the font, the size, the spacing and the margins it
            assumes for a page count, rather than presenting a number as though those did not
            decide it.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">Every tool</h2>
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
