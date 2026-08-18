import type { MetadataRoute } from "next";
import { letterTypes } from "@/data/letters";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...letterTypes.map((type) => ({
      url: absoluteUrl(`/letter/${type.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
