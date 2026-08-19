import type { Metadata } from "next";
import { Workbench } from "@/components/invoice/Workbench";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // Absolute, so the layout template does not append the site name twice.
  title: { absolute: `${SITE_NAME}, a clean PDF invoice in two minutes` },
  description:
    "Fill in a form and download a clean PDF invoice. Handles currencies, tax and discounts, with the arithmetic done in whole minor units so the totals are exact.",
  alternates: { canonical: absoluteUrl("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  description:
    "Browser-based invoice maker. Produces an A4 PDF invoice with tax, discount and multiple currencies.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const FAQ = [
  {
    q: "Is my invoice uploaded?",
    a: "No. The form, the preview and the PDF are all handled inside this browser tab, including the logo. There is no server here that could receive any of it, and you can check with your browser's network tab: filling the form produces no requests at all.",
  },
  {
    q: "Are the totals exact?",
    a: "Yes, and that took some care. Every amount is held as a whole number of the currency's smallest unit, so pence and paisa are integers and never floating point numbers. Adding 0.10 and 0.20 as decimals gives 0.30000000000000004; adding them here gives 30 pence.",
  },
  {
    q: "How is the rounding decided?",
    a: "Each line is rounded on its own, and the subtotal is those rounded lines added up. Discount and tax are then each worked out on the subtotal and rounded once. The alternative, keeping full precision until the end, produces a total that does not match the printed lines when somebody adds them by hand, which is worse than being a hundredth of a unit from the theoretical answer.",
  },
  {
    q: "Is the discount taken before or after tax?",
    a: "Before. VAT and GST are both charged on what is actually paid rather than on the list price, so the discount comes off the subtotal and tax is charged on what is left.",
  },
  {
    q: "Which currencies are supported?",
    a: "US dollar, euro, pound, Pakistani rupee, Indian rupee, UAE dirham, Saudi riyal, Canadian and Australian dollars, and Japanese yen. Digits are grouped the way each currency's readers expect, so an Indian invoice reads 1,00,000 rather than 100,000, and the yen has no decimal places because it has no minor unit.",
  },
  {
    q: "Can I put my logo on it?",
    a: "Yes, a PNG or JPG up to 2 MB. It is read on this device, drawn into the preview and embedded into the PDF here. It is never uploaded.",
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

export default function Home() {
  // Rendered on the server, so every visitor starts with a sensible issue date
  // rather than a blank field.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="ek-shell py-10 sm:py-14">
        <h1 className="max-w-[20ch] text-[32px] leading-tight sm:text-[38px]">
          A clean PDF invoice in two minutes
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] text-text-light">
          Fill in the form and watch the page build itself. The totals are worked out in whole
          pence and paisa, so they add up exactly, and nothing you type leaves this device.
        </p>

        <div className="mt-8">
          <Workbench today={today} />
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
