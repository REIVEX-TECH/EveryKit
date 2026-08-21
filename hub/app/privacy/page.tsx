import type { Metadata } from "next";
import { CONTACT_EMAIL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What EveryKit collects: your email address, if you give it. Your files are processed in your browser and never uploaded.",
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
          <p className="mt-2">
            This is about your files, and it is the one promise the whole thing
            is built around. It is not a claim that we collect nothing at all.
            See below.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your email address</h2>
          <p className="mt-2">
            The kits ask for an email address before you download what you made,
            and it is required. There is no skip link. You are asked once per
            session in a kit, and after that the downloads in that session go
            straight through.
          </p>
          <p className="mt-2">
            If you do give it, we keep one row: the address, which kit you were
            using, and when you first and last entered it. Nothing about what you
            made is stored alongside it, because none of that ever reaches us. We
            use it to tell you when a new kit launches. We do not sell it, and we
            do not pass it to anyone else.
          </p>
          <p className="mt-2">
            There is no confirmation email and no marketing sequence. To be
            removed, write to{" "}
            <a className="ek-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            and the row is deleted.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Page counts</h2>
          <p className="mt-2">
            We count page views in aggregate: which page, which day, how many times.
            Nothing about you is stored. No cookie is set, no identifier is created, and
            your address, your browser and where you came from are all read by nothing and
            written nowhere.
          </p>
          <p className="mt-2">
            The record is four columns wide: a date, a kit, a path, and a number. Two
            people and one person twice look exactly the same in it, to us as much as to
            anyone else, which is why there is no banner here to dismiss.
          </p>
          <p className="mt-2">
            There is no analytics script on this site and no third-party service involved.
            The server also keeps ordinary web server logs, as every web server does.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Accounts and money</h2>
          <p className="mt-2">
            There are no accounts. Nothing to sign up for, no password, and
            nothing to log into. Everything here is free, so there is no
            processor in the middle and no card details are collected by
            anybody, us included.
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
