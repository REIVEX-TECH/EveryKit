import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: ten small developer tools`,
    short_name: SITE_NAME,
    description:
      "JSON, base64, URL, UUID, hashes, JWT, regex, diff, timestamps and cron. All of it in your browser.",
    start_url: "/",
    // Standalone because people reach this from a phone and often come back to
    // it; on the home screen it should behave like the small tool it is.
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
