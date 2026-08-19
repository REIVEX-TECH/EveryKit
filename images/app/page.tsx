import type { Metadata } from "next";
import Link from "next/link";
import { Workbench } from "@/components/images/Workbench";
import { ToolSwitcher } from "@/components/site/ToolSwitcher";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — resize, convert and clean up photos` },
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

      <ToolSwitcher current="resize" />

      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[22ch] text-[32px] leading-tight sm:text-[38px]">
          Resize, convert and clean up photos
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          Drop in one photo or a hundred. They are read from your disk, worked on inside this
          tab, and saved back — no upload, and no server here that could receive them.
        </p>

        <div className="mt-8">
          <Workbench tool="resize" />
        </div>

        <section className="mt-14">
          <h2 className="text-[22px]">The other tools</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {tools
              .filter((tool) => tool.slug !== "resize")
              .map((tool) => (
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
      </div>
    </>
  );
}
