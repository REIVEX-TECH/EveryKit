export const SITE_NAME = "EveryKit Invoice";
export const KIT_NAME = "Invoice";
export const KIT_SLUG = "invoice";
export const SITE_TAGLINE = "A clean PDF invoice in two minutes";
export const PARENT_NAME = "Reivex";
export const PARENT_URL = "https://reivex.io";

function origin(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/\/$/, "");
}

/** This kit's own subdomain. Every canonical, OG tag and sitemap entry uses it. */
export const SITE_URL = origin(
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://invoice.useeverykit.com",
);

/** The hub: the kits registry and the email endpoint both live there. */
export const HUB_URL = origin(process.env.NEXT_PUBLIC_HUB_URL, "https://useeverykit.com");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hubUrl(path = "/"): string {
  return `${HUB_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const HUB_HOSTNAME = HUB_URL.replace(/^https?:\/\//, "");
