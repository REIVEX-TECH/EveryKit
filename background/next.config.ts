import type { NextConfig } from "next";

/**
 * Hosts this app is allowed to talk to.
 *
 * This list is the privacy claim, enforced rather than asserted. The remover
 * fetches its model weights from a CDN, and that host is all it is permitted to
 * reach. The photo itself is never in a request: inference runs locally, so
 * what crosses the network is model weights coming in, never image bytes going
 * out. Anything new that needs the network belongs on this list.
 *
 * The hub is on the list because the "More from EveryKit" strip reads its
 * /kits.json. That fetch is designed to fail silently, so leaving the hub out
 * would not throw an error anywhere: the strip would simply never appear, in
 * production only.
 */
const HUB_ORIGIN = (
  process.env.NEXT_PUBLIC_HUB_URL ?? "https://useeverykit.com"
).replace(/\/$/, "");

const CONNECT_SOURCES = [
  "'self'",
  "blob:",
  "data:",
  // Copied from Photos, which runs the same remover. staticimgly.com serves
  // the segmentation model and the ONNX runtime, and it is the only host this
  // kit needs: the image itself never leaves, only model weights come in.
  // Photos also lists the MediaPipe hosts for face detection; there is no face
  // detection here, so they are deliberately absent rather than copied along.
  "https://staticimgly.com",
  // The hub serves /kits.json for the cross-promotion strip and /api/subscribe
  // for the email ask. Both fail silently by design, so leaving this off the
  // list would break them without raising anything.
  HUB_ORIGIN,
  // Lemon Squeezy overlay checkout. Listed whether or not payments are
  // currently switched on, so that flipping NEXT_PUBLIC_PAYMENTS_ENABLED is a
  // one-variable change and cannot half-work.
  "https://assets.lemonsqueezy.com",
  "https://app.lemonsqueezy.com",
  "https://*.lemonsqueezy.com",
];

const CONTENT_SECURITY_POLICY = [
  `connect-src ${CONNECT_SOURCES.join(" ")}`,
  // Both WASM libraries run their inference in a worker created from a blob.
  "worker-src 'self' blob:",
  // The checkout overlay is an iframe served by Lemon Squeezy, and nothing
  // else in this app is framed.
  "frame-src https://*.lemonsqueezy.com",
  // script-src restricts scripts to this origin, which blocks one loaded from
  // another. 'unsafe-inline' stays because Next injects its hydration bootstrap
  // inline, and 'wasm-unsafe-eval' is required or Chrome refuses to compile the
  // WebAssembly this tool runs its model in. A nonce would tighten the inline
  // case but needs middleware; the origin restriction is the win taken here.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
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
