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

import { HUB_URL, KIT_SLUG } from "./site";

/** Past this the request is abandoned. Nothing is retried. */
const TIMEOUT_MS = 2000;

/**
 * The two funnel events, counted through the very same aggregate hit as a page
 * view and the email choices: a kit, a path, nothing about the person. Together
 * with the email-submit and email-skip events they let the dashboard show a real
 * funnel, opened to completed to email, without storing anything per person. The
 * `_event` prefix keeps them filterable from ordinary page views.
 */
export const TOOL_OPENED_EVENT = "/_event/tool-opened";
export const TOOL_COMPLETED_EVENT = "/_event/tool-completed";

/**
 * "Opened" is once per tool path, not once per action on the page: several take
 * buttons can mount on one tool, and the funnel wants one open per view. The set
 * dedupes within a page-load session, and a different tool path counts again.
 */
const openedPaths = new Set<string>();

export function countToolOpened(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (openedPaths.has(path)) return;
  openedPaths.add(path);
  countPageview(TOOL_OPENED_EVENT);
}

/** A result was actually taken: a copy, a download, a saved file. */
export function countToolCompleted(): void {
  countPageview(TOOL_COMPLETED_EVENT);
}

export function countPageview(path: string): void {
  if (typeof window === "undefined") return;
  // The dashboard is not part of the site's traffic and is never counted.
  if (path.startsWith("/admin")) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  void fetch(`${HUB_URL}/api/hit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kit: KIT_SLUG, path }),
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
