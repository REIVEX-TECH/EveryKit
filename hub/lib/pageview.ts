"use client";

/**
 * Counting a page view.
 *
 * One POST per page shown, carrying two strings: which kit, which path. It is
 * fire and forget, capped at two seconds, and every failure is swallowed. A
 * count is worth nothing next to the page working, so a hub that is down, an
 * ad blocker, or a network that is not there must all cost exactly one number.
 *
 * What is deliberately absent, here and at the other end: any identifier. No
 * cookie is read or set, no id is minted, nothing is kept in storage between
 * page views, and `credentials: "omit"` means not even a cookie that existed
 * would be sent. The server writes a day, a kit, a path and a count, so two
 * people and one person twice are indistinguishable by construction.
 */

/** Past this the request is abandoned. Nothing is retried. */
const TIMEOUT_MS = 2000;

export function countPageview(path: string): void {
  if (typeof window === "undefined") return;
  // The dashboard is not part of the site's traffic and is never counted.
  if (path.startsWith("/admin")) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Same origin here, so the endpoint is relative and no CORS is involved.
  void fetch("/api/hit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kit: "hub", path }),
    signal: controller.signal,
    credentials: "omit",
    keepalive: true,
  })
    .catch(() => {
      // Silent on purpose. There is nothing a page that has already rendered
      // could usefully do about a count that did not land.
    })
    .finally(() => clearTimeout(timer));
}
