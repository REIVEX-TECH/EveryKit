import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: ${SITE_TAGLINE.toLowerCase()}`, template: `%s | ${SITE_NAME}` },
  description:
    "Fill in a form and download a clean PDF invoice, with the maths done in decimal-safe arithmetic. Everything happens in your browser and nothing is uploaded.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, url: SITE_URL },
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
    <html lang="en" className={plexSans.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-white"
        >
          Skip to the letters
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <PageViews />
      </body>
    </html>
  );
}
