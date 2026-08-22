import type { MetadataRoute } from "next";
import { specs } from "@/data/specs";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // One build-time date across every entry, so a crawler sees a
  // consistent lastmod for the whole kit rather than a spread.
  const lastModified = new Date();
  return [
    { url: absoluteUrl("/"), lastModified,
      changeFrequency: "monthly", priority: 1 },
    ...specs.map((spec) => ({
      url: absoluteUrl(`/photo/${spec.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/privacy"), lastModified,
      changeFrequency: "yearly" as const, priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified,
      changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
