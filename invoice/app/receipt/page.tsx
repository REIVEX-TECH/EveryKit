import type { Metadata } from "next";
import { Workbench } from "@/components/invoice/Workbench";
import { DocSwitcher } from "@/components/invoice/DocSwitcher";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Receipt maker, a clean PDF in two minutes | EveryKit Invoice" },
  description:
    "Fill in a form and download a clean PDF receipt, marked paid, with the payment method and date. The same exact-totals engine as the invoice, in your browser.",
  alternates: { canonical: absoluteUrl("/receipt") },
};

const FAQ = [
  {
    q: "Is my receipt uploaded?",
    a: "No. The form, the preview and the PDF are handled inside this browser tab, logo included. There is no server here that could receive any of it, and the network tab will show no request as you fill it in.",
  },
  {
    q: "What makes it a receipt rather than an invoice?",
    a: "A receipt records a payment that has already happened. This one is marked Paid, its second date is the date paid rather than a due date, and it carries a line for how it was paid: cash, card, bank transfer, whatever applies.",
  },
  {
    q: "Can I record how it was paid?",
    a: "Yes. There is a Paid by field, and whatever you put there, card ending 4417, bank transfer, cash, is printed on the receipt below the total.",
  },
  {
    q: "Are the totals exact?",
    a: "Yes. Every amount is held as a whole number of the currency's smallest unit, so the lines, any discount and the tax add up exactly rather than drifting the way decimal arithmetic does.",
  },
  {
    q: "Does it prove a payment was made?",
    a: "It is a record you issue, the same standing as any receipt written on paper or from a till. It documents that you received the payment; it is not a bank confirmation, which only your bank can give.",
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

export default function ReceiptPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <DocSwitcher current="/receipt" />
      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[22ch] text-[32px] leading-tight sm:text-[38px]">
          A clean PDF receipt in two minutes
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          The same maker as the invoice, worded as a receipt: marked paid, dated to when it was
          paid, with a line for the payment method. The totals are exact, and nothing leaves this
          device.
        </p>
        <div className="mt-8">
          <Workbench today={today} docType="receipt" />
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
