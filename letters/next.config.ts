import type { NextConfig } from "next";

/**
 * Hosts this app may talk to.
 *
 * Everything about a letter happens in the page, so this list is short. The
 * hub is on it for two reasons that both fail quietly if it is missing: the
 * "More from EveryKit" strip reads /kits.json, and the email ask posts to
 * /api/subscribe. Both swallow their own errors by design, so leaving the hub
 * off would not raise anything — the strip would just never appear and no
 * address would ever be recorded.
 */
const HUB_ORIGIN = (
  process.env.NEXT_PUBLIC_HUB_URL ?? "https://useeverykit.com"
).replace(/\/$/, "");

const CONNECT_SOURCES = [
  "'self'",
  "blob:",
  "data:",
  HUB_ORIGIN,
  // Lemon Squeezy overlay checkout. Listed whether or not payments are
  // currently on, so flipping the flag is a one-variable change.
  "https://assets.lemonsqueezy.com",
  "https://app.lemonsqueezy.com",
  "https://*.lemonsqueezy.com",
];

const CONTENT_SECURITY_POLICY = [
  `connect-src ${CONNECT_SOURCES.join(" ")}`,
  "frame-src https://*.lemonsqueezy.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ["lucide-react"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          // Referrer-Policy, X-Content-Type-Options, Permissions-Policy,
          // X-Frame-Options and HSTS are set by nginx for every EveryKit host,
          // from deploy/nginx/snippets/everykit-headers.conf. They are the same
          // on all fourteen, so they belong in one place, and a header set in
          // two places is a header that will disagree with itself eventually.
        ],
      },
    ];
  },
};

export default nextConfig;
