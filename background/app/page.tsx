import type { Metadata } from "next";
import Link from "next/link";
import { Workbench } from "@/components/background/Workbench";
import { modePages } from "@/data/modes";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: { absolute: `${SITE_NAME}, remove a background in your browser` },
  description:
    "Remove the background from a photo and save it transparent, on white, or on any colour. Nothing is uploaded: the photo is worked on inside your browser.",
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
    "Browser-based background remover. Saves a transparent PNG, or the subject on any flat colour.",
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
        <h1 className="max-w-[20ch] text-[32px] leading-tight sm:text-[38px]">
          Remove a background, without uploading anything
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          Drop in a photo and the subject is cut out on your own device. Keep the
          transparency, or drop it onto white or any colour you like.
        </p>

        <div className="mt-8">
          <Workbench initialMode={{ kind: "transparent" }} />
        </div>

        <section className="mt-14">
          <h2 className="text-[22px]">Starting points</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {modePages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/${page.slug}`}
                  className="ek-card flex h-full flex-col p-4 no-underline transition-colors hover:border-line-strong"
                >
                  <span className="text-[16px] font-semibold text-foreground">{page.title}</span>
                  <span className="mt-1 text-[14px] text-text-light">{page.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 max-w-[64ch]">
          <h2 className="text-[22px]">What this is good at, and what it is not</h2>
          <p className="mt-3 text-[16px] text-text-light">
            A clear subject against a background that is not the same colour comes
            out well. Hair and fur are the hard part of this problem, and no
            automatic tool gets them perfect. Fine strands against a busy
            background are where it struggles most.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            That is why the result is shown zoomed in on an edge, on a
            chequerboard, before you download. Judge it there rather than after
            you have already used the file.
          </p>
        </section>
      </div>
    </>
  );
}
