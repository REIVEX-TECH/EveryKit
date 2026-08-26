import { describe, expect, it } from "vitest";
import { CATEGORIES, flagshipLinks, flagships, kitTools, kits, registryPayload } from "@/data/kits";

/**
 * The registry is a contract: every kit reads it at runtime and a malformed
 * entry would break the strip on someone else's subdomain, where it fails
 * silently and nobody would notice.
 */
describe("kits registry", () => {
  it("still publishes the five original fields, unchanged", () => {
    // Backward compatibility is the whole contract here: the kits' cross-promo
    // strips parse this file and validate these names. New fields may be added
    // beside them; these five may never be renamed or reshaped.
    for (const kit of registryPayload().kits) {
      expect(typeof kit.slug).toBe("string");
      expect(typeof kit.name).toBe("string");
      expect(typeof kit.tagline).toBe("string");
      expect(typeof kit.url).toBe("string");
      expect(["live", "soon"]).toContain(kit.status);
    }
  });

  it("adds category and icon without removing anything", () => {
    // Every kit's category must be one the directory can render. A kit filed
    // under a shelf that is not in CATEGORIES would be dropped from the page
    // silently, so the category is checked against that list rather than merely
    // being a string. Deriving the shelves from CATEGORIES here means adding a
    // shelf is a one-place change and this test cannot go stale behind it.
    const shelves = CATEGORIES.map((c) => c.id).filter((id) => id !== "all");
    for (const kit of registryPayload().kits) {
      expect(shelves).toContain(kit.category);
      expect(kit.icon.startsWith("/icons/")).toBe(true);
    }
  });

  it("survives a consumer that only knows the original fields", () => {
    // Exactly what lib/kits.ts in each kit does: pick the five it knows and
    // ignore the rest. Extra keys must not make an entry fail validation.
    const isKnownShape = (value: unknown) => {
      const k = value as Record<string, unknown>;
      return (
        typeof k.slug === "string" &&
        typeof k.name === "string" &&
        typeof k.tagline === "string" &&
        typeof k.url === "string" &&
        (k.status === "live" || k.status === "soon")
      );
    };
    const parsed = JSON.parse(JSON.stringify(registryPayload()));
    expect(parsed.kits.every(isKnownShape)).toBe(true);
    expect(parsed.kits.length).toBe(kits.length);
  });

  it("uses unique slugs", () => {
    expect(new Set(kits.map((k) => k.slug)).size).toBe(kits.length);
  });

  it("gives every kit an https url on the everykit domain", () => {
    for (const kit of kits) {
      const url = new URL(kit.url);
      expect(url.protocol).toBe("https:");
      expect(url.hostname.endsWith("useeverykit.com")).toBe(true);
      // The subdomain has to match the slug, or a kit filtering itself out of
      // the strip by slug would show itself.
      expect(url.hostname.split(".")[0]).toBe(kit.slug);
    }
  });

  it("only uses statuses the kits know how to render", () => {
    for (const kit of kits) {
      expect(["live", "soon"]).toContain(kit.status);
    }
  });

  it("serialises to valid JSON", () => {
    const parsed = JSON.parse(JSON.stringify(registryPayload()));
    expect(Array.isArray(parsed.kits)).toBe(true);
    expect(parsed.kits.length).toBe(kits.length);
  });

  it("keeps Photos live, since the hub links to it as a working tool", () => {
    expect(kits.find((k) => k.slug === "photos")?.status).toBe("live");
  });
});

describe("flagship row", () => {
  it("points every tile at a live kit and a real tool path", () => {
    // A flagship that 404s is worse than no flagship: it is the first thing on
    // the page. Each one must name a live kit, and any non-home path must be a
    // real tool in that kit's registry.
    for (const f of flagships) {
      const kit = kits.find((k) => k.slug === f.kitSlug);
      expect(kit, `flagship kit ${f.kitSlug}`).toBeDefined();
      expect(kit?.status).toBe("live");
      if (f.path !== "/") {
        const paths = (kitTools[f.kitSlug] ?? []).map((t) => t.path);
        expect(paths, `flagship path ${f.kitSlug}${f.path}`).toContain(f.path);
      }
    }
  });

  it("resolves each tile to an absolute https link on the kit's subdomain", () => {
    for (const link of flagshipLinks()) {
      const url = new URL(link.href);
      expect(url.protocol).toBe("https:");
      expect(url.hostname.split(".")[0]).toBe(link.kitSlug);
    }
  });

  it("gives every tile a one-line outcome with no dash punctuation", () => {
    for (const f of flagships) {
      expect(f.outcome.length).toBeGreaterThan(0);
      // The voice rule: no em dash, en dash, or spaced hyphen standing in for a
      // pause, anywhere a person can read it.
      expect(f.outcome).not.toMatch(/[–—]| - /);
    }
  });
});

describe("tool intents", () => {
  it("keeps intents lowercase so the command bar can match them raw", () => {
    // The search lowercases the query and compares against these directly, so a
    // stray capital would be a phrase that can never match.
    for (const tools of Object.values(kitTools)) {
      for (const tool of tools) {
        for (const intent of tool.intents ?? []) {
          expect(intent).toBe(intent.toLowerCase());
          expect(intent.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
