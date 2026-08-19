import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrWorkbench } from "@/components/qr/QrWorkbench";
import { getKind, kinds } from "@/data/kinds";
import { absoluteUrl } from "@/lib/site";

type Params = { params: Promise<{ kind: string }> };

/** Five static pages, one per kind. Nothing here is rendered on demand. */
export function generateStaticParams() {
  return kinds.map((kind) => ({ kind: kind.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { kind: slug } = await params;
  const kind = getKind(slug);
  if (!kind) return {};

  return {
    // The root layout appends "| EveryKit QR"; adding it here too would double it.
    title: kind.seoTitle,
    description: kind.description,
    alternates: { canonical: absoluteUrl(`/${kind.slug}`) },
    openGraph: {
      title: kind.seoTitle,
      description: kind.description,
      url: absoluteUrl(`/${kind.slug}`),
    },
  };
}

export default async function KindPage({ params }: Params) {
  const { kind: slug } = await params;
  const kind = getKind(slug);
  if (!kind) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: kind.faq.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };

  const others = kinds.filter((other) => other.slug !== kind.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="ek-shell py-10 sm:py-12">
        <h1 className="text-[30px] leading-tight sm:text-[34px]">{kind.title} QR code</h1>
        {kind.intro.map((paragraph) => (
          <p key={paragraph} className="mt-3 max-w-[60ch] text-[16px] text-text-light">
            {paragraph}
          </p>
        ))}

        <div className="mt-8">
          <QrWorkbench kind={kind.slug} />
        </div>

        <section className="mt-14 max-w-[820px]">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-5 flex flex-col gap-5">
            {kind.faq.map((entry) => (
              <div key={entry.q}>
                <dt className="text-[16px] font-semibold">{entry.q}</dt>
                <dd className="mt-1 max-w-[64ch] text-[15px] text-text-light">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-[18px]">The other kinds here</h2>
          <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/${other.slug}`}
                  className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
                >
                  {other.title}
                  <span className="text-text-light"> — {other.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
