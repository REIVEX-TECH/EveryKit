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
  // Deliberately no script-src. Naming one would mean also allowing
  // 'wasm-unsafe-eval', because Chrome refuses to compile WebAssembly under a
  // script-src that omits it — and WebAssembly is how the whole tool works.
  // Without default-src, leaving the directive out keeps scripts unrestricted,
  // which is where this app already was. There is no user-supplied markup here
  // for a script-src to protect.
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
          // Nothing here needs a camera, a microphone or a location.
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
