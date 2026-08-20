import { clearedSessionCookie } from "@/lib/admin/session";

/**
 * Log out.
 *
 * The cookie is the session, so clearing it is the whole of it. There is
 * nothing server-side to revoke, which also means a cookie copied elsewhere
 * stays valid until it expires: with one admin and a seven day life that is the
 * trade, and a session table would be the price of changing it.
 *
 * POST only, so that a link somebody follows cannot log them out.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const headers = new Headers({
    Location: new URL("/admin/login", request.url).toString(),
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  });
  headers.append("Set-Cookie", clearedSessionCookie());
  return new Response(null, { status: 303, headers });
}
