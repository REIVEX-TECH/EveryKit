import Link from "next/link";
import { specs, specSizeLabel, specTitle } from "@/data/specs";

export const metadata = { title: "Page not found" };

/**
 * A wrong /photo/[country] slug is the likely way to land here, so the useful
 * thing to show is the list of sizes that do exist.
 */
export default function NotFound() {
  return (
    <div className="ek-shell max-w-[720px] py-20">
      <h1 className="text-[32px]">That page isn&apos;t here</h1>
      <p className="mt-3 text-[17px] text-text-light">
        The link may be out of date, or that photo size may not be one this tool
        covers yet.
      </p>

      <Link href="/" className="ek-btn ek-btn-accent mt-8 no-underline">
        Make a photo
      </Link>

      <h2 className="mt-12 text-[18px]">Sizes this tool covers</h2>
      <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
        {specs.map((spec) => (
          <li key={spec.slug}>
            <Link
              href={`/photo/${spec.slug}`}
              className="text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
            >
              {specTitle(spec)}
              <span className="text-text-light"> — {specSizeLabel(spec)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
