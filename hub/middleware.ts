import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/admin/session";

/**
 * The guard on /admin and /api/admin.
 *
 * It does one thing: no valid signed cookie, no page. Everything behind it can
 * then be written as though the visitor is the admin, because nothing else
 * reaches it.
 *
 * Only the two login routes are open, and they have to be: a login page you
 * cannot see without being logged in is a locked room with the key inside.
 *
 * This runs on the edge runtime, so it verifies the signature with Web Crypto
 * and never touches bcrypt or the database. Checking the password is the login
 * route's job, once.
 */

const OPEN_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  const email = await readSession(request.cookies.get(SESSION_COOKIE)?.value, secret);

  if (OPEN_PATHS.has(pathname)) {
    // Already logged in, so the login form has nothing to offer.
    if (email && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (email) return NextResponse.next();

  // An API route gets a status code; a page gets sent to the form. Redirecting
  // an API call to an HTML page would hand the caller a 200 and a login page,
  // which reads as success to anything that is not a browser.
  if (pathname.startsWith("/api/admin")) {
    return new NextResponse(JSON.stringify({ ok: false }), {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
