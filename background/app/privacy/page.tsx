import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What EveryKit PDF does and does not collect. Your files are opened in your browser and never uploaded. If you give us your email, we store that.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Privacy</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 19 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">Your files</h2>
          <p className="mt-2">
            Your files are never uploaded. Choosing one hands it to the browser tab, not to
            us. The merging, splitting, reordering and compressing all run on your own
            device. There is no server that receives document data, because this tool does
            not have a backend at all.
          </p>
          <p className="mt-2">
            Nothing is saved either. A file lives in the tab&apos;s memory while you work and
            is gone when you close it. Downloads are written straight to your device by the
            browser.
          </p>
          <p className="mt-2">
            You do not have to take this on trust. Open your browser&apos;s developer tools,
            switch to the network tab, and run any tool on this site. No request carries your
            file.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What does get requested</h2>
          <p className="mt-2">
            To be precise rather than merely reassuring: the two libraries that do the work
            are served from this site along with the rest of the page, so there is no
            third-party download while you use a tool.
          </p>
          <p className="mt-2">
            Three requests do go to useeverykit.com. One reads the list of other kits, to
            show the strip at the end. One counts the page view, carrying the page and
            nothing about you. The third sends your email address, but only if you type one
            in. All three are limited by a content security policy that names every host
            this page is allowed to contact. Your files are not on that list, and could not be
            added to without changing this page too.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your email address</h2>
          <p className="mt-2">
            Before a download we ask for your email address, and you can skip it. You are asked once per session; after that the
            downloads in that session go straight through.
          </p>
          <p className="mt-2">
            If you do enter it, we store it: the address itself, which kit you were using,
            and the dates you first and last gave it. That is the whole record. It is not
            linked to your document, because your document never reaches us. We use it to
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
            nothing about your address, your browser or where you came from is written
            into the count.
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
          <p className="mt-2">
            One thing does read your address. So that a single machine cannot flood the
            sign-up form or guess at the login, the server keeps a running count of recent
            requests per address, in memory, for about a minute. It is not written to disk,
            it does not survive a restart, and nothing is ever looked up in it.
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
