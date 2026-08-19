import type { Metadata } from "next";
import Link from "next/link";
import { QrWorkbench } from "@/components/qr/QrWorkbench";
import { ToolSwitcher } from "@/components/site/ToolSwitcher";
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

      <ToolSwitcher current="url" />

      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[20ch] text-[32px] leading-tight sm:text-[38px]">
          QR codes that never expire
        </h1>
        <p className="mt-3 max-w-[56ch] text-[17px] text-text-light">
          Paste a link and the code appears as you type. Your information goes inside the code
          itself, so there is no short link in the middle that can stop working, nothing to
          renew, and no account.
        </p>

        <div className="mt-8">
          <QrWorkbench kind="url" />
        </div>

        <section id="kinds" className="mt-14 scroll-mt-8">
          <h2 className="text-[22px]">Other kinds of code</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kinds
              .filter((kind) => kind.slug !== "url")
              .map((kind) => (
                <li key={kind.slug}>
                  <Link
                    href={`/${kind.slug}`}
                    className="ek-card flex h-full flex-col p-4 no-underline transition-colors hover:border-line-strong"
                  >
                    <span className="text-[16px] font-semibold text-foreground">{kind.title}</span>
                    <span className="mt-1 text-[14px] text-text-light">{kind.blurb}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <section className="mt-14 max-w-[64ch]">
          <h2 className="text-[22px]">Why these do not expire</h2>
          <p className="mt-3 text-[16px] text-text-light">
            Many QR generators give you a code that points at their own domain, which then
            redirects to your link. That is how a code can be edited later, and also how it
            comes to stop working: it depends on somebody else&apos;s service still being
            there, still free, and still willing to serve it.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            These codes hold your information directly. The trade is honest and worth stating:
            you cannot change where one points after it is printed, and nobody,
            including us, can tell you how many times it was scanned. In exchange it keeps working whatever
            happens to this site.
          </p>
        </section>
      </div>
    </>
  );
}
