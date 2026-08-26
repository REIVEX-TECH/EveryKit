import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { ToolSwitcher } from "@/components/site/ToolSwitcher";
import { CitationTool } from "@/components/study/CitationTool";
import { ExamCountdownTool } from "@/components/study/ExamCountdownTool";
import { FinalGradeTool } from "@/components/study/FinalGradeTool";
import { GpaTool } from "@/components/study/GpaTool";
import { ReadingTimeTool } from "@/components/study/ReadingTimeTool";
import { TimerTool } from "@/components/study/TimerTool";
import { FlashcardsTool } from "@/components/study/FlashcardsTool";
import { NoteCleanerTool } from "@/components/study/NoteCleanerTool";
import { ScientificCalculatorTool } from "@/components/study/ScientificCalculatorTool";
import { EssayLengthTool } from "@/components/study/EssayLengthTool";
import { MolarMassTool } from "@/components/study/MolarMassTool";
import { PeriodicTableTool } from "@/components/study/PeriodicTableTool";
import { RomanNumeralsTool } from "@/components/study/RomanNumeralsTool";
import dynamic from "next/dynamic";
import { getTool, tools, type ToolSlug } from "@/data/tools";

// Lazy: the timetable pulls in pdf-lib for its PDF export, which is large.
// Splitting it keeps that weight off the other ten tools.
const TimetableTool = dynamic(() =>
  import("@/components/study/TimetableTool").then((m) => m.TimetableTool),
);
import { absoluteUrl } from "@/lib/site";

type Params = { params: Promise<{ tool: string }> };

/** Five static pages, one per tool. Nothing here is rendered on demand. */
export function generateStaticParams() {
  return tools.map((tool) => ({ tool: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return {
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

const WORKBENCHES: Record<ToolSlug, React.ComponentType> = {
  gpa: GpaTool,
  "final-grade": FinalGradeTool,
  citation: CitationTool,
  "reading-time": ReadingTimeTool,
  timer: TimerTool,
  "exam-countdown": ExamCountdownTool,
  flashcards: FlashcardsTool,
  timetable: TimetableTool,
  "note-cleaner": NoteCleanerTool,
  "scientific-calculator": ScientificCalculatorTool,
  "essay-length": EssayLengthTool,
  "molar-mass": MolarMassTool,
  "periodic-table": PeriodicTableTool,
  "roman-numerals": RomanNumeralsTool,
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

        <MoreFromEveryKit />
      </div>
    </>
  );
}
