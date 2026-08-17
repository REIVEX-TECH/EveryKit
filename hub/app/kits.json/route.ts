import { registryPayload } from "@/data/kits";

/**
 * The registry every kit reads.
 *
 * Prerendered at build time — it is derived from a typed file, so there is
 * nothing to compute per request. Kits fetch it from their own subdomains, so
 * it has to be readable cross-origin; the header is set here and repeated in
 * next.config.ts so it survives being served as a static asset.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(registryPayload(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
