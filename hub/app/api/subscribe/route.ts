import { recordEmail } from "@/lib/db";
import {
  MAX_BODY_BYTES,
  isAllowedOrigin,
  isHoneypotFilled,
  normaliseEmail,
  normaliseKit,
} from "@/lib/subscribe";

/**
 * The only endpoint EveryKit has.
 *
 * It takes an email address from a kit and puts it in one table. Two rules
 * shape everything here:
 *
 * 1. The response never reveals whether an address was already known. A form
 *    that answers differently for a known address is an account-enumeration
 *    oracle, and there is no reason to build one.
 * 2. Kits fail open when this endpoint misbehaves, so a 500 here costs a lead
 *    and nothing else. That is the right trade and it is why there is no retry
 *    logic on either side.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isProduction = process.env.VERCEL_ENV === "production";

function corsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin, isProduction)) return {};
  return {
    // Echoing the matched origin rather than "*": this endpoint writes.
    "Access-Control-Allow-Origin": origin as string,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
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
    // No CORS headers, so the browser blocks the real request that follows.
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");

  // A cross-origin POST from a disallowed origin is refused outright. Same-origin
  // callers send no Origin header on some clients, which is why a missing origin
  // is tolerated here but earns no CORS headers back.
  if (origin && !isAllowedOrigin(origin, isProduction)) {
    return json({ ok: false }, 403, null);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false }, 415, origin);
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return json({ ok: false }, 413, origin);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false }, 400, origin);
  }
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false }, 413, origin);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return json({ ok: false }, 422, origin);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false }, 422, origin);
  }

  // Answer a bot exactly as we answer a person, and write nothing.
  if (isHoneypotFilled(body)) return json({ ok: true }, 200, origin);

  const email = normaliseEmail(body.email);
  if (!email) return json({ ok: false }, 422, origin);

  try {
    await recordEmail(email, normaliseKit(body.kit));
  } catch (error) {
    // Logged for us, invisible to the caller: the kit is about to fail open and
    // hand over the file regardless, and an error body would only tempt someone
    // to build retry logic that must not exist.
    console.error("subscribe: could not record email", error);
    return json({ ok: false }, 500, origin);
  }

  return json({ ok: true }, 200, origin);
}
