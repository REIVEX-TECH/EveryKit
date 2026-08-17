export const SITE_NAME = "EveryKit";
export const SITE_TAGLINE = "Small tools for everyday problems";
export const PARENT_NAME = "Reivex";
export const PARENT_URL = "https://reivex.io";
export const CONTACT_EMAIL = "hello@useeverykit.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://useeverykit.com"
).replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
