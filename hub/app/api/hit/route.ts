import { recordPageview } from "@/lib/db";
import { MAX_BODY_BYTES, normaliseKit, normalisePath } from "@/lib/pageviews";
import { isAllowedOrigin } from "@/lib/subscribe";

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
  if (!isAllowedOrigin(origin, isProduction)) {
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
  if (origin && !isAllowedOrigin(origin, isProduction)) {
    return new Response(null, { status: 403 });
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return ok(origin);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return ok(origin);
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return ok(origin);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return ok(origin);
  }

  const kit = normaliseKit(body.kit);
  const path = normalisePath(body.path);
  // A hit we cannot place is dropped rather than filed somewhere plausible. A
  // count nobody can trust is worse than a count that is missing.
  if (!kit || !path) return ok(origin);

  try {
    await recordPageview(kit, path);
  } catch (error) {
    console.error("hit: could not count a page view", error);
  }

  return ok(origin);
}
