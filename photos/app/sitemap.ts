import type { MetadataRoute } from "next";
import { specs } from "@/data/specs";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...specs.map((spec) => ({
      url: absoluteUrl(`/photo/${spec.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
