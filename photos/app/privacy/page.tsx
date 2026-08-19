import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What EveryKit Photos does and does not collect. Your photo is processed in your browser and never uploaded. If you give us your email, we store that.",
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
            Before a download we ask for your email address, and it is
            required. There is no skip link. You are asked once per session,
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
          <h2 className="text-[19px] text-foreground">Analytics</h2>
          <p className="mt-2">
            There are none. No analytics script runs on this site, no cookies
            are set, and nothing counts your visit. That is why you are not
            being asked to dismiss a banner.
          </p>
          <p className="mt-2">
            The server keeps ordinary web server logs, as every web server does.
            If page counts are ever added back, this page will say so before
            they are.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Accounts and payments</h2>
          <p className="mt-2">
            There are no accounts. Nothing to sign up for, no password, and
            nothing to log into.
          </p>
          <p className="mt-2">
            If and when paid downloads are switched on, payment will be handled
            by Lemon Squeezy, who will collect what they need to take a payment.
            Their privacy policy will apply to that part. We will not receive
            your card details.
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
