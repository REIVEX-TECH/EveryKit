import type { Metadata } from "next";
import Link from "next/link";
import { ToolGrid } from "@/components/teach/ToolGrid";
import { tools } from "@/data/tools";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}, classroom tools that save teachers time` },
  description:
    "Classroom tools that run in your browser: a rubric maker, a weighted gradebook, worksheets, grade curving, a random picker, group and seating charts, attendance sheets, certificates, a teaching timetable and a classroom timer. Nothing is uploaded.",
  alternates: { canonical: absoluteUrl("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  description: "Browser-based tools for teachers, across grading, class management, and motivation and time. Nothing is stored.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />


      <div className="ek-shell py-10 sm:py-14">
        <div className="text-center">
          <h1 className="mx-auto max-w-[340px] text-[32px] leading-[1.15] sm:max-w-[460px] sm:text-[40px]">
            Classroom tools that save teachers time
          </h1>
          <p className="mx-auto mt-4 max-w-[54ch] text-[17px] text-text-light">
            Filter by what you need and get on with it. Each tool runs in this page, so your
            students&apos; names and marks stay on your own device.
          </p>
        </div>

        <div className="mt-10">
          <ToolGrid />
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[15px] text-text-light">
          <Tick />
          No account, nothing stored, nothing uploaded.
        </p>

        <section className="mt-16">
          <h2 className="text-[18px]">Every tool</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/${tool.slug}`}
                  className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
                >
                  {tool.title}
                  <span className="text-text-light">, {tool.blurb.toLowerCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** The success token as a mark, where its contrast is fine. */
function Tick() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
