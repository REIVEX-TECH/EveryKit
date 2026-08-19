import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="ek-shell max-w-[720px] py-20">
      <h1 className="text-[32px]">That page isn&apos;t here</h1>
      <p className="mt-3 text-[17px] text-text-light">
        The link may be out of date. This kit has one page, and it is the tool.
      </p>

      <Link href="/" className="ek-btn ek-btn-accent mt-8 no-underline">
        Go to the ringtone maker
      </Link>
    </div>
  );
}
