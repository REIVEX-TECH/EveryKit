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
