import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What EveryKit Dev does and does not collect. Everything you paste stays in your browser. If you give us your email, we store that.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Privacy</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 19 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What you paste</h2>
          <p className="mt-2">
            It is never uploaded. Every tool here runs in the browser tab: the JSON parsing,
            the hashing, the regex matching, the diffing, all of it. There is no server that
            receives your input, because this kit does not have a backend at all.
          </p>
          <p className="mt-2">
            That matters more here than on most of our kits, because of what a developer
            tool sees: a token from production, a config file with a connection string in
            it, a customer record inside a JSON payload. None of it leaves your device.
          </p>
          <p className="mt-2">
            Nothing is saved either. What you paste lives in the tab&apos;s memory while you
            work and is gone when you close it. There are no drafts and no history.
          </p>
          <p className="mt-2">
            You do not have to take this on trust. Open your browser&apos;s developer tools,
            switch to the network tab, and use any tool on this site. No request carries what
            you pasted.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What does get requested</h2>
          <p className="mt-2">
            To be precise rather than merely reassuring: the two small libraries that do
            some of the work, an MD5 implementation and a diff algorithm, are served from
            this site along with the rest of the page. There is no third-party download and
            no CDN while you use a tool.
          </p>
          <p className="mt-2">
            Three requests do go to useeverykit.com. One reads the list of other kits, to
            show the strip at the end. One counts the page view, carrying the page and
            nothing about you. The third sends your email address, but only if you type one
            in. All three are limited by a content security policy that names every host
            this page is allowed to contact. Your input is not on that list, and could not be
            added to without changing this page too.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your email address</h2>
          <p className="mt-2">
            Before your first copy or download we ask for your email address, and it is
            required. There is no skip link. You are asked once per session; after that
            every copy and download in that session goes straight through.
          </p>
          <p className="mt-2">
            If you do enter it, we store it: the address itself, which kit you were using,
            and the dates you first and last gave it. That is the whole record. It is not
            linked to anything you pasted, because none of that reaches us. We use it to
            tell you when a new kit launches. We do not sell it and we do not pass it on.
          </p>
          <p className="mt-2">
            To be removed, email{" "}
            <a className="ek-link" href="mailto:hello@useeverykit.com">
              hello@useeverykit.com
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
            EveryKit is made by Reivex. Questions about this page can go to{" "}
            <a className="ek-link" href="https://reivex.io" rel="noopener">
              reivex.io
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
