import { describe, expect, it } from "vitest";
import { normalizeHitPath, KIT_SLUGS, HUB_STATIC_PATHS, NOT_FOUND_PATH } from "./known-paths";
import { kits } from "@/data/kits";

/**
 * This function decides what counts as real traffic, so its two failure modes
 * are both tested: junk that must be caught, and real pages that must never be
 * mislabelled. The second is the one the review flagged as critical.
 */

describe("normalizeHitPath", () => {
  it("buckets bot and exploit probes on any kit to not-found", () => {
    const probes = [
      "/wp-login.php",
      "/index.php",
      "/admin.php",
      "/xmlrpc.php",
      "/.env",
      "/.git/config",
      "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php",
      "/wp-admin/setup-config.php",
      "/config.yml",
      "/backup.sql",
      "/shell.aspx",
      "/cgi-bin/test.cgi",
    ];
    for (const path of probes) {
      expect(normalizeHitPath("photos", path), path).toBe(NOT_FOUND_PATH);
      expect(normalizeHitPath("hub", path), path).toBe(NOT_FOUND_PATH);
    }
  });

  it("NEVER mislabels a real kit page, including dynamic routes not known here", () => {
    // The critical case: the photos kit's country pages are dynamic and live in
    // that kit's data, not this registry. They must pass through untouched.
    const realKitPages: Array<[string, string]> = [
      ["photos", "/"],
      ["photos", "/photo/uk-visa"],
      ["photos", "/photo/us-green-card"],
      ["photos", "/photo/india-pan"],
      ["photos", "/privacy"],
      ["dev", "/json"],
      ["dev", "/base64"],
      ["dev", "/sql-formatter"],
      ["dev", "/json-yaml"],
      ["background", "/white-background"],
      ["background", "/transparent-background"],
      ["teach", "/rubric"],
      ["study", "/molar-mass"],
      ["qr", "/wifi"],
    ];
    for (const [kit, path] of realKitPages) {
      expect(normalizeHitPath(kit, path), `${kit} ${path}`).toBe(path);
    }
  });

  it("buckets the hub's own 404s, whose full route set is known here", () => {
    expect(normalizeHitPath("hub", "/foobar")).toBe(NOT_FOUND_PATH);
    expect(normalizeHitPath("hub", "/random-page")).toBe(NOT_FOUND_PATH);
  });

  it("passes the hub's real pages through", () => {
    for (const path of HUB_STATIC_PATHS) {
      expect(normalizeHitPath("hub", path), path).toBe(path);
    }
    // /from-lgu ships with this change and must be recognised.
    expect(normalizeHitPath("hub", "/from-lgu")).toBe("/from-lgu");
  });

  it("passes our own event paths through unchanged", () => {
    for (const kit of ["hub", "photos", "dev"]) {
      expect(normalizeHitPath(kit, "/_event/email-submit")).toBe("/_event/email-submit");
      expect(normalizeHitPath(kit, "/_event/tool-completed")).toBe("/_event/tool-completed");
      expect(normalizeHitPath(kit, NOT_FOUND_PATH)).toBe(NOT_FOUND_PATH);
    }
  });

  it("does not treat a kit 404 as junk (it cannot be told from a real page here)", () => {
    // A non-junk unknown path on a kit is left as-is rather than guessed at: this
    // side has no way to know a kit's full route set, and mislabelling real
    // traffic is the worse error.
    expect(normalizeHitPath("dev", "/some-new-tool")).toBe("/some-new-tool");
  });
});

describe("KIT_SLUGS", () => {
  it("is exactly the registry's slugs, so it cannot drift", () => {
    expect([...KIT_SLUGS].sort()).toEqual(kits.map((k) => k.slug).sort());
    // Spot-check the kit whose dynamic routes make the whitelist dangerous.
    expect(KIT_SLUGS).toContain("photos");
  });
});
