import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Workbench } from "@/components/background/Workbench";
import { getModePage, modePages } from "@/data/modes";
import { absoluteUrl } from "@/lib/site";

type Params = { params: Promise<{ mode: string }> };

/** Two static pages, one per starting mode. Nothing is rendered on demand. */
export function generateStaticParams() {
  return modePages.map((page) => ({ mode: page.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { mode } = await params;
  const page = getModePage(mode);
  if (!page) return {};
  return {
    // The root layout appends the site name; repeating it here would double it.
    title: page.seoTitle,
    description: page.description,
    alternates: { canonical: absoluteUrl(`/${page.slug}`) },
    openGraph: {
      title: page.seoTitle,
      description: page.description,
      url: absoluteUrl(`/${page.slug}`),
    },
  };
}

export default async function ModePage({ params }: Params) {
  const { mode } = await params;
  const page = getModePage(mode);
  if (!page) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };

  const others = modePages.filter((other) => other.slug !== page.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="ek-shell py-10 sm:py-12">
        {/*
          Near the top on purpose. Most people reach these pages from search,
          so if this is the wrong starting point there is no history to go back
          through. This kit has one tool with two presets rather than several
          tools, so it takes this link rather than a tool switcher row.
        */}
        <Link
          href="/"
          // text-primary-dark, not text-primary: #1d81f2 on white is 3.88:1, under
          // the 4.5 that 14px text needs. #1769d4 is 5.24:1.
          className="inline-flex min-h-[24px] items-center gap-1 text-[14px] text-primary-dark no-underline hover:text-primary hover:underline"
        >
          <span aria-hidden="true">&larr;</span>All background options
        </Link>

        <h1 className="mt-6 text-[30px] leading-tight sm:text-[34px]">{page.title}</h1>
        {page.intro.map((paragraph) => (
          <p key={paragraph} className="mt-3 max-w-[60ch] text-[16px] text-text-light">
            {paragraph}
          </p>
        ))}

        <div className="mt-8">
          <Workbench initialMode={page.preset} />
        </div>

        <section className="mt-14 max-w-[820px]">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-5 flex flex-col gap-5">
            {page.faq.map((entry) => (
              <div key={entry.q}>
                <dt className="text-[16px] font-semibold">{entry.q}</dt>
                <dd className="mt-1 max-w-[64ch] text-[15px] text-text-light">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">Also here</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/${other.slug}`}
                  className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
                >
                  {other.title}
                  <span className="text-text-light">, {other.blurb.toLowerCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
