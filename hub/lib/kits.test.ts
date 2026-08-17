import { describe, expect, it } from "vitest";
import { kits, registryPayload } from "@/data/kits";

/**
 * The registry is a contract: every kit reads it at runtime and a malformed
 * entry would break the strip on someone else's subdomain, where it fails
 * silently and nobody would notice.
 */
describe("kits registry", () => {
  it("publishes exactly the agreed fields, and no internal ones", () => {
    for (const kit of registryPayload().kits) {
      expect(Object.keys(kit).sort()).toEqual(["name", "slug", "status", "tagline", "url"]);
    }
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
