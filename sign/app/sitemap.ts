import type { MetadataRoute } from "next";
import { tools } from "@/data/tools";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...tools.map((tool) => ({
      url: absoluteUrl(tool.href),
      changeFrequency: "monthly" as const,
      priority: tool.href === "/" ? 1 : 0.8,
    })),
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
