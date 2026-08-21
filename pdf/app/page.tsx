import type { Metadata } from "next";
import Link from "next/link";
import { OnDeviceDiagram } from "@/components/pdf/OnDeviceDiagram";
import { ToolGrid } from "@/components/pdf/ToolGrid";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: {
    absolute: `${SITE_NAME}: merge, split and shrink PDFs without uploading them`,
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
        <div className="text-center">
          <h1 className="mx-auto max-w-[360px] text-[32px] leading-[1.15] sm:max-w-[520px] sm:text-[40px]">
            PDF tools that never upload your file
          </h1>
          <p className="mx-auto mt-4 max-w-[54ch] text-[17px] text-text-light">
            Merge, split, reorder or shrink a PDF in a few seconds. The file is opened by your
            browser and stays on this device.
          </p>
        </div>

        <div className="mt-10">
          <ToolGrid />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          Nothing is uploaded, because there is no server here to upload to.
        </p>

        <section className="mt-14">
          <div className="mx-auto max-w-[420px]">
            <OnDeviceDiagram />
          </div>
          <p className="mx-auto mt-3 max-w-[52ch] text-center text-[13px] text-text-light">
            Open your browser&apos;s network tab and run any tool on this site. No request carries
            your file, because there is nowhere for it to go.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">All six tools</h2>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
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
