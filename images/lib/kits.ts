/**
 * Reads the EveryKit registry the hub publishes at /kits.json.
 *
 * Every call site must treat this as decoration. The hub being down, CORS being
 * misconfigured, the user being offline, the JSON being malformed — all of it
 * resolves to an empty list, never an error and never a loading state the user
 * can see. A kit that breaks because the hub is unreachable would defeat the
 * point of keeping the kits independent.
 */

import { HUB_URL } from "./site";

export type KitStatus = "live" | "soon";

export type Kit = {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  status: KitStatus;
};

/** Cached for the session, per the shared convention. */
let cache: Promise<Kit[]> | null = null;

const TIMEOUT_MS = 4000;

function isKit(value: unknown): value is Kit {
  if (typeof value !== "object" || value === null) return false;
  const kit = value as Record<string, unknown>;
  return (
    typeof kit.slug === "string" &&
    typeof kit.name === "string" &&
    typeof kit.tagline === "string" &&
    typeof kit.url === "string" &&
    (kit.status === "live" || kit.status === "soon")
  );
}

async function load(): Promise<Kit[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(`${HUB_URL}/kits.json`, {
      signal: controller.signal,
      // The registry is small and cacheable; no credentials ever go with it.
      credentials: "omit",
    });
    clearTimeout(timer);
    if (!response.ok) return [];

    const data: unknown = await response.json();
    const kits = (data as { kits?: unknown })?.kits;
    if (!Array.isArray(kits)) return [];
    return kits.filter(isKit);
  } catch {
    return [];
  }
}

export function fetchKits(): Promise<Kit[]> {
  cache ??= load();
  return cache;
}
