import Link from "next/link";
import { kits } from "@/data/kits";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  const live = kits.filter((kit) => kit.status === "live");

  return (
    <div className="ek-shell max-w-[640px] py-20">
      <h1 className="text-[32px]">That page isn&apos;t here</h1>
      <p className="mt-3 text-[17px] text-text-light">
        The link may be out of date, or the address may have a typo in it.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="ek-btn ek-btn-primary no-underline">
          See all the kits
        </Link>
        {live.map((kit) => (
          <a key={kit.slug} href={kit.url} className="ek-btn ek-btn-quiet no-underline">
            {kit.name}
          </a>
        ))}
      </div>
    </div>
  );
}
