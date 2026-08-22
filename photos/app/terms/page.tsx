import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit ID Photos gets the measurements right, but cannot promise your application will be accepted.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Terms</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 17 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What we promise</h2>
          <p className="mt-2">
            The file you download will be the pixel dimensions and DPI shown on
            screen, and the head will be positioned to the measurements published
            for the document you picked.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            We cannot promise your photo will be accepted. Passport and visa
            offices judge things a browser cannot see: your expression, whether
            you are wearing glasses, how recent the photo is, whether the
            lighting is even, and their own discretion. The checklist in the tool
            marks those as yours to confirm because they genuinely are.
          </p>
          <p className="mt-2">
            The size requirements themselves come from published guidance and can
            change. Some entries are marked as needing checking against an
            official source. If the instructions you were sent say something
            different, follow those.
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
            This is a small tool offered as is. We are not responsible for a
            rejected application, a missed appointment, or the cost of retaking a
            photo. If that risk is not acceptable for your situation, use a photo
            studio.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your photo</h2>
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
