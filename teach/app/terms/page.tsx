import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit Teach does the work in your browser and never receives your class, but your institution decides your grading policy and how a curve is applied.",
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
            Each tool does what its page says, and the maths in every one of them, the
            weighted totals, the statistics and the curve, is covered by tests that run
            before the code ships. The tools show their working so you can check it.
          </p>
          <p className="mt-2">
            What you type is not uploaded. That is not a policy we could quietly change,
            because there is no server here that receives it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            We cannot promise a curve or a grade scale matches your institution&apos;s policy.
            Curving is a policy choice, not a formula, and the methods here, standard-deviation
            bands, percentile quotas and a linear scale-up, are different by design. Follow the
            rules your institution sets, and use the tool to see and check the maths, not to
            decide the policy for you.
          </p>
          <p className="mt-2">
            We cannot promise a letter grade is the one your institution would assign. The
            grade-scale cutoffs are yours to set, and departments differ. Check the numbers
            against your own policy before relying on them.
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
