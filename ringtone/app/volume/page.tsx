import type { Metadata } from "next";
import { VolumeTool } from "@/components/ringtone/VolumeTool";
import { ToolRow } from "@/components/ringtone/ToolRow";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Change audio volume online, free, and never uploaded | EveryKit Ringtone" },
  description:
    "Make an audio file louder or quieter, with a warning before it clips, and optional fade in and out. Runs in your browser as MP3.",
  alternates: { canonical: absoluteUrl("/volume") },
};

const FAQ = [
  { q: "Is my file uploaded?", a: "No. The audio is decoded, adjusted and re-encoded inside this browser tab. There is no server that could receive it, and the network tab will show no request carrying it." },
  { q: "What is clipping, and why the warning?", a: "Turning the volume past what the audio format can hold does not make it louder, it flattens the loud parts into a buzz. The tool measures how much of your clip would clip at the volume you chose and warns you, and offers the loudest setting that stays clean." },
  { q: "How loud can I make it?", a: "Up to three times, but only as far as the audio allows before clipping. If a track is already near its ceiling there is little room; a quiet recording can take a lot. The clean limit is shown as you slide." },
  { q: "Can I fade it in or out?", a: "Yes, both, over half a second each. Useful for a ringtone that should not start with a jolt or end with a hard cut." },
  { q: "What does it save as?", a: "MP3 at 128 kbps, made on this device. Your original is untouched." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((e) => ({ "@type": "Question", name: e.q, acceptedAnswer: { "@type": "Answer", text: e.a } })),
};

export default function VolumePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <ToolRow current="/volume" />
      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[22ch] text-[32px] leading-tight sm:text-[38px]">Change the volume</h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          Make a clip louder or quieter, with a warning before it starts to clip, and a fade in or
          out if you want one. It is saved as an MP3, and nothing leaves this device.
        </p>
        <div className="mt-8">
          <VolumeTool />
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
