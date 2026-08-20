import type { MetadataRoute } from "next";
import { tools } from "@/data/tools";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...tools.map((tool) => ({
      url: absoluteUrl(`/${tool.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
