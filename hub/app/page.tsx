import type { Metadata } from "next";
import { FlagshipRow } from "@/components/FlagshipRow";
import { KitDirectory } from "@/components/KitDirectory";
import { ToolSearch } from "@/components/ToolSearch";
import { CATEGORIES, catalog, flagshipLinks, kits } from "@/data/kits";
import { PARENT_NAME, PARENT_URL, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * The objection three real users raised, answered on the page and marked up as
 * an FAQ. It is the exact question people type into an assistant, so it is the
 * question worth being the answer to. The visible copy below says the same
 * thing in the same words; the two must move together.
 */
const CHAT_FAQ = [
  {
    q: "Can an AI chat like ChatGPT do these things?",
    a: "For some, yes. A countdown, a word count or a unit conversion is fine in an AI chat, and we are not going to pretend otherwise. What a chat cannot do is hand you back your own file: a passport photo at exactly 35 by 45 mm, a PDF with your pages merged in the order you set, an image compressed to just under 100 KB. Those are byte-for-byte jobs on one specific file, and that is the work these tools do.",
  },
  {
    q: "Do my files get uploaded to a server?",
    a: "No. Your file is opened, changed and saved in your own browser, and nothing is sent anywhere. Using an AI assistant for a passport scan or a signed contract means uploading it to someone's server; these tools upload nothing, and you can watch the network tab to confirm it.",
  },
  {
    q: "Are the tools really free?",
    a: "Yes, free to use, with no account and nothing to cancel. The only thing we ever store is an email address, and only if you give one when you take a result.",
  },
];

export const metadata: Metadata = {
  title: `${SITE_NAME}: small tools for everyday problems`,
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
  // Tool names per kit, for the category chip previews. Built from the same
  // catalogue the listing below reads, so nothing here is a second source.
  const toolsByKit: Record<string, string[]> = {};
  for (const entry of catalog()) {
    (toolsByKit[entry.kitSlug] ??= []).push(entry.tool.name);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: CHAT_FAQ.map((entry) => ({
              "@type": "Question",
              name: entry.q,
              acceptedAnswer: { "@type": "Answer", text: entry.a },
            })),
          }),
        }}
      />

      <div className="ek-shell py-12 sm:py-16">
        <div className="text-center">
          {/*
            The headline is the h1 now, rather than the wordmark. The lockup is
            already in the header on every page, and a page whose only heading
            is the brand name says nothing about what the page is for.

            The width holds the break between the two thoughts, and it is in
            pixels rather than ch on purpose: a ch is a font metric, so the
            container itself resized when IBM Plex replaced the fallback and the
            page scored a small layout shift for it. Measured at 0.0021 with ch
            against 0.0002 with these. The two values are the two type sizes.
          */}
          <h1 className="mx-auto max-w-[340px] text-[34px] leading-[1.15] sm:max-w-[420px] sm:text-[44px]">
            Small tools for everyday problems
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[17px] text-text-light sm:text-[19px]">
            Free, done in a minute. Your files never leave your device.
          </p>
        </div>

        <div className="mt-8">
          <ToolSearch entries={catalog()} />
        </div>

        <div className="mt-12">
          <KitDirectory kits={kits} categories={CATEGORIES} toolsByKit={toolsByKit} />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          Runs entirely in your browser.
        </p>

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">Every tool</h2>
          <p className="mt-2 max-w-[640px] text-[15px] text-text-light">
            The whole catalogue, by category. Everything runs in your browser.
          </p>

          {/*
            Grouped by the same categories as the chips above. Each kit shows its
            first four tools on one line, and the rest sit inside a <details> so
            every deep link is still in the HTML for a crawler and reachable with
            no JavaScript, while the default view stays short. The category order
            follows CATEGORIES, minus "all".
          */}
          <div className="mt-8 space-y-12">
            {CATEGORIES.filter((c) => c.id !== "all").map((category) => {
              const catKits = kits.filter(
                (kit) => kit.status === "live" && kit.category === category.id,
              );
              if (catKits.length === 0) return null;
              return (
                <div key={category.id}>
                  <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">
                    {category.label}
                  </h3>
                  <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                    {catKits.map((kit) => {
                      const tools = catalog().filter((entry) => entry.kitSlug === kit.slug);
                      if (tools.length === 0) return null;
                      const first = tools.slice(0, 4);
                      const rest = tools.slice(4);
                      return (
                        <div key={kit.slug}>
                          <h4 className="text-[15px] font-semibold">
                            <a href={kit.url} className="no-underline hover:text-primary-dark">
                              {kit.name.replace(/^EveryKit /, "")}
                            </a>
                          </h4>
                          <p className="mt-1 text-[14px] leading-relaxed text-text-light">
                            {first.map((entry, index) => (
                              <span key={entry.href}>
                                <a
                                  href={entry.href}
                                  className="text-text-light no-underline hover:text-primary-dark hover:underline"
                                >
                                  {entry.tool.name}
                                </a>
                                {index < first.length - 1 ? ", " : null}
                              </span>
                            ))}
                          </p>
                          {rest.length > 0 ? (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-[14px] text-primary hover:text-primary-dark">
                                and {rest.length} more
                              </summary>
                              <p className="mt-1 text-[14px] leading-relaxed text-text-light">
                                {rest.map((entry, index) => (
                                  <span key={entry.href}>
                                    <a
                                      href={entry.href}
                                      className="text-text-light no-underline hover:text-primary-dark hover:underline"
                                    >
                                      {entry.tool.name}
                                    </a>
                                    {index < rest.length - 1 ? ", " : null}
                                  </span>
                                ))}
                              </p>
                            </details>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-20 border-t border-line pt-12">
          <FlagshipRow items={flagshipLinks()} />
        </div>

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">Why not just use ChatGPT?</h2>
          <div className="mt-6 max-w-[640px] space-y-3 text-[16px] text-text-light">
            <p>
              For some of these, you could. If you want a countdown, a word
              count or a unit conversion, an AI chat will do it fine, and so will
              a search box. We are not going to pretend otherwise.
            </p>
            <p>
              What a chat cannot do is give you back your own file. It cannot
              hand you a passport photo at exactly 35 by 45 mm, a PDF with your
              pages merged in the order you set, or an image compressed to land
              just under 100 KB. Those are byte-for-byte jobs on one specific
              file, and that is the work these tools do.
            </p>
            <p>
              There is also where your file goes. Using an AI assistant for your
              passport scan or a signed contract means uploading it to someone&apos;s
              server. These tools upload nothing. Your file is opened, changed
              and saved in your own browser, and you can watch the network tab to
              confirm nothing leaves.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * The tick beside the browser line.
 *
 * Decorative, so it is hidden from screen readers: the sentence next to it
 * already says the thing, and "green tick" is not extra information. Success
 * green is the only place this colour appears on the page.
 */
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
