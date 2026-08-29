export const SITE_NAME = "EveryKit ID Photos";
export const KIT_NAME = "ID Photos";
export const KIT_SLUG = "photos";
export const SITE_TAGLINE = "Passport and visa photos, made on your phone";
export const PARENT_NAME = "Reivex";
export const PARENT_URL = "https://reivex.io";

function origin(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/\/$/, "");
}

/** This kit's own subdomain. Every canonical, OG tag and sitemap entry uses it. */
export const SITE_URL = origin(
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://photos.useeverykit.com",
);

/** The hub. Header, footer and the kits registry all point here. */
export const HUB_URL = origin(process.env.NEXT_PUBLIC_HUB_URL, "https://useeverykit.com");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hubUrl(path = "/"): string {
  return `${HUB_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * A sibling kit on the same platform, e.g. background.useeverykit.com. Derived
 * from the hub host, since every kit lives at {slug}.{hub host} by convention,
 * so this stays correct across environments without a second source of truth.
 */
export function kitUrl(slug: string, path = "/"): string {
  const scheme = HUB_URL.startsWith("http://") ? "http" : "https";
  const host = HUB_URL.replace(/^https?:\/\//, "");
  return `${scheme}://${slug}.${host}${path.startsWith("/") ? path : `/${path}`}`;
}

/** "useeverykit.com" — shown as the visible text of the "All kits" link. */
export const HUB_HOSTNAME = HUB_URL.replace(/^https?:\/\//, "");
