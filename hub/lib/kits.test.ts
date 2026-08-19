import { describe, expect, it } from "vitest";
import { kits, registryPayload } from "@/data/kits";

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
    // Every category the directory can render. A kit filed under a name that is
    // not here would be dropped from the page silently, which is why the list is
    // asserted rather than the field merely being a string. Adding a shelf means
    // adding it here and to the directory in the same commit.
    const shelves = ["photos", "documents", "everyday"];
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
