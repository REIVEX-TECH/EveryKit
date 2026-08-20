import type { Metadata } from "next";

/**
 * Everything under /admin is kept out of the world's way.
 *
 * noindex here, `X-Robots-Tag` on the responses in next.config.ts, and a
 * Disallow in robots.txt. Three belts rather than one because they fail
 * differently: the meta tag needs the page fetched and parsed, the header does
 * not, and robots.txt asks politely before either.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
