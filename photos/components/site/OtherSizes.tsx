import Link from "next/link";
import { specSizeLabel, specTitle, specs } from "@/data/specs";

/**
 * Links to every programmatic country page.
 *
 * These used to live in the footer. The shared EveryKit footer has a fixed
 * shape, so they moved here — which is better for them anyway: sixteen static
 * pages need real internal links to be found, and this is a navigation section
 * with a heading rather than a strip of footer text.
 */
export function OtherSizes({ currentSlug }: { currentSlug?: string }) {
  return (
    <nav className="mt-20 border-t border-line pt-12" aria-labelledby="other-sizes">
      <h2 id="other-sizes" className="text-[22px]">
        Other photo sizes
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {specs
          .filter((spec) => spec.slug !== currentSlug)
          .map((spec) => (
            <li key={spec.slug}>
              <Link
                href={`/photo/${spec.slug}`}
                className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
              >
                {specTitle(spec)} photo
                <span className="block text-text-light">{specSizeLabel(spec)}</span>
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
