import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit Dev runs every tool in your browser and never receives what you paste, but a decoder is not a validator and a hash is not a guarantee.",
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
            Each tool does what its page says, and every one of them is covered by tests
            that run before the code ships. The cron explainer, the encoders and the hashes
            are checked against published examples and known vectors rather than against our
            own opinion of what they should produce.
          </p>
          <p className="mt-2">
            What you paste is not uploaded. That is not a policy we could quietly change,
            because there is no server here that receives it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            The JWT tool does not verify signatures, and no tool here tells you whether
            something is safe. A token that decodes cleanly is well formed, not valid. A
            hash that matches tells you a file is the one that was published, not that the
            file is harmless.
          </p>
          <p className="mt-2">
            We cannot promise a tool understands every dialect. The cron explainer reads the
            standard five fields and refuses the shorthands rather than guessing at them,
            and the regex tester is your browser&apos;s own engine, so patterns written for
            other flavours may not behave the same way.
          </p>
          <p className="mt-2">
            Very large input is limited by your device&apos;s memory rather than a
            server&apos;s. A multi-megabyte document is fine; a very large file hashed on an
            old phone may not finish.
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
            These are small tools offered as is. Check the output before you rely on it,
            particularly anything that will be committed or deployed. We are not responsible
            for work lost by trusting a result without reading it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What you paste</h2>
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
