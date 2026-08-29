import { recordPageview } from "@/lib/db";
import { MAX_BODY_BYTES, normaliseKit, normalisePath } from "@/lib/pageviews";
import { normalizeHitPath } from "./known-paths";
import { readJsonObject } from "@/lib/http";
import { isAllowedOrigin } from "@/lib/subscribe";

/**
 * The hub counts its own pages through this endpoint too, so a request from
 * the very origin serving it is allowed whatever the allowlist says.
 *
 * Without this the hub could only count itself on the exact production domain:
 * a staging host, a preview, or a local production build got a 403 for its own
 * page view and a console error to go with it. The allowlist exists to say
 * which *other* origins may write here, and same origin is not one of those.
 */
function isSameOrigin(request: Request, origin: string | null): boolean {
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/**
 * The page counter.
 *
 * What is stored: a day, a kit, a path, and how many times. What is not stored,
 * and cannot be, because nothing in this handler reads it and there is no
 * column for it: the caller's IP address, their user agent, their referrer,
 * their language, a cookie, a session, or any identifier we could have minted
 * ourselves. Two people and one person twice produce the same row.
 *
 * That is what makes this honest to say on the privacy page. It is not a
 * promise about a vendor's settings, it is a table with four columns.
 *
 * The answer is always {ok:true}, whatever happened. The caller is a page that
 * has already rendered; there is nothing useful it could do with a failure, and
 * an error body would only tempt somebody into writing a retry. A database
 * that is down costs a count and nothing else.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";

function corsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin, isProduction)) return {};
  return {
    "Access-Control-Allow-Origin": origin as string,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function ok(origin: string | null, status = 200): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin),
    },
  });
}

export async function OPTIONS(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin, isProduction) && !isSameOrigin(request, origin)) {
    // No CORS headers back, so the browser blocks the POST that would follow.
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");

  // Same allowlist as /api/subscribe: the apex or any single-label subdomain of
  // it. A missing Origin is tolerated because same-origin callers omit it on
  // some clients, and it earns no CORS headers back.
  if (origin && !isAllowedOrigin(origin, isProduction) && !isSameOrigin(request, origin)) {
    return new Response(null, { status: 403 });
  }

  // Content type, then length, then bytes, then parse, and nothing is parsed
  // until it is known to be small enough to be worth parsing. Every rejection
  // still answers ok:true, because the caller is a page that has already
  // rendered and there is nothing useful it could do with a failure.
  const read = await readJsonObject(request, MAX_BODY_BYTES);
  if (!read.ok) return ok(origin);
  const body = read.body;

  const kit = normaliseKit(body.kit);
  const path = normalisePath(body.path);
  // A hit we cannot place is dropped rather than filed somewhere plausible. A
  // count nobody can trust is worse than a count that is missing.
  if (!kit || !path) return ok(origin);

  // Bot probes and 404s are bucketed to /_event/not-found so they stop inflating
  // real view counts (that path is excluded from the dashboard's view figures).
  const countedPath = normalizeHitPath(kit, path);

  try {
    await recordPageview(kit, countedPath);
  } catch (error) {
    console.error("hit: could not count a page view", error);
  }

  return ok(origin);
}
