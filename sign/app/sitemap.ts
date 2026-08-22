import type { MetadataRoute } from "next";
import { tools } from "@/data/tools";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // One build-time date across every entry, so a crawler sees a
  // consistent lastmod for the whole kit rather than a spread.
  const lastModified = new Date();
  return [
    ...tools.map((tool) => ({
      url: absoluteUrl(tool.href),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: tool.href === "/" ? 1 : 0.8,
    })),
    { url: absoluteUrl("/privacy"), lastModified,
      changeFrequency: "yearly" as const, priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified,
      changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
