import type { Metadata } from "next";
import { ConvertTool } from "@/components/ringtone/ConvertTool";
import { ToolRow } from "@/components/ringtone/ToolRow";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Convert audio to MP3 online, free, and never uploaded | EveryKit Ringtone" },
  description:
    "Convert WAV, M4A, OGG and more to MP3 in your browser. Decoding uses the browser's own decoder, so nothing is uploaded.",
  alternates: { canonical: absoluteUrl("/convert") },
};

const FAQ = [
  { q: "Is my file uploaded?", a: "No. The file is decoded and re-encoded inside this browser tab. There is no server here that could receive it, and the network tab will show no request carrying your audio." },
  { q: "Which formats can it read?", a: "It uses the browser's own decoder, so WAV and MP3 work everywhere, M4A, AAC and OGG in most browsers, and FLAC in some. If a file will not decode, the tool says so rather than failing silently, and WAV or MP3 always work." },
  { q: "What does it save as?", a: "MP3, at 128 kbps, which every phone and player accepts and which is what a ringtone wants. The encoding is done here with a bundled encoder, not sent anywhere." },
  { q: "Will converting lose quality?", a: "A little, because MP3 is lossy and re-encoding always is. From a lossless source like WAV the loss is small at this bitrate; converting an MP3 to MP3 loses a little more, so keep your original if you can." },
  { q: "Can it convert a whole album at once?", a: "One file at a time here. Decoding several large files at once is how a phone browser runs out of memory, so this keeps to one and does it cleanly." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((e) => ({ "@type": "Question", name: e.q, acceptedAnswer: { "@type": "Answer", text: e.a } })),
};

export default function ConvertPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <ToolRow current="/convert" />
      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[22ch] text-[32px] leading-tight sm:text-[38px]">Convert audio to MP3</h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          Drop in a WAV, M4A or OGG and get an MP3 back. The decoding is your browser&rsquo;s own,
          so nothing is uploaded, and the MP3 is made on this device.
        </p>
        <div className="mt-8">
          <ConvertTool />
        </div>
        <section className="mt-16 max-w-[820px]">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-5 flex flex-col gap-5">
            {FAQ.map((e) => (
              <div key={e.q}>
                <dt className="text-[16px] font-semibold">{e.q}</dt>
                <dd className="mt-1 max-w-[64ch] text-[15px] text-text-light">{e.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
