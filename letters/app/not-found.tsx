import Link from "next/link";
import { letterTypes } from "@/data/letters";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="ek-shell max-w-[720px] py-20">
      <h1 className="text-[32px]">That page isn&apos;t here</h1>
      <p className="mt-3 text-[17px] text-text-light">
        The link may be out of date, or that letter may not be one this tool
        writes yet.
      </p>

      <Link href="/" className="ek-btn ek-btn-accent mt-8 no-underline">
        See the letters
      </Link>

      <h2 className="mt-12 text-[18px]">Letters this tool writes</h2>
      <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
        {letterTypes.map((type) => (
          <li key={type.slug}>
            <Link
              href={`/letter/${type.slug}`}
              className="inline-block py-1.5 text-[15px] text-text-light no-underline hover:text-primary-dark hover:underline"
            >
              {type.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
