import type { Metadata } from "next";
import { CONTACT_EMAIL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit tools are free, they do what their pages say, and each kit's own terms cover the details.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="ek-shell max-w-[640px] py-16">
      <h1 className="text-[32px]">Terms</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 17 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What we promise</h2>
          <p className="mt-2">
            Each kit does what its own page says it does, and shows you the
            finished result at full quality before you take it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            A tool that produces a correct file cannot promise the outcome you
            wanted from it. EveryKit Photos can crop to a published passport
            photo size; it cannot decide whether an embassy accepts your
            application. Each kit is specific about where that line falls.
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
            These are small tools offered as is. We are not responsible for what
            follows from using one, such as a rejected application, a missed
            deadline, or the cost of starting again. If that risk does not suit
            your situation, use a professional service.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your files</h2>
          <p className="mt-2">
            They stay yours. We never receive them, so we claim nothing over
            them. Questions to{" "}
            <a className="ek-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
