/**
 * Local draft persistence.
 *
 * The whole newsletter, images included, is written to localStorage so a
 * refresh does not lose an afternoon's work. It is per-browser and never leaves
 * the device, exactly like the images themselves. Every access is wrapped:
 * private mode refuses storage and a big draft can exceed the quota, and
 * neither should ever break the builder. A draft that cannot be saved is simply
 * not saved.
 */

import type { NewsletterDoc } from "./blocks";

const KEY = "ek_newsletter_draft_v1";

export function loadDraft(): NewsletterDoc | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsletterDoc;
    if (!parsed || !Array.isArray(parsed.blocks) || !Array.isArray(parsed.images)) return null;
    if (typeof parsed.name !== "string" || typeof parsed.pageBackground !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(doc: NewsletterDoc): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(doc));
  } catch {
    // Quota exceeded or storage blocked. The session keeps working; only the
    // saved copy is skipped.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
