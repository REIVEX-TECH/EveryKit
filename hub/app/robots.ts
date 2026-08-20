import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin is one person's dashboard. It is behind a session either way, so
    // this is about keeping it out of search results rather than about access.
    // The X-Robots-Tag header in next.config.ts is the half that does not
    // depend on a crawler reading this file first.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
