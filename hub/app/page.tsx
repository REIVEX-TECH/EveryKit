import type { Metadata } from "next";
import { KitDirectory } from "@/components/KitDirectory";
import { Wordmark } from "@/components/site/Wordmark";
import { CATEGORIES, kits } from "@/data/kits";
import { PARENT_NAME, PARENT_URL, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — small tools for everyday problems`,
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
        <div className="max-w-[560px]">
          <h1 className="text-[34px] sm:text-[40px]">
            <Wordmark className="font-semibold" />
          </h1>
          <p className="mt-3 text-[19px] text-text-light">
            Small tools for everyday problems. Pay once, done in a minute.
          </p>
        </div>

        <div className="mt-10">
          <KitDirectory kits={kits} categories={CATEGORIES} />
        </div>

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">How every kit works</h2>
          <div className="mt-6 max-w-[640px] space-y-3 text-[16px] text-text-light">
            <p>
              Nothing is uploaded. Your file is processed in your own browser,
              so it never reaches a server of ours.
            </p>
            <p>
              You see the result before you pay, at full quality, so you know
              whether it worked.
            </p>
            <p>
              One small payment for the file you came for. No account, no
              subscription.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
