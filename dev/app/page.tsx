import type { Metadata } from "next";
import Link from "next/link";
import { ToolGrid } from "@/components/dev/ToolGrid";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: { absolute: `${SITE_NAME}, ten small developer tools that run in your browser` },
  description:
    "JSON, base64, URL encoding, UUIDs, hashes, JWT, regex, diff, timestamps and cron. Ten developer tools that run entirely in your browser. Nothing is uploaded.",
  alternates: { canonical: absoluteUrl("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description: "Ten browser-based developer tools. Nothing is uploaded.",
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
            Ten small developer tools
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[17px] text-text-light">
            The ones you reach for between other jobs. Every one of them runs in this page, so
            nothing you paste leaves your browser.
          </p>
        </div>

        <div className="mt-10">
          <ToolGrid />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          No sign in, no upload, no server.
        </p>

        <section className="mt-16 max-w-[64ch]">
          <h2 className="text-[22px]">Why these run in the browser</h2>
          <p className="mt-3 text-[16px] text-text-light">
            A developer tool sees the things you would least like to hand over: a token from
            production, a config file with a connection string in it, a customer record in a JSON
            payload. Most of the free ones online post all of that to a server to do work a browser
            can do on its own.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            None of that happens here. Open your network tab and use any tool on this site: no
            request carries what you typed. The one exception is documented, which is the email
            address asked for once before your first copy or download.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">Every tool</h2>
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
