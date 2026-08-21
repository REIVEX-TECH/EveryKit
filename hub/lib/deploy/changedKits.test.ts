/**
 * The deploy's diff-to-app mapping.
 *
 * The function lives in deploy/lib so the shell script can run it with no
 * install step in front of it. The tests live here because the hub is where
 * the registry lives and where the repo's own tooling is already tested, and
 * because a rule about which app is stale is exactly the kind of thing that
 * looks obvious and is wrong at the edges.
 */
import { describe, expect, it } from "vitest";
import {
  APPS,
  BUILD_ORDER,
  appsForChanges,
  selectApps,
} from "../../../deploy/lib/changed-kits.mjs";

describe("appsForChanges", () => {
  it("maps a file to the app whose directory holds it", () => {
    const { apps } = appsForChanges(["photos/app/page.tsx"]);
    expect(apps).toEqual(["photos"]);
  });

  it("collects several apps and returns them in build order", () => {
    const { apps } = appsForChanges([
      "hub/app/page.tsx",
      "calc/lib/calc/emi.ts",
      "letters/data/letters/visa.ts",
    ]);
    // Build order puts the hub last, whatever order the paths arrived in.
    expect(apps).toEqual(["letters", "calc", "hub"]);
  });

  it("does not confuse an app with a longer name that starts the same way", () => {
    // "text" and "text-something" would both start with "text", and a prefix
    // test without the slash would claim the second for the first.
    const { apps } = appsForChanges(["textures/thing.ts"]);
    expect(apps).toEqual([...BUILD_ORDER]);
  });

  it("rebuilds everything when a shared file changes", () => {
    const { apps } = appsForChanges(["CLAUDE.md"]);
    expect(apps).toEqual([...BUILD_ORDER]);
    expect(apps).toHaveLength(APPS.length);
  });

  it("treats anything under a shared directory as shared", () => {
    expect(appsForChanges(["db/schema.sql"]).apps).toHaveLength(APPS.length);
    expect(appsForChanges(["deploy/nginx/useeverykit.conf"]).apps).toHaveLength(APPS.length);
  });

  it("sends a registry change to the hub and to no kit", () => {
    const { apps, reasons } = appsForChanges(["hub/data/kits.ts"]);
    expect(apps).toEqual(["hub"]);
    expect(reasons.hub).toContain("the kit registry changed");
  });

  it("ignores prose and pictures that no build reads", () => {
    const { apps, ignored } = appsForChanges([
      "README.md",
      "LAUNCH.md",
      "docs/everykit-hub-build-prompt.md",
      "MORNING-REPORT-4.md",
      "assets/og.png",
    ]);
    expect(apps).toEqual([]);
    expect(ignored).toHaveLength(5);
  });

  it("rebuilds everything for an unrecognised top-level file", () => {
    // The safe direction. A file nobody claims might be read by anybody, and
    // guessing "inert" is how a stale kit ends up serving.
    const { apps, reasons } = appsForChanges(["newthing.config.js"]);
    expect(apps).toEqual([...BUILD_ORDER]);
    expect(reasons.hub.join(" ")).toContain("not owned by any app");
  });

  it("handles Windows separators and leading ./ from any caller", () => {
    expect(appsForChanges(["qr\\app\\page.tsx"]).apps).toEqual(["qr"]);
    expect(appsForChanges(["./dev/lib/dev/cron.ts"]).apps).toEqual(["dev"]);
  });

  it("ignores blank lines, which is what a trailing newline arrives as", () => {
    expect(appsForChanges(["", "  ", "sign/app/page.tsx", ""]).apps).toEqual(["sign"]);
  });

  it("says nothing changed when nothing changed", () => {
    expect(appsForChanges([]).apps).toEqual([]);
  });

  it("does not repeat a reason when several files give the same one", () => {
    const { reasons } = appsForChanges([
      "study/app/page.tsx",
      "study/lib/gpa.ts",
      "study/components/Thing.tsx",
    ]);
    expect(reasons.study).toEqual(["study/ changed"]);
  });
});

describe("selectApps", () => {
  it("puts a hand-picked list into build order", () => {
    expect(selectApps(["hub", "photos", "letters"]).apps).toEqual([
      "letters",
      "photos",
      "hub",
    ]);
  });

  it("reports names that are not apps rather than silently dropping them", () => {
    const { apps, unknown } = selectApps(["photos", "phtoos"]);
    expect(apps).toEqual(["photos"]);
    expect(unknown).toEqual(["phtoos"]);
  });

  it("de-duplicates", () => {
    expect(selectApps(["calc", "calc"]).apps).toEqual(["calc"]);
  });
});

describe("the app list itself", () => {
  it("builds every app exactly once", () => {
    expect([...BUILD_ORDER].sort()).toEqual([...APPS].sort());
    expect(new Set(BUILD_ORDER).size).toBe(BUILD_ORDER.length);
  });

  it("builds the hub last", () => {
    expect(BUILD_ORDER[BUILD_ORDER.length - 1]).toBe("hub");
  });
});
