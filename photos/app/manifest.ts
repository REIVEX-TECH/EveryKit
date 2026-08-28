import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: passport and visa photos`,
    short_name: SITE_NAME,
    description:
      "Crop a phone selfie to the exact passport or visa photo size your application asks for. Runs in your browser, so the photo is never uploaded.",
    start_url: "/",
    // Standalone because people reach this from a phone and often come back to
    // it; on the home screen it should behave like the small tool it is.
    display: "standalone",
    orientation: "portrait",
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
