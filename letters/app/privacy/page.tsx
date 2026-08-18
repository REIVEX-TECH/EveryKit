import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What EveryKit Letters does and does not collect. Your letter is built in your browser and never uploaded. If you give us your email, we store that.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Privacy</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 18 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">Your letter</h2>
          <p className="mt-2">
            Your letter is never uploaded — it is built in your browser. Every
            word you type stays in the tab. The templates, the assembling, the
            PDF and the Word file are all produced on your own device, because
            there is no server here to send them to.
          </p>
          <p className="mt-2">
            That matters more here than in most places. A resignation, a visa
            appeal, a complaint, a child&apos;s absence from school — these are
            private, and none of it reaches us.
          </p>
          <p className="mt-2">
            Nothing is saved either. Refresh the page and the draft is gone.
            That is a deliberate trade: no drafts to recover, and nothing left
            behind on a shared computer.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your email address</h2>
          <p className="mt-2">
            Before you copy or download a letter we ask for your email address.
            Giving it is optional — there is a skip link, and the letter is the
            same either way.
          </p>
          <p className="mt-2">
            If you do enter it, we store it: the address itself, which kit you
            were using, and the dates you first and last gave it. That is the
            whole record. It is not linked to your letter, because your letter
            never reaches us. We use it to tell you when a new kit launches. We
            do not sell it and we do not pass it on.
          </p>
          <p className="mt-2">
            There is no confirmation email and no marketing sequence. To be
            removed, write to{" "}
            <a className="ek-link" href="mailto:hello@useeverykit.com">
              hello@useeverykit.com
            </a>{" "}
            and the row is deleted.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Analytics</h2>
          <p className="mt-2">
            We use Vercel Analytics to count page views. It sets no cookies and
            does not follow you between sites, which is why you are not being
            asked to dismiss a banner. We can see that a page was viewed,
            roughly from where, and on what sort of device. We cannot see who
            you are or what you wrote.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Accounts and payments</h2>
          <p className="mt-2">
            There are no accounts, no passwords and nothing to log into. When
            the formatted files are paid for, the payment is handled by Lemon
            Squeezy, who collect what they need to take it. We never receive
            your card details.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Getting in touch</h2>
          <p className="mt-2">
            EveryKit is made by Reivex. Questions about this page can go to{" "}
            <a className="ek-link" href="mailto:hello@useeverykit.com">
              hello@useeverykit.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
