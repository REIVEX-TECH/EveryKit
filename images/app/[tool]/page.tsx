import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Workbench } from "@/components/images/Workbench";
import { ToolSwitcher } from "@/components/site/ToolSwitcher";
import { getTool, tools } from "@/data/tools";
import { absoluteUrl } from "@/lib/site";

type Params = { params: Promise<{ tool: string }> };

/** Three static pages, one per tool. Nothing here is rendered on demand. */
export function generateStaticParams() {
  return tools.map((tool) => ({ tool: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};

  return {
    // The root layout appends "| EveryKit Images"; adding it here would double it.
    title: tool.seoTitle,
    description: tool.description,
    alternates: { canonical: absoluteUrl(`/${tool.slug}`) },
    openGraph: {
      title: tool.seoTitle,
      description: tool.description,
      url: absoluteUrl(`/${tool.slug}`),
    },
  };
}

export default async function ToolPage({ params }: Params) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };

  const others = tools.filter((other) => other.slug !== tool.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <ToolSwitcher current={tool.slug} />

      <div className="ek-shell py-10 sm:py-12">
        <h1 className="text-[30px] leading-tight sm:text-[34px]">{tool.title}</h1>
        {tool.intro.map((paragraph) => (
          <p key={paragraph} className="mt-3 max-w-[60ch] text-[16px] text-text-light">
            {paragraph}
          </p>
        ))}

        <div className="mt-8">
          <Workbench tool={tool.slug} />
        </div>

        <section className="mt-14 max-w-[820px]">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-5 flex flex-col gap-5">
            {tool.faq.map((entry) => (
              <div key={entry.q}>
                <dt className="text-[16px] font-semibold">{entry.q}</dt>
                <dd className="mt-1 max-w-[64ch] text-[15px] text-text-light">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">The other tools here</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/${other.slug}`}
                  className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
                >
                  {other.title}
                  <span className="block text-text-light">{other.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
