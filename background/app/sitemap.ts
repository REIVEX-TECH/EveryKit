import type { MetadataRoute } from "next";
import { modePages } from "@/data/modes";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...modePages.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
