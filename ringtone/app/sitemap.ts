import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/convert"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/volume"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
