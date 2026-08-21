import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit Study does the arithmetic in your browser and never receives your grades, but your institution decides your grade and your style guide decides your citation.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Terms</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 19 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What we promise</h2>
          <p className="mt-2">
            Each tool does what its page says, and the arithmetic in every one of them is
            covered by tests that run before the code ships. The GPA is weighted by credits,
            the final grade calculation is the standard rearrangement, and the citation
            formats are checked against published examples of each style.
          </p>
          <p className="mt-2">
            What you type is not uploaded. That is not a policy we could quietly change,
            because there is no server here that receives it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            We cannot promise your institution calculates a GPA the way this does. The four
            point scale here is the common United States one, and plenty of places use
            another, weight honours courses differently, or drop a failed retake. Check the
            number against your own registrar before relying on it.
          </p>
          <p className="mt-2">
            We cannot promise a citation is complete. The generator formats the fields you
            fill in; it looks nothing up and verifies nothing, and both styles have rules
            for sources this form has no field for. Your department may have house
            variations on top of that.
          </p>
          <p className="mt-2">
            The page estimate in the reading time tool is an estimate. It names the font,
            spacing and margins it assumes, and changing any of them changes the answer.
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
            These are small tools offered as is. Check anything that matters against your
            syllabus, your registrar or your style guide. We are not responsible for a grade
            or a mark lost by trusting a number here over the people who set it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your work</h2>
          <p className="mt-2">
            It stays yours. We never receive it, so we claim no rights over it. See the{" "}
            <Link className="ek-link" href="/privacy">
              privacy page
            </Link>{" "}
            for how that works.
          </p>
        </section>
      </div>
    </div>
  );
}
