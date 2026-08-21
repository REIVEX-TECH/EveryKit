import type { Metadata } from "next";
import { CONTACT_EMAIL, PARENT_NAME, PARENT_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "EveryKit is a small family of single-purpose web tools by Reivex. Files are processed in your browser, and every tool is free to use.",
  alternates: { canonical: absoluteUrl("/about") },
};

export default function AboutPage() {
  return (
    <div className="ek-shell max-w-[640px] py-16">
      <h1 className="text-[32px]">About</h1>

      <div className="mt-8 space-y-4 text-[17px] text-text-light">
        <p>
          EveryKit is a small family of web tools, each built to finish one
          ordinary task in about a minute.
        </p>
        <p>
          It is made by{" "}
          <a className="ek-link" href={PARENT_URL} rel="noopener">
            {PARENT_NAME}
          </a>
          , a product engineering studio in Lahore, working for people
          everywhere.
        </p>
        <p>
          Every tool runs in your browser, so the file you are working on never
          leaves your device and we never see it.
        </p>
        <p>
          Every kit is free to use. No account, no subscription, nothing to
          cancel.
        </p>
        <p>
          Questions go to{" "}
          <a className="ek-link" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
