import type { Metadata } from "next";
import { Workbench } from "@/components/invoice/Workbench";
import { DocSwitcher } from "@/components/invoice/DocSwitcher";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Quote and estimate maker, a clean PDF in two minutes | EveryKit Invoice" },
  description:
    "Fill in a form and download a clean PDF quote or estimate, with a validity date instead of a due date. The same exact-totals engine as the invoice, in your browser.",
  alternates: { canonical: absoluteUrl("/quote") },
};

const FAQ = [
  {
    q: "Is my quote uploaded?",
    a: "No. The form, the preview and the PDF are handled inside this browser tab, logo included. There is no server here that could receive any of it, and the network tab will show no request as you fill it in.",
  },
  {
    q: "What is the difference from an invoice?",
    a: "The words and one date. A quote says Quote rather than Invoice, and its second date is a validity date, when the price stops being guaranteed, rather than a due date. The figures and the exact-to-the-penny totals are the same engine.",
  },
  {
    q: "Is a quote the same as an estimate?",
    a: "Close enough that this covers both. A quote is usually a firm price and an estimate a likely one; the document is identical, so use whichever word your trade expects and set the validity date to when it lapses.",
  },
  {
    q: "Are the totals exact?",
    a: "Yes. Every amount is held as a whole number of the currency's smallest unit, so the lines, the discount and the tax add up exactly rather than drifting the way decimal arithmetic does.",
  },
  {
    q: "Can I turn a quote into an invoice later?",
    a: "Switch to the invoice at the top and re-enter the details, or keep the quote's number scheme and issue a matching invoice when the work is agreed. Nothing is stored here, so the two are separate documents you keep yourself.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((entry) => ({
    "@type": "Question",
    name: entry.q,
    acceptedAnswer: { "@type": "Answer", text: entry.a },
  })),
};

export default function QuotePage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <DocSwitcher current="/quote" />
      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[22ch] text-[32px] leading-tight sm:text-[38px]">
          A clean PDF quote in two minutes
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          The same maker as the invoice, worded as a quote, with a validity date in place of a due
          date. The totals are worked out in whole pence, and nothing you type leaves this device.
        </p>
        <div className="mt-8">
          <Workbench today={today} docType="quote" />
        </div>
        <section className="mt-16 max-w-[820px]">
          <h2 className="text-[22px]">Questions</h2>
          <dl className="mt-5 flex flex-col gap-5">
            {FAQ.map((entry) => (
              <div key={entry.q}>
                <dt className="text-[16px] font-semibold">{entry.q}</dt>
                <dd className="mt-1 max-w-[64ch] text-[15px] text-text-light">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
