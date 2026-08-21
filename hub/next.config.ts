import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Repeated from the route handler: a force-static route is served as a
        // plain asset, and the kits would silently fail to read it without
        // these. Their fetch is designed to fail quietly, so a missing CORS
        // header would show up as a missing strip rather than an error.
        source: "/kits.json",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
        ],
      },
      // Everything under the dashboard, out of every index. Two entries rather
      // than one pattern because /admin itself has no trailing segment to match.
      ...["/admin", "/admin/:path*", "/api/admin/:path*"].map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      })),
      // Referrer-Policy, X-Content-Type-Options, Permissions-Policy,
      // X-Frame-Options and HSTS are set by nginx for every EveryKit host, from
      // deploy/nginx/snippets/everykit-headers.conf. They are the same on all
      // fourteen, so they belong in one place, and a header set in two places is
      // a header that will disagree with itself eventually. The hub has no
      // Content-Security-Policy of its own; X-Frame-Options is what covers it.
    ];
  },
};

export default nextConfig;
