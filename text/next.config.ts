import type { NextConfig } from "next";

/**
 * Hosts this app is allowed to talk to.
 *
 * For this kit the list is the product. The promise is that what someone types
 * into the page never leaves the device, and the way that promise is kept honest is
 * that there is no origin here a file could be sent to. Everything that does
 * the work is bundled and served from this origin, so nothing is fetched from a
 * CDN at runtime.
 *
 * The two outside origins are the hub (the cross-promotion strip reads its
 * /kits.json and the email ask posts to /api/subscribe) and the checkout.
 * Both are unrelated to file contents.
 */
const HUB_ORIGIN = (
  process.env.NEXT_PUBLIC_HUB_URL ?? "https://useeverykit.com"
).replace(/\/$/, "");

const CONNECT_SOURCES = [
  "'self'",
  // Files are read into blob and data URLs to be previewed and downloaded.
  "blob:",
  "data:",
  // Both of these fail silently by design, so omitting them would break them
  // in production without raising anything anywhere.
  HUB_ORIGIN,
  // Listed whether or not payments are currently switched on, so that flipping
  // NEXT_PUBLIC_PAYMENTS_ENABLED is a one-variable change and cannot half-work.
  "https://assets.lemonsqueezy.com",
  "https://app.lemonsqueezy.com",
  "https://*.lemonsqueezy.com",
];

const CONTENT_SECURITY_POLICY = [
  `connect-src ${CONNECT_SOURCES.join(" ")}`,
  "worker-src 'self' blob:",
  // The checkout overlay is an iframe served by Lemon Squeezy, and nothing
  // else in this app is framed.
  "frame-src https://*.lemonsqueezy.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
