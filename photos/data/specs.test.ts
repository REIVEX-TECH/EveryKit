import { describe, expect, it } from "vitest";
import { specs, mmToPx, getSpec, DEFAULT_SPEC_SLUG } from "./specs";

/**
 * These specs decide the size of a photo a real person submits to a government.
 * A wrong number gets an application rejected, so the contract is checked hard:
 * every preset has real dimensions and a named source, the stored pixels match
 * the millimetres at the stated DPI, and any head range is the right way round.
 */

const SENTINEL = "Not verified";

describe("photo specs", () => {
  it("gives every preset real dimensions", () => {
    for (const spec of specs) {
      expect(spec.widthMm, spec.slug).toBeGreaterThan(0);
      expect(spec.heightMm, spec.slug).toBeGreaterThan(0);
      expect(spec.dpi, spec.slug).toBeGreaterThan(0);
    }
  });

  it("names a source for every preset", () => {
    for (const spec of specs) {
      expect(spec.source.trim(), spec.slug).not.toBe("");
    }
  });

  it("only leaves a source unverified when the preset is flagged as such", () => {
    // A verified preset must cite a real authority, not the not-verified
    // sentinel; and a preset carrying the sentinel must be flagged, so a wrong
    // number can never masquerade as checked.
    for (const spec of specs) {
      const unverified = spec.source.includes(SENTINEL);
      if (spec.needsVerification) {
        expect(unverified, `${spec.slug} is flagged but cites a source`).toBe(true);
      } else {
        expect(unverified, `${spec.slug} is not flagged but has no real source`).toBe(false);
      }
    }
  });

  it("stores pixels that match the millimetres at the stated DPI", () => {
    for (const spec of specs) {
      expect(spec.pixelWidth, spec.slug).toBe(mmToPx(spec.widthMm, spec.dpi));
      expect(spec.pixelHeight, spec.slug).toBe(mmToPx(spec.heightMm, spec.dpi));
    }
  });

  it("keeps any head range the right way round and inside the frame", () => {
    for (const spec of specs) {
      if (spec.headMinMm !== undefined && spec.headMaxMm !== undefined) {
        expect(spec.headMinMm, spec.slug).toBeLessThan(spec.headMaxMm);
        // The head cannot be taller than the photo.
        expect(spec.headMaxMm, spec.slug).toBeLessThanOrEqual(spec.heightMm);
      }
    }
  });

  it("uses unique slugs and can resolve the default", () => {
    expect(new Set(specs.map((s) => s.slug)).size).toBe(specs.length);
    expect(getSpec(DEFAULT_SPEC_SLUG)).toBeDefined();
  });
});
