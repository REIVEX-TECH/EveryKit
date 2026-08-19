import type { Metadata } from "next";
import { TypeGrid } from "@/components/letter/TypeGrid";
import { LetterMiniature } from "@/components/site/LetterMiniature";
import { letterTypes } from "@/data/letters";
import { PARENT_NAME, PARENT_URL, SITE_NAME, absoluteUrl, hubUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `Formal letters, written for you, free templates | ${SITE_NAME}`,
  description:
    "Fourteen formal letters, covering visa invitations, resignations, complaints and notice to a landlord, written properly from a short form. Built in your browser.",
  alternates: { canonical: absoluteUrl("/") },
  openGraph: { url: absoluteUrl("/") },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Assembles formal letters from a short form, in the browser, without uploading the letter anywhere.",
  publisher: {
    "@type": "Organization",
    name: "EveryKit by Reivex",
    url: hubUrl("/"),
    parentOrganization: { "@type": "Organization", name: PARENT_NAME, url: PARENT_URL },
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="ek-shell py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
          <div className="max-w-[560px]">
            <h1 className="text-[34px] sm:text-[40px]">Formal letters, written for you</h1>
            <p className="mt-4 text-[17px] text-text-light">
              Most people do not write formal letters often enough to know the
              conventions: what to include, how to open, how firm to sound.
              Answer a few questions and the letter comes out right.
            </p>
            <p className="mt-3 text-[15px] text-text-light">
              Fourteen kinds, free to read and copy. Your letter is never
              uploaded, because it&apos;s built in your browser.
            </p>

            <div id="types" className="mt-8 scroll-mt-8">
              <TypeGrid
                types={letterTypes.map(({ slug, title, whoItsFor }) => ({
                  slug,
                  title,
                  whoItsFor,
                }))}
              />
            </div>
          </div>

          <div className="lg:pt-2">
            <LetterMiniature />
          </div>
        </div>

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">How the letters are written</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-[16px]">Templates, not a chatbot</h3>
              <p className="mt-2 text-[14px] text-text-light">
                Each letter is hand-written and assembled from your answers. It
                costs nothing to run, works with no connection, and says the
                same correct thing every time.
              </p>
            </div>
            <div>
              <h3 className="text-[16px]">Nothing left blank</h3>
              <p className="mt-2 text-[14px] text-text-light">
                Skip an optional question and its sentence disappears. You will
                never send a letter with a stray comma or an empty bracket in
                it.
              </p>
            </div>
            <div>
              <h3 className="text-[16px]">The right conventions</h3>
              <p className="mt-2 text-[14px] text-text-light">
                Dear Sir or Madam closes Yours faithfully; a named person closes
                Yours sincerely. Small things, and the ones that show whether a
                letter was written by someone who writes them.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[22px]">What this does not do</h2>
          <ul className="mt-4 max-w-[640px] space-y-2 text-[15px] text-text-light">
            <li>
              It is not legal advice. A letter can be well written and still be
              the wrong move. For anything with a deadline or money at stake,
              take advice as well.
            </li>
            <li>
              It cannot know your situation. Read the letter before you send it
              and change anything that is not true of you.
            </li>
            <li>
              It does not save your draft. Close the tab and the letter is gone,
              which is deliberate.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
