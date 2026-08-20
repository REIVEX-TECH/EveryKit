import {
  FAILURE_DELAY_MS,
  adminConfig,
  checkCredentials,
  cooldownRemainingMs,
  noteFailure,
  noteSuccess,
  sleep,
} from "@/lib/admin/auth";
import { createSession, sessionCookie } from "@/lib/admin/session";

/**
 * The login.
 *
 * A plain form post, so the page needs no JavaScript at all. Success sets the
 * session cookie and redirects to the dashboard; failure redirects back to the
 * form with `?error=1` and nothing else. One message covers a wrong address, a
 * wrong password, both, and an unconfigured server, because telling somebody
 * which half they got right is telling them the address.
 *
 * Every failure costs a second, and after ten from process start a wrong answer
 * also starts a thirty second cooldown. Neither is what keeps anybody out: the
 * password is a bcrypt hash. They are there so that a script grinding away is
 * grinding slowly.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect(to: string, cookie?: string): Response {
  const headers = new Headers({
    Location: to,
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  });
  if (cookie) headers.append("Set-Cookie", cookie);
  // 303, so the browser follows with GET rather than repeating the POST.
  return new Response(null, { status: 303, headers });
}

export async function POST(request: Request): Promise<Response> {
  const config = adminConfig();

  const cooling = cooldownRemainingMs();
  if (cooling > 0) {
    return redirect(`/admin/login?error=1&wait=${Math.ceil(cooling / 1000)}`);
  }

  let email = "";
  let password = "";
  try {
    const form = await request.formData();
    email = String(form.get("email") ?? "");
    password = String(form.get("password") ?? "");
  } catch {
    // A body we cannot read is a failed attempt like any other.
  }

  // The config check happens after the body is read and before the delay, so a
  // box with no ADMIN_EMAIL set answers exactly as slowly as a wrong password.
  const passed = config ? await checkCredentials(email, password, config) : false;

  if (!passed || !config) {
    noteFailure();
    await sleep(FAILURE_DELAY_MS);
    return redirect("/admin/login?error=1");
  }

  noteSuccess();
  const token = await createSession(config.email, config.sessionSecret);
  return redirect("/admin", sessionCookie(token));
}
