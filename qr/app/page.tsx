import type { Metadata } from "next";
import Link from "next/link";
import { ToolGrid } from "@/components/qr/ToolGrid";
import { kinds } from "@/data/kinds";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: { absolute: `${SITE_NAME}: QR codes that never expire` },
  description:
    "Make a QR code for a link, Wi-Fi, contact details or WhatsApp. No account, no expiry, no short link in the middle, and nothing you type is uploaded.",
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
    "Browser-based QR code generator for links, plain text, Wi-Fi networks, contact cards and WhatsApp.",
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
            QR codes that never expire
          </h1>
          <p className="mx-auto mt-4 max-w-[54ch] text-[17px] text-text-light">
            Your information goes inside the code itself, so there is no short link in the middle
            that can stop working, nothing to renew, and no account.
          </p>
        </div>

        <div className="mt-10">
          <ToolGrid />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          Made in your browser, working long after this site is gone.
        </p>

        <section className="mt-16 max-w-[64ch]">
          <h2 className="text-[22px]">Why these do not expire</h2>
          <p className="mt-3 text-[16px] text-text-light">
            Many QR generators give you a code that points at their own domain, which then
            redirects to your link. That is how a code can be edited later, and also how it comes
            to stop working: it depends on somebody else&apos;s service still being there, still
            free, and still willing to serve it.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            These codes hold your information directly. The trade is honest and worth stating: you
            cannot change where one points after it is printed, and nobody, including us, can tell
            you how many times it was scanned. In exchange it keeps working whatever happens to
            this site.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">Every kind of code</h2>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {kinds.map((kind) => (
              <li key={kind.slug}>
                <Link
                  href={`/${kind.slug}`}
                  className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
                >
                  {kind.title}
                  <span className="text-text-light">, {kind.blurb.toLowerCase()}</span>
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
