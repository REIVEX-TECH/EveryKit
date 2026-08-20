import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit Calc does the arithmetic in your browser and never receives what you type, but a loan estimate is not a quote and none of this is financial advice.",
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
            Each calculator does what its page says, and the arithmetic in every one of
            them is covered by tests that run before the code ships. Unit factors are the
            exact international definitions, the loan schedule is worked in whole cents, and
            dates are counted in whole calendar days.
          </p>
          <p className="mt-2">
            What you type is not uploaded. That is not a policy we could quietly change,
            because there is no server here that receives it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            The loan calculator is for planning and is not financial advice. Fees,
            insurance, a different day count convention and any rate that is not fixed will
            all move the number, so the offer document is the real one and this is an
            estimate. Whether a loan is a good idea is a question about your circumstances,
            and nothing here knows any of them.
          </p>
          <p className="mt-2">
            Some answers depend on a convention rather than a fact. A 29 February birthday
            is counted on 1 March in a common year here, and some places count 28 February.
            Whether the end date counts in a date difference is a switch, because both
            answers are right for different questions. The tools say which they are using.
          </p>
          <p className="mt-2">
            Regional units vary. A marla is given here as the standard 25.29 square metres,
            and local variants exist, so check a deed rather than this page if it matters.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Refunds</h2>
          <p className="mt-2">
            Nothing here is paid, so there is nothing to refund. This kit has no checkout
            and no plans for one.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Liability</h2>
          <p className="mt-2">
            These are small tools offered as is. Check anything that matters against the
            people who decide it: your bank, your registrar, your contract. We are not
            responsible for a decision made on a number from this page alone.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What you type</h2>
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
