import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit Letters writes a properly formed letter, but it is not legal advice and cannot know your situation.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Terms</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 18 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What we promise</h2>
          <p className="mt-2">
            The letter you see on screen is the letter you get. It follows the
            conventions of formal correspondence, leaves nothing blank where you
            skipped a question, and downloads as a PDF and a Word file laid out
            the way a formal letter should be.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">This is not legal advice</h2>
          <p className="mt-2">
            A well-written letter can still be the wrong thing to send. These
            templates cannot know your contract, your tenancy, your jurisdiction
            or your deadline, and none of them has been reviewed by a lawyer for
            your situation.
          </p>
          <p className="mt-2">
            Where money, a deadline or your housing is at stake, such as a notice
            period, a dispute or an appeal, get advice as well. Use the letter to
            say the thing clearly, not to work out whether to say it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Read it before you send it</h2>
          <p className="mt-2">
            The letter is assembled from what you typed. If a date, a name or a
            reference is wrong in the form, it will be wrong in the letter.
            Check those in particular. They are what actually goes wrong.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What it costs</h2>
          <p className="mt-2">
            Nothing. Every kit here is free to use. If that ever changes, this
            page will say so before it does.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Liability</h2>
          <p className="mt-2">
            This is a small tool offered as is. We are not responsible for the
            outcome of a letter you send: a refused application, a rejected
            notice, a dispute that goes badly. If that risk is not acceptable
            for your situation, have the letter drafted by someone who can take
            responsibility for it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your letter</h2>
          <p className="mt-2">
            It stays yours. We never receive it, so we claim no rights over it.
            See the{" "}
            <a className="ek-link" href="/privacy">
              privacy page
            </a>{" "}
            for how that works.
          </p>
        </section>
      </div>
    </div>
  );
}
