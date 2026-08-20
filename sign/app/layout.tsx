import type { Metadata, Viewport } from "next";
import {
  Caveat,
  Dancing_Script,
  Great_Vibes,
  Homemade_Apple,
  IBM_Plex_Sans,
} from "next/font/google";
import { PageViews } from "@/components/site/PageViews";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-plex-sans",
});

/*
 * Four handwriting faces for typed signatures. All four are under the SIL Open
 * Font License, which permits embedding, which matters because the SVG export
 * inlines the font bytes into the file rather than naming a family the
 * recipient probably does not have.
 *
 * next/font self-hosts them, so a visit here tells Google nothing and the CSP
 * needs no extra host.
 */
const caveat = Caveat({ subsets: ["latin"], weight: "600", display: "swap", variable: "--font-caveat" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: "600", display: "swap", variable: "--font-dancing" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-great-vibes" });
const homemade = Homemade_Apple({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-homemade" });

const HANDWRITING = [caveat, dancing, greatVibes, homemade].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Merge, split, reorder and shrink PDFs in your browser. The file is opened on your own device and is never uploaded.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${HANDWRITING}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-white"
        >
          Skip to the tools
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <PageViews />
      </body>
    </html>
  );
}
