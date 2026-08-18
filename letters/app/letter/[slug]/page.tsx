import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLetterType, letterTypes } from "@/data/letters";
import { LetterWorkbench } from "@/components/letter/LetterWorkbench";
import { LetterPreview } from "@/components/letter/LetterPreview";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return letterTypes.map((type) => ({ slug: type.slug }));
}

export const dynamicParams = false;

/**
 * The letter is dated the day the page is built rather than the day it is
 * viewed. Reading the clock during render would make the page non-static and
 * would hand every visitor a different HTML document; the date field is
 * editable in the form for anyone who needs a different one.
 */
function buildDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const type = getLetterType(slug);
  if (!type) return {};
  const title = `${type.title} — free template and generator`;
  return {
    title,
    description: `${type.seoNotes[0]} Fill a short form and the letter writes itself, in your browser.`,
    alternates: { canonical: absoluteUrl(`/letter/${type.slug}`) },
    openGraph: { title: `${title} | ${SITE_NAME}`, url: absoluteUrl(`/letter/${type.slug}`) },
  };
}

export default async function LetterPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const type = getLetterType(slug);
  if (!type) notFound();

  const today = buildDate();
  const example = type.build(type.example, {
    tone: type.toneVariants?.[0] ?? "polite",
    dateFormat: "long-day-first",
    today,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: type.faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      <div className="ek-shell py-12 sm:py-16">
        <div className="max-w-[640px]">
          <h1 className="text-[32px] sm:text-[38px]">{type.title}</h1>
          <p className="mt-3 text-[17px] text-text-light">{type.whoItsFor}.</p>
          {type.seoNotes.map((note) => (
            <p key={note} className="mt-3 text-[15px] text-text-light">
              {note}
            </p>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-12">
          <LetterWorkbench slug={type.slug} today={today} />
        </div>

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">A finished example</h2>
          <p className="mt-2 max-w-[640px] text-[15px] text-text-light">
            The same template with every field filled in. The names and details
            are invented.
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
            <LetterPreview doc={example} />
            {/* The same letter as indexable text. The preview above is a
                picture of a page; this is what a search engine reads. */}
            <div className="max-w-[560px] text-[15px] text-text-light">
              <p className="whitespace-pre-line">
                {[
                  example.subject,
                  `${example.salutation},`,
                  ...example.body,
                  `${example.valediction},`,
                  ...example.signOff,
                ]
                  .filter(Boolean)
                  .join("\n\n")}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-6 max-w-[720px] space-y-6">
            {type.faq.map((item) => (
              <div key={item.q}>
                <dt className="text-[16px] font-semibold text-foreground">{item.q}</dt>
                <dd className="mt-1 text-[15px] text-text-light">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <nav className="mt-20 border-t border-line pt-12" aria-labelledby="other-letters">
          <h2 id="other-letters" className="text-[22px]">
            Other letters
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {letterTypes
              .filter((other) => other.slug !== type.slug)
              .map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/letter/${other.slug}`}
                    className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
