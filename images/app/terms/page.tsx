import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit PDF does the job in your browser and never receives your file, but it cannot promise a smaller file when there is nothing to compress.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Terms</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 19 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What we promise</h2>
          <p className="mt-2">
            The tools do what their pages say: pages come out in the order you set, the
            pages you chose are the pages you get, and rotation is written into the file
            rather than only into the preview.
          </p>
          <p className="mt-2">
            Your file is not uploaded. That is not a policy we could quietly change, because there
            is no server here that receives documents.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            We cannot promise a smaller file. Compression works by re-encoding the images
            inside a document, so a file that is mostly text has almost nothing to give up
            and will come back close to the size it went in at. The tool shows the real
            before and after figures rather than a hopeful estimate, and says when it could
            not help.
          </p>
          <p className="mt-2">
            We also cannot promise every file will open. A PDF that needs a password, or one
            written by software that bends the format, may be refused. When that happens the
            tool says so instead of producing a broken file.
          </p>
          <p className="mt-2">
            Very large files are limited by your device&apos;s memory rather than a
            server&apos;s. On an older phone, a very long document may not finish.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Refunds</h2>
          <p className="mt-2">
            While these tools are free there is nothing to refund. If paid jobs are switched
            on and one does not produce what the page said it would, ask and you will get
            your money back.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Liability</h2>
          <p className="mt-2">
            This is a small tool offered as is. Keep your original file until you have opened
            the result and checked it is what you wanted. We are not responsible for work
            lost by deleting an original before doing so.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your files</h2>
          <p className="mt-2">
            They stay yours. We never receive them, so we claim no rights over them. See the{" "}
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
