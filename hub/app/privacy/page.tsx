import type { Metadata } from "next";
import { CONTACT_EMAIL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What EveryKit collects. The tools process your files in your browser; this site counts page views and nothing else.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <div className="ek-shell max-w-[640px] py-16">
      <h1 className="text-[32px]">Privacy</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 17 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">Your files</h2>
          <p className="mt-2">
            The kits do their work in your browser. A photo you drop into
            EveryKit Photos is read by the tab and cropped there; it is never
            sent to us, because there is no server to send it to. Nothing is
            stored, so closing the tab is all it takes to clear it.
          </p>
          <p className="mt-2">
            Each kit has its own privacy page describing exactly what it does.
            If a kit ever needs to send something somewhere, its page will say
            so plainly.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">This site</h2>
          <p className="mt-2">
            This page and the directory use Vercel Analytics to count visits. It
            sets no cookies and does not follow you between sites, which is why
            you are not being asked to dismiss a banner. We can see that a page
            was viewed, roughly from where, and on what sort of device. We
            cannot see who you are.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Accounts and payments</h2>
          <p className="mt-2">
            There are no accounts and nothing to sign up for. When a kit charges
            for a file, the payment is handled by Lemon Squeezy, who collect
            what they need to take it. We never receive your card details.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Getting in touch</h2>
          <p className="mt-2">
            Write to{" "}
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
