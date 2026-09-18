import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: drag and drop email newsletters, no code`,
    short_name: SITE_NAME,
    description:
      "Build an HTML email newsletter by dragging blocks onto a canvas, then export email-safe HTML and its images. Nothing is uploaded.",
    start_url: "/",
    // Standalone because people reach this from a phone and often come back to
    // it; on the home screen it should behave like the small tool it is.
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
