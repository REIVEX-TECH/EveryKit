import { absoluteUrl } from "@/lib/site";

/**
 * The hub's own pages.
 *
 * Split out of /sitemap.xml when that became an index: an index may only list
 * sitemaps, so the hub's four URLs needed a file of their own to be listed in.
 */

export const dynamic = "force-static";

type Entry = { path: string; changeFrequency: string; priority: string };

const PAGES: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: "1.0" },
  { path: "/about", changeFrequency: "yearly", priority: "0.5" },
  { path: "/privacy", changeFrequency: "yearly", priority: "0.3" },
  { path: "/terms", changeFrequency: "yearly", priority: "0.3" },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  // Build-time date, so the hub's own pages carry a consistent lastmod.
  const lastmod = new Date().toISOString().slice(0, 10);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...PAGES.map((page) =>
      [
        "  <url>",
        `    <loc>${escapeXml(absoluteUrl(page.path))}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${page.changeFrequency}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        "  </url>",
      ].join("\n"),
    ),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
