import type { Metadata } from "next";
import Link from "next/link";
import { ExamplePair } from "@/components/site/ExamplePair";
import { OtherSizes } from "@/components/site/OtherSizes";
import { PhotoTool } from "@/components/tool/PhotoTool";
import { DEFAULT_SPEC_SLUG, getSpecOrDefault } from "@/data/specs";
import { PARENT_NAME, PARENT_URL, SITE_NAME, absoluteUrl, hubUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `Passport and visa photos from a selfie — free preview | ${SITE_NAME}`,
  description:
    "Crop a phone selfie to the exact passport or visa photo size your application asks for. Runs in your browser, so the photo is never uploaded. Free preview, print sheet included.",
  alternates: { canonical: absoluteUrl("/") },
  openGraph: { url: absoluteUrl("/") },
};

const applicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Crops a photo to passport and visa photo specifications in the browser, without uploading the image.",
  publisher: {
    "@type": "Organization",
    name: "EveryKit by Reivex",
    url: hubUrl("/"),
    parentOrganization: { "@type": "Organization", name: PARENT_NAME, url: PARENT_URL },
  },
  featureList: [
    "Automatic face detection and cropping",
    "16 country and document sizes",
    "Background replacement",
    "4 x 6 inch print sheet",
  ],
};

export default function HomePage() {
  const defaultSpec = getSpecOrDefault(DEFAULT_SPEC_SLUG);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />

      <div className="ek-shell py-12 sm:py-16">
        <PhotoTool
          heading="Passport and visa photos, made on your phone"
          intro={
            <>
              <p className="mt-4 text-[17px] text-text-light">
                Upload a selfie and get the exact file your application asks for
                — 600 x 600 px, exactly 2 x 2 inches at 300 DPI for a US
                passport, and fifteen other sizes.
              </p>
              <p className="mt-3 text-[15px] text-text-light">
                The cropping happens in this browser tab. Your photo never leaves
                your phone.
              </p>
            </>
          }
          example={<ExamplePair spec={defaultSpec} />}
        />

        <section className="mt-20 border-t border-line pt-12">
          <h2 className="text-[22px]">How it works</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            <Explainer
              title="It finds your face"
              body="A face detection model runs on your device and works out where your chin and the top of your head are."
            />
            <Explainer
              title="It crops to the spec"
              body="The crop is sized so your head measures what the published requirement asks for, then you can nudge it."
            />
            <Explainer
              title="You get real files"
              body="The download carries the right pixel size and the right DPI, so it opens at its true physical size."
            />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[22px]">What this does not do</h2>
          <ul className="mt-4 max-w-[640px] space-y-2 text-[15px] text-text-light">
            <li>
              It cannot promise your photo will be accepted. It gets the size,
              head height and resolution right. The rest — your expression,
              glasses, how recent the photo is — is on you, and the checklist
              says so.
            </li>
            <li>
              It cannot fix a photo taken at a bad angle or in poor light. A
              plain wall and a window are all you need.
            </li>
            <li>
              It does not store your photo. Close the tab and the image is gone.
              We do ask for your email before a download, which you can skip —
              the{" "}
              <Link href="/privacy" className="ek-link">
                privacy page
              </Link>{" "}
              says what happens to it.
            </li>
          </ul>
        </section>

        <OtherSizes />
      </div>
    </>
  );
}

function Explainer({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-[16px]">{title}</h3>
      <p className="mt-2 text-[14px] text-text-light">{body}</p>
    </div>
  );
}
