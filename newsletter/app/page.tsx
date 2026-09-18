import type { Metadata } from "next";
import { Monitor } from "lucide-react";
import { Builder } from "@/components/newsletter/Builder";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free drag and drop email newsletter builder, no code",
  description:
    "Build an HTML email newsletter by dragging blocks onto a canvas, no code. Set colours, add images, and export email safe HTML that works in Gmail and Outlook. Free, and nothing is uploaded.",
  alternates: { canonical: absoluteUrl("/") },
};

/**
 * The questions people actually type into a search box for this. The visible
 * FAQ below and this JSON-LD are the same words, and must move together.
 */
const FAQ = [
  {
    q: "How do I make an HTML email without coding?",
    a: "Drag blocks (a heading, some text, an image, a button) onto the canvas, edit the text in place, and set colours and spacing in the panel on the right. When it looks right, press Download folder and you get email safe HTML plus the images it uses, ready to send from your email tool. No code is written at any point.",
  },
  {
    q: "Is this newsletter template builder free?",
    a: "Yes, free to use with no account. The builder runs in your browser, so there is nothing to sign up for and nothing to pay.",
  },
  {
    q: "Will the email work in Gmail and Outlook?",
    a: "That is the point of the export. The HTML is table based with inline styles, the layout every mail client still agrees on, rather than the flexbox and grid a normal web page uses, which Outlook does not understand. It is built to render in Gmail, Outlook and Apple Mail, not just a modern browser.",
  },
  {
    q: "Why do I have to host the images?",
    a: "Email cannot read image files from a folder on your computer, so the pictures have to live on the web. The export references each image by a local path like images/photo.png. Upload those files to your image host or email tool, then swap each path for its web address, and the email is ready to send.",
  },
  {
    q: "Are my images or my newsletter uploaded anywhere?",
    a: "No. Everything happens in your browser tab. The images you add are held in memory and written straight into the folder you download. There is no server here that receives them.",
  },
  {
    q: "Can I send the newsletter from EveryKit?",
    a: "Not yet. This tool builds and exports the email; you send it from your own email service, which is where your list and your unsubscribe handling already live. Sending from here is a possible future step.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  description:
    "A drag and drop builder that produces email safe HTML newsletters in the browser. Nothing is uploaded.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((entry) => ({
    "@type": "Question",
    name: entry.q,
    acceptedAnswer: { "@type": "Answer", text: entry.a },
  })),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="ek-shell pt-10">
        <div className="max-w-[720px]">
          <h1 className="text-[32px] leading-[1.15] sm:text-[40px]">
            Drag and drop email newsletter builder
          </h1>
          <p className="mt-4 text-[17px] text-text-light sm:text-[19px]">
            Build an HTML email without writing code. Drag blocks onto the canvas, edit the text in
            place, drop in your images, and export email safe HTML that renders in Gmail and Outlook.
            It all runs in your browser, so nothing is uploaded.
          </p>
        </div>
      </div>

      {/* The builder is desktop-first. On a phone a full drag-and-drop canvas
          would be a broken experience, so a clear notice stands in for it. */}
      <div className="md:hidden">
        <div className="ek-shell py-10">
          <div className="ek-card flex flex-col items-start gap-3 p-6">
            <Monitor aria-hidden="true" className="h-7 w-7 text-primary-dark" />
            <h2 className="text-[20px]">Best used on a larger screen</h2>
            <p className="text-[15px] text-text-light">
              The builder works by dragging blocks onto a canvas, which needs a laptop or desktop.
              Open this page on a bigger screen to start building. You can still read how it works
              below.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <Builder />
      </div>

      {/* SEO and help content, below the tool. */}
      <div className="ek-shell max-w-[760px] py-14">
        <section>
          <h2 className="text-[24px]">How to make a newsletter email without coding</h2>
          <ol className="mt-5 flex flex-col gap-4">
            {[
              "Drag a block from the palette onto the canvas, or click it to add. Start with a heading and some text.",
              "Click any text to edit it in place. Use the panel on the right to set colours, alignment, font size and spacing.",
              "Add images to the workspace, then drag one onto the canvas or choose it inside an image block.",
              "Press Download folder. You get email safe HTML and the images it uses, zipped and named after your newsletter.",
              "Host the images, swap the images/... paths for their web addresses, and paste the HTML into your email service to send.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3 text-[16px] text-text-light">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-soft text-[14px] font-semibold text-foreground">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-[24px]">What it does, and what it does not</h2>
          <p className="mt-3 text-[16px] text-text-light">
            It builds the email and hands you the files. The HTML is table based with inline styles,
            the format mail clients render reliably, so what you see in the preview is close to what
            lands in an inbox.
          </p>
          <p className="mt-3 text-[16px] text-text-light">
            It does not host your images or send the email. Email cannot read files from your
            computer, so to go live you host the images and point the HTML at their web addresses,
            then send from your own email service. That keeps your list and your unsubscribe handling
            where they already are.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-[24px]">Questions</h2>
          <dl className="mt-5 flex flex-col gap-5">
            {FAQ.map((entry) => (
              <div key={entry.q}>
                <dt className="text-[16px] font-semibold">{entry.q}</dt>
                <dd className="mt-1 max-w-[68ch] text-[15px] text-text-light">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
