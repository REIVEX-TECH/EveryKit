import { kits } from "@/data/kits";

/**
 * Keeps bot probes and 404s out of the real view counts.
 *
 * This was written from a review that assumed the hub serves each kit at
 * `/<slug>` and that a per-kit path whitelist was safe. Checked against the repo,
 * neither holds:
 *  - Kits live on their own subdomains (photos.useeverykit.com), not on hub
 *    paths. The hub has no `/<slug>` routes.
 *  - Several kits serve dynamic routes this side cannot enumerate. The photos
 *    kit alone has `/photo/<25 country slugs>`, which exist in that kit's own
 *    data, not in this registry. Whitelisting kit paths from here would file real
 *    high-intent SEO traffic (exactly those photo pages) under not-found, which
 *    is the failure the review called critical. So this deliberately does NOT
 *    whitelist kit paths.
 *
 * What it does instead, safely:
 *  - Bucket obvious bot and exploit probes, on any subdomain, to
 *    `/_event/not-found`. No real page of ours takes these shapes, so there are
 *    no false positives.
 *  - For the hub itself, whose full route set IS known here, bucket any path that
 *    is not one of those routes (a 404) to `/_event/not-found`.
 * Everything else passes through unchanged, because from this side a real kit
 * page cannot be told apart from a made-up one.
 *
 * `/_event/not-found` is a reserved event path, so it is excluded from the
 * dashboard's view counts along with every other `/_event/` row: the junk stops
 * inflating traffic without being thrown away.
 */

/** Kit slugs straight from the registry, so this list can never drift. */
export const KIT_SLUGS: readonly string[] = kits.map((kit) => kit.slug);

/**
 * Every page route the hub itself serves. The hub is the only origin whose full
 * route set is known here, so it is the only one whose 404s can be bucketed.
 *
 * Only routes that actually fire the pageview beacon are listed: a real page with
 * the layout. Machine routes (`/sitemap.xml`, `/kits.json`, `/robots.txt`) are
 * fetched directly and never render the beacon, and `/admin` is dropped at the
 * source. `/from-lgu` is listed because its page ships in the same change.
 */
export const HUB_STATIC_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/from-lgu",
]);

export const NOT_FOUND_PATH = "/_event/not-found";

/**
 * A file extension no page of ours ends in: server-software and script probes.
 * The lookahead pins it to the end of the path segment so a real slug that merely
 * contains these letters (for example `/json-yaml`, `/sql-formatter`) is untouched.
 */
const JUNK_EXTENSION = /\.(?:php|phtml|aspx?|jsp|cgi|env|sql|bak|old|ini|sh|ya?ml|pl)(?:$|[/?#])/i;

/** A whole path segment used only by scanners fishing for other stacks. */
const JUNK_SEGMENT =
  /(?:^|\/)(?:wp-admin|wp-login|wp-content|wp-includes|xmlrpc|phpmyadmin|cgi-bin|vendor|\.git|\.env|\.aws|\.ssh)(?:\/|$)/i;

/**
 * The path that should actually be counted for a hit.
 *
 * `kit` has already been validated against the registry, and `path` already
 * normalised (leading slash, query and fragment stripped, length-capped) by the
 * caller. This only decides real page versus junk.
 */
export function normalizeHitPath(kit: string, path: string): string {
  // Our own events are intentional and pass straight through.
  if (path.startsWith("/_event/")) return path;
  // Bot and exploit probes, on any subdomain.
  if (JUNK_EXTENSION.test(path) || JUNK_SEGMENT.test(path)) return NOT_FOUND_PATH;
  // The hub's own 404s: its whole route set is known here.
  if (kit === "hub" && !HUB_STATIC_PATHS.has(path)) return NOT_FOUND_PATH;
  // A real kit page, or one this side cannot disprove. Counted as given.
  return path;
}
