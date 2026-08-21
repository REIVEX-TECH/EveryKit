import type { Metadata } from "next";
import Link from "next/link";
import { ToolGrid } from "@/components/images/ToolGrid";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}: resize, convert and clean up photos` },
  description:
    "Resize photos, convert between JPG, PNG and WebP, and strip EXIF data. One or a whole batch at a time, in your browser, with nothing uploaded.",
  alternates: { canonical: absoluteUrl("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  description:
    "Browser-based image tools: batch resize, format conversion between JPG, PNG and WebP, and lossless EXIF removal.",
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
          <h1 className="mx-auto max-w-[340px] text-[32px] leading-[1.15] sm:max-w-[500px] sm:text-[40px]">
            Resize, convert and clean up photos
          </h1>
          <p className="mx-auto mt-4 max-w-[54ch] text-[17px] text-text-light">
            Drop in one photo or a hundred. They are read from your disk, worked on inside this
            tab, and saved back.
          </p>
        </div>

        <div className="mt-10">
          <ToolGrid />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          No upload, and no server here that could receive them.
        </p>

        <section className="mt-16 max-w-[64ch]">
          <h2 className="text-[22px]">What the EXIF tool actually removes</h2>
          <p className="mt-3 text-[16px] text-text-light">
            A photo from a phone carries the camera, the settings, the time, and often the exact
            place it was taken. Sharing one online shares all of that unless something strips it,
            and most services strip only some.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            This removes the metadata without re-encoding the picture, so the pixels come back
            byte for byte identical and only the tags are gone.
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
