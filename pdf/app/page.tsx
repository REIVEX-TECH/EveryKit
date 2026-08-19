import type { Metadata } from "next";
import Link from "next/link";
import { LandingPicker } from "@/components/pdf/LandingPicker";
import { OnDeviceDiagram } from "@/components/pdf/OnDeviceDiagram";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: {
    absolute: `${SITE_NAME} — merge, split and shrink PDFs without uploading them`,
  },
  description:
    "Merge, split, extract, reorder and compress PDFs, and turn images into one. Every file is opened on your own device and none of them are uploaded.",
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
    "Browser-based PDF tools. Merge, split, extract, reorder and compress PDF files without uploading them.",
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start lg:gap-12">
          <div>
            <h1 className="text-[32px] leading-tight sm:text-[38px]">
              PDF tools that never upload your file
            </h1>
            <p className="mt-3 max-w-[52ch] text-[17px] text-text-light">
              Merge, split, reorder or shrink a PDF in a few seconds. The file is opened by
              your browser and stays on this device — there is no server here that could
              receive it.
            </p>

            <div className="mt-6">
              <LandingPicker />
            </div>
          </div>

          <div className="lg:pt-6">
            <OnDeviceDiagram />
            <p className="mt-3 max-w-[38ch] text-[13px] text-text-light">
              Open your browser&apos;s network tab and run any tool on this site. No request
              carries your file, because there is nowhere for it to go.
            </p>
          </div>
        </div>

        <section id="tools" className="mt-14 scroll-mt-8">
          <h2 className="text-[22px]">All six tools</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/${tool.slug}`}
                  className="ek-card flex h-full flex-col p-4 no-underline transition-colors hover:border-line-strong"
                >
                  <span className="text-[16px] font-semibold text-foreground">{tool.title}</span>
                  <span className="mt-1 text-[14px] text-text-light">{tool.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 max-w-[64ch]">
          <h2 className="text-[22px]">How this is different</h2>
          <p className="mt-3 text-[16px] text-text-light">
            Most online PDF tools work by uploading your document to a server, doing the job
            there and sending it back. That is a reasonable way to build one, but it means a
            copy of your bank statement or your tenancy agreement sits on a machine you do not
            control, under a retention policy you have to take on trust.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            This kit does the work in the page instead. The trade is real and worth stating: a
            very large file is limited by your device&apos;s memory rather than a server&apos;s,
            and compression here can only re-encode the images inside a document, so a
            text-heavy file will barely shrink. In exchange, the file never leaves.
          </p>
        </section>
      </div>
    </>
  );
}
