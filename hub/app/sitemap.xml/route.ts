import { kits } from "@/data/kits";
import { absoluteUrl } from "@/lib/site";

/**
 * The sitemap index for the whole of EveryKit.
 *
 * Each kit lives on its own subdomain and owns its own sitemap, listing its own
 * pages. Subdomains do not inherit each other's authority, so nothing here
 * tries to list a kit's individual pages; this points a crawler at each kit's
 * sitemap and lets that kit answer for its own URLs.
 *
 * It is generated from the registry, so adding a kit to `data/kits.ts` adds it
 * here and nowhere else has to change.
 *
 * This is a route handler rather than Next's `sitemap.ts` convention because
 * that convention emits a `<urlset>`, and an index needs `<sitemapindex>`. The
 * hub's own pages moved to /sitemap-pages.xml, which this lists first.
 */

export const dynamic = "force-static";

/** Kits that are not live have nothing to crawl yet. */
function liveSitemaps(): string[] {
  return kits
    .filter((kit) => kit.status === "live")
    .map((kit) => `${kit.url.replace(/\/+$/, "")}/sitemap.xml`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  const sitemaps = [absoluteUrl("/sitemap-pages.xml"), ...liveSitemaps()];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map((url) => `  <sitemap>\n    <loc>${escapeXml(url)}</loc>\n  </sitemap>`),
    "</sitemapindex>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
