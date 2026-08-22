import type { NextConfig } from "next";

/**
 * Hosts this app is allowed to talk to.
 *
 * This list is the privacy claim, enforced rather than asserted. The two
 * WASM libraries fetch model weights from CDNs, and that is all they are
 * permitted to reach — in particular, MediaPipe's bundle posts usage telemetry
 * to odml.pa.googleapis.com with no option to switch it off, and leaving that
 * out of this list is what actually stops it. The logger handles the failure
 * and carries on detecting faces.
 *
 * Vercel Analytics posts to /_vercel/insights on this origin, so 'self' covers it.
 *
 * The hub is on the list because the "More from EveryKit" strip reads its
 * /kits.json. That fetch is designed to fail silently, so leaving the hub out
 * would not throw an error anywhere — the strip would simply never appear, in
 * production only. Anything new that needs the network belongs here.
 */
const HUB_ORIGIN = (
  process.env.NEXT_PUBLIC_HUB_URL ?? "https://useeverykit.com"
).replace(/\/$/, "");

const CONNECT_SOURCES = [
  "'self'",
  "blob:",
  "data:",
  "https://cdn.jsdelivr.net", // MediaPipe WASM runtime
  "https://storage.googleapis.com", // face detection model
  "https://staticimgly.com", // background removal model and ONNX runtime
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
