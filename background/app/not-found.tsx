import Link from "next/link";
import { modePages } from "@/data/modes";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="ek-shell max-w-[720px] py-20">
      <h1 className="text-[32px]">That page isn&apos;t here</h1>
      <p className="mt-3 text-[17px] text-text-light">The link may be out of date.</p>

      <Link href="/" className="ek-btn ek-btn-accent mt-8 no-underline">
        Remove a background
      </Link>

      <h2 className="mt-12 text-[18px]">What this kit does</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {modePages.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/${page.slug}`}
              className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
            >
              {page.title}
              <span className="text-text-light">, {page.blurb.toLowerCase()}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
