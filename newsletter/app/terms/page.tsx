import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit Newsletter builds the email in your browser and never receives what you make, but to send it you host the images and swap the local paths for hosted URLs.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Terms</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 19 September 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What we promise</h2>
          <p className="mt-2">
            The builder runs in your browser, and the export is table based, email safe HTML
            with inline styles and a fixed 600 pixel width. That output is covered by tests
            that run before the code ships, so the structure email clients need is there
            rather than assumed.
          </p>
          <p className="mt-2">
            What you build is not uploaded. That is not a policy we could quietly change,
            because there is no server here that receives it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            Email clients render HTML in ways that differ from each other and from a web
            browser, and none of them is a full modern browser. We generate the safe,
            table based HTML that travels best across Gmail, Outlook and Apple Mail, but we
            cannot guarantee an identical result in every client and version.
          </p>
          <p className="mt-2">
            The export references its images by a local path, like <code>images/photo.png</code>.
            Email cannot read files from a folder on someone else&apos;s computer, so to
            actually send the newsletter you host those images somewhere and replace each
            local path with its hosted web address. That is a property of email, not a fault
            in the export, and the included README says the same thing.
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
            This is a small tool offered as is. Test anything that matters by sending
            yourself the finished email before you send it to a list. We are not responsible
            for how a given client displays it or for a send made from it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What you build</h2>
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
