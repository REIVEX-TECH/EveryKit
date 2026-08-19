import type { Metadata } from "next";
import Link from "next/link";
import { ToolSwitcher } from "@/components/site/ToolSwitcher";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: { absolute: `${SITE_NAME}, count, convert and clean text` },
  description:
    "Four small text tools: a word counter, a case converter, a cleaner for messy text, and a lorem ipsum generator. Everything computes as you type.",
  alternates: { canonical: absoluteUrl("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "Browser-based text tools: word counting, case conversion, cleaning and lorem ipsum.",
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
        <h1 className="max-w-[20ch] text-[32px] leading-tight sm:text-[38px]">
          Small text tools that load instantly
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          Four things people need constantly. Each one computes as you type, in this
          page, with nothing sent anywhere.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/${tool.slug}`}
                className="ek-card flex h-full flex-col p-5 no-underline transition-colors hover:border-line-strong"
              >
                <span className="text-[17px] font-semibold text-foreground">{tool.title}</span>
                <span className="mt-1 text-[14px] text-text-light">{tool.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-14 max-w-[64ch]">
          <h2 className="text-[22px]">Why these are worth having</h2>
          <p className="mt-3 text-[16px] text-text-light">
            Tools like these usually arrive wrapped in adverts, and most of them get
            the awkward cases wrong. The counter here understands the Urdu full stop,
            so a paragraph of Urdu is not reported as one sentence. It counts an emoji
            as the one character it looks like. The case converter leaves NASA alone
            rather than turning it into Nasa.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            None of that is clever, it is just the part everybody skips.
          </p>
        </section>
      </div>
    </>
  );
}
