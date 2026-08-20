import { describe, expect, it } from "vitest";
import { kits } from "@/data/kits";
import { MAX_PATH_LENGTH, knownKits, normaliseKit, normalisePath } from "./pageviews";

describe("the kit a hit claims to come from", () => {
  it("accepts every slug in the registry, and the hub", () => {
    for (const kit of kits) {
      expect(normaliseKit(kit.slug)).toBe(kit.slug);
    }
    expect(normaliseKit("hub")).toBe("hub");
    expect(knownKits()).toHaveLength(kits.length + 1);
  });

  it("refuses anything else rather than folding it into the hub", () => {
    // A wrong slug here would draw a kit in the dashboard that does not exist.
    expect(normaliseKit("notakit")).toBeNull();
    expect(normaliseKit("'; drop table pageviews; --")).toBeNull();
    expect(normaliseKit("")).toBeNull();
    expect(normaliseKit(undefined)).toBeNull();
    expect(normaliseKit(7)).toBeNull();
    expect(normaliseKit(["photos"])).toBeNull();
  });

  it("is case and whitespace insensitive, since it comes over the wire", () => {
    expect(normaliseKit(" Photos ")).toBe("photos");
  });
});

describe("the path a hit is recorded against", () => {
  it("keeps an ordinary path as it is", () => {
    expect(normalisePath("/")).toBe("/");
    expect(normalisePath("/privacy")).toBe("/privacy");
    expect(normalisePath("/us-passport-photo-2x2")).toBe("/us-passport-photo-2x2");
  });

  it("drops the query string before anything is stored", () => {
    // This is the rule that matters most in this file. A campaign tag is
    // harmless; an email address pasted into a share link is not, and both
    // arrive the same way.
    expect(normalisePath("/?utm_source=x&utm_campaign=y")).toBe("/");
    expect(normalisePath("/privacy?email=someone@example.com")).toBe("/privacy");
  });

  it("drops a fragment, in case one is passed in by hand", () => {
    expect(normalisePath("/terms#refunds")).toBe("/terms");
  });

  it("folds trailing and repeated slashes into one row", () => {
    expect(normalisePath("/privacy/")).toBe("/privacy");
    expect(normalisePath("/privacy///")).toBe("/privacy");
    expect(normalisePath("//a//b/")).toBe("/a/b");
    expect(normalisePath("/")).toBe("/");
  });

  it("takes a whole URL and keeps only the path", () => {
    expect(normalisePath("https://photos.useeverykit.com/uk-passport?x=1")).toBe("/uk-passport");
  });

  it("refuses what is not a path", () => {
    expect(normalisePath("privacy")).toBeNull();
    expect(normalisePath("")).toBeNull();
    expect(normalisePath("   ")).toBeNull();
    expect(normalisePath(undefined)).toBeNull();
    expect(normalisePath(42)).toBeNull();
  });

  it("refuses control characters, spaces and backslashes", () => {
    expect(normalisePath("/a b")).toBeNull();
    expect(normalisePath("/a\nb")).toBeNull();
    expect(normalisePath("/..\\..\\windows")).toBeNull();
  });

  it("refuses a path longer than the column is meant to hold", () => {
    expect(normalisePath(`/${"a".repeat(MAX_PATH_LENGTH)}`)).toBeNull();
    expect(normalisePath(`/${"a".repeat(MAX_PATH_LENGTH - 2)}`)).not.toBeNull();
  });
});
