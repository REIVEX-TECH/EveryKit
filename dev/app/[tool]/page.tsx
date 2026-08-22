import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { ToolSwitcher } from "@/components/site/ToolSwitcher";
import { Base64Tool } from "@/components/dev/Base64Tool";
import { CronTool } from "@/components/dev/CronTool";
import { DiffTool } from "@/components/dev/DiffTool";
import { HashTool } from "@/components/dev/HashTool";
import { JsonTool } from "@/components/dev/JsonTool";
import { JwtTool } from "@/components/dev/JwtTool";
import { RegexTool } from "@/components/dev/RegexTool";
import { TimestampTool } from "@/components/dev/TimestampTool";
import { UrlTool } from "@/components/dev/UrlTool";
import { UuidTool } from "@/components/dev/UuidTool";
import { ColorTool } from "@/components/dev/ColorTool";
import { MarkdownTool } from "@/components/dev/MarkdownTool";
import { JsonToCsvTool } from "@/components/dev/JsonToCsvTool";
import { getTool, tools, type ToolSlug } from "@/data/tools";
import { absoluteUrl } from "@/lib/site";

type Params = { params: Promise<{ tool: string }> };

/** Ten static pages, one per tool. Nothing here is rendered on demand. */
export function generateStaticParams() {
  return tools.map((tool) => ({ tool: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return {
    // The root layout appends the site name; repeating it here would double it.
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

/** One component per route, picked here rather than in ten near-identical files. */
const WORKBENCHES: Record<ToolSlug, () => React.ReactElement> = {
  json: JsonTool,
  base64: Base64Tool,
  url: UrlTool,
  uuid: UuidTool,
  hash: HashTool,
  jwt: JwtTool,
  regex: RegexTool,
  diff: DiffTool,
  timestamp: TimestampTool,
  cron: CronTool,
  color: ColorTool,
  markdown: MarkdownTool,
  "json-to-csv": JsonToCsvTool,
};

export default async function ToolPage({ params }: Params) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const Workbench = WORKBENCHES[tool.slug];

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
          <p key={paragraph} className="mt-3 max-w-[64ch] text-[16px] text-text-light">
            {paragraph}
          </p>
        ))}

        <div className="mt-8">
          <Workbench />
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
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
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

        {/* At the foot, after the h2 sections: inside a workbench its h3 would
            sit between the h1 and those h2s, which is a heading-order failure. */}
        <MoreFromEveryKit />
      </div>
    </>
  );
}
