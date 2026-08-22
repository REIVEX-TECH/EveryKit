import type { Metadata } from "next";
import { Workbench } from "@/components/ringtone/Workbench";
import { ToolRow } from "@/components/ringtone/ToolRow";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: { absolute: `Make a ringtone from a song, free MP3 cutter | ${SITE_NAME}` },
  description:
    "Cut up to 60 seconds out of a song and save it as an MP3 ringtone. Drag the start and end, add fades, download. The song is read on your own device and is never uploaded.",
  alternates: { canonical: absoluteUrl("/") },
};

const faq = [
  {
    question: "Will this work for an iPhone?",
    answer:
      "Not on its own. An iPhone ringtone has to be a .m4r file placed there through a computer, and a web page cannot write into that part of a phone. What you get here is an MP3, which is what Android wants and what most other players take.",
  },
  {
    question: "How long can the ringtone be?",
    answer:
      "60 seconds. Phones cut a ringtone off around there anyway, and the limit keeps the encoding quick on a phone.",
  },
  {
    question: "Does my song get uploaded?",
    answer:
      "No. The browser decodes the file itself and the MP3 is written in the same tab. There is no server here that receives audio.",
  },
  {
    question: "Which files can I open?",
    answer:
      "MP3, M4A and WAV, plus whatever else your browser can decode. A track bought from a store is often protected, and a protected track cannot be opened by a browser at all.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      description:
        "Browser-based ringtone maker. Trims a song to 60 seconds, fades the ends, and saves an MP3.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ToolRow current="/" />

      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[20ch] text-[32px] leading-tight sm:text-[38px]">
          Cut a ringtone out of a song
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          Open a track, drag the two handles over the part you want, and save it as an
          MP3. Up to 60 seconds. The song never leaves your device.
        </p>

        <div className="mt-8">
          <Workbench />
        </div>

        <section className="mt-14 max-w-[64ch]">
          <h2 className="text-[22px]">Getting it onto your phone</h2>
          <p className="mt-3 text-[16px] text-text-light">
            On Android, save the MP3, then open Settings, Sound, Phone ringtone, and pick
            it from your files. Some phones want the file in a Ringtones folder first.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            On an iPhone it is harder, and not because of anything here. iOS only accepts
            a ringtone as a .m4r file placed through a computer, and no web page can write
            into that part of the phone. The MP3 will play fine, but it cannot be set as
            the ringtone from the phone alone.
          </p>
        </section>

        <section className="mt-12 max-w-[64ch]">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-5 flex flex-col gap-5">
            {faq.map((item) => (
              <div key={item.question}>
                <dt className="text-[16px] font-semibold">{item.question}</dt>
                <dd className="mt-1 text-[16px] text-text-light">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
