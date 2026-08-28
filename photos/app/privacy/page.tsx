import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What EveryKit ID Photos does and does not collect. Your photo is processed in your browser and never uploaded. If you give us your email, we store that.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Privacy</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 17 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">Your photo</h2>
          <p className="mt-2">
            Your photo is never uploaded. Choosing a file hands it to the browser
            tab, not to us. The face detection, the cropping and the background
            removal all run on your own device. There is no server that receives
            image data, because this tool does not have a backend at all.
          </p>
          <p className="mt-2">
            The photo is not saved either. It lives in the tab&apos;s memory
            while you work and is gone when you close it. Downloads go straight
            to your device.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What does get requested</h2>
          <p className="mt-2">
            To be precise rather than merely reassuring: the tool downloads two
            things the first time you use them, the face detection model and,
            if you ask for a white background, the segmentation model. Those are
            ordinary file downloads from public CDNs. They carry no information
            about you and none of your image data goes with them. Your
            device&apos;s IP address is visible to those CDNs, as it is for any
            file a website loads.
          </p>
          <p className="mt-2">
            The face detection library also tries to send usage statistics back
            to Google, which it offers no setting to turn off. This site blocks
            that request with a content security policy that names the only three
            hosts the page is allowed to contact. The library carries on working
            without it.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your email address</h2>
          <p className="mt-2">
            Before a download we ask for your email address, and you can skip it. You are asked once per session,
            after that the downloads in that session go straight through.
          </p>
          <p className="mt-2">
            If you do enter it, we store it: the address itself, which kit you
            were using, and the dates you first and last gave it. That is the
            whole record. It is not linked to your photo, because your photo
            never reaches us. We use it to tell you when a new kit launches. We
            do not sell it and we do not pass it on.
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
