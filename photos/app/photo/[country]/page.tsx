import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamplePair } from "@/components/site/ExamplePair";
import { OtherSizes } from "@/components/site/OtherSizes";
import { PhotoTool } from "@/components/tool/PhotoTool";
import {
  BACKGROUND_LABEL,
  getSpec,
  specSizeLabel,
  specTitle,
  specs,
  type PhotoSpec,
} from "@/data/specs";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

type Params = { country: string };

export function generateStaticParams(): Params[] {
  return specs.map((spec) => ({ country: spec.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country } = await params;
  const spec = getSpec(country);
  if (!spec) return {};

  const title = `${specTitle(spec)} photo online, ${specSizeLabel(spec)}, free preview`;
  return {
    title,
    description: `Make a ${specTitle(spec)} photo from a selfie: ${specSizeLabel(spec)}, ${spec.pixelWidth} x ${spec.pixelHeight} pixels at ${spec.dpi} DPI. Cropped in your browser, never uploaded.`,
    alternates: { canonical: absoluteUrl(`/photo/${spec.slug}`) },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      url: absoluteUrl(`/photo/${spec.slug}`),
    },
  };
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const spec = getSpec(country);
  if (!spec) notFound();

  const faqs = buildFaqs(spec);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }),
        }}
      />

      <div className="ek-shell py-12 sm:py-16">
        {/*
          Near the top on purpose. Someone who arrived here from search wanting
          a different country has no back button to use, and the full list sits
          a long way down the page.
        */}
        <a
          href="#other-sizes"
          className="inline-flex min-h-[24px] items-center gap-1 text-[14px] text-primary no-underline hover:text-primary-dark hover:underline"
        >
          All sizes<span aria-hidden="true">↓</span>
        </a>

        <PhotoTool
          initialSlug={spec.slug}
          heading={`${specTitle(spec)} photo, made in your browser`}
          intro={
            <>
              <p className="mt-4 text-[17px] text-text-light">
                {specSizeLabel(spec)}, {spec.pixelWidth} x {spec.pixelHeight}{" "}
                pixels at {spec.dpi} DPI, which is what {spec.country} asks for.
              </p>
              <p className="mt-3 text-[15px] text-text-light">
                Upload a selfie and it is cropped here on your device. The photo
                is never uploaded anywhere.
              </p>
            </>
          }
          example={<ExamplePair spec={spec} />}
        />

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">What {spec.country} requires</h2>
          <ul className="mt-4 max-w-[640px] space-y-2 text-[15px] text-text-light">
            {spec.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          {spec.needsVerification ? (
            <p className="mt-6 max-w-[640px] rounded-[12px] border border-line bg-bg-soft p-4 text-[14px] text-text-light">
              Some of the numbers above are drawn from widely published guidance
              rather than a single official page. Check them against the
              instructions you were given before you submit.
            </p>
          ) : null}
        </section>

        <section className="mt-14">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-6 max-w-[720px] space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-[16px] font-semibold text-foreground">{faq.question}</dt>
                <dd className="mt-1 text-[15px] text-text-light">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <OtherSizes currentSlug={spec.slug} />
      </div>
    </>
  );
}

function buildFaqs(spec: PhotoSpec): Array<{ question: string; answer: string }> {
  const size = specSizeLabel(spec);
  const faqs = [
    {
      question: `What size is a ${specTitle(spec)} photo?`,
      answer: `${size}. At ${spec.dpi} DPI that is ${spec.pixelWidth} by ${spec.pixelHeight} pixels, which is the size this tool exports.`,
    },
    {
      question: "Is my photo uploaded anywhere?",
      answer:
        "No. The face detection and the cropping both run in your browser using WebAssembly. The image data stays in the tab and is gone when you close it. There is no server to upload it to.",
    },
    {
      question: "Can I use a phone selfie?",
      answer:
        "Yes, and that is what most people do. Face the camera straight on with a plain wall behind you and even light on your face. Hold the phone at eye level rather than above you.",
    },
    {
      question: `What background does ${spec.country} want?`,
      answer: `${BACKGROUND_LABEL[spec.background]}. If your wall is close enough, keep the original. If not, the tool can replace the background on your device, which takes a few seconds the first time.`,
    },
    {
      question: "Will my photo definitely be accepted?",
      answer:
        "Nobody can promise that, and this tool does not. It gets the dimensions, head height and resolution to the published requirements. Whether your expression, clothing and lighting pass is decided by the office you apply to.",
    },
    {
      question: "Can I print it?",
      answer:
        "Yes. Along with the single photo you get a 4 by 6 inch sheet with several copies tiled on it and cut lines between them. Any shop that prints 4 by 6 photos will print it.",
    },
  ];

  if (spec.headMinMm !== undefined && spec.headMaxMm !== undefined) {
    faqs.splice(1, 0, {
      question: `How big should the head be in a ${specTitle(spec)} photo?`,
      answer: `Between ${spec.headMinMm} and ${spec.headMaxMm} mm measured from the chin to the top of the head. The tool crops to the middle of that range and tells you the measurement it reached.`,
    });
  }

  return faqs;
}
