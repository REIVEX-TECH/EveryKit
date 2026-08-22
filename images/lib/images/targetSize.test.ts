import { describe, expect, it } from "vitest";
import { searchForTarget } from "./targetSize";

/**
 * A stand-in encoder. Real JPEG size rises with quality but not smoothly; this
 * is monotonic, which is all the search relies on. Size in bytes is a simple
 * function of quality so each test can reason about the boundary exactly.
 */
function fakeEncoder(sizeAt: (quality: number) => number) {
  const calls: number[] = [];
  const encode = async (quality: number): Promise<Blob> => {
    calls.push(quality);
    // A Blob whose size is what the model says; the bytes are irrelevant.
    return new Blob([new Uint8Array(sizeAt(quality))]);
  };
  return { encode, calls };
}

describe("searchForTarget", () => {
  it("finds the highest quality under the target", async () => {
    // size = quality * 1000, so 500 kB-equivalent target of 700 admits up to 0.7.
    const { encode } = fakeEncoder((q) => Math.round(q * 1000));
    const result = await searchForTarget(700, encode);

    expect(result.metTarget).toBe(true);
    expect(result.encoded.size).toBeLessThanOrEqual(700);
    // The next step up would have exceeded it.
    expect(result.encoded.quality).toBeCloseTo(0.7, 5);
  });

  it("returns the smallest file, flagged, when even the floor is too big", async () => {
    // Everything is enormous; the lowest step is still over target.
    const { encode, calls } = fakeEncoder((q) => 5000 + q * 1000);
    const result = await searchForTarget(1000, encode);

    expect(result.metTarget).toBe(false);
    expect(result.encoded.quality).toBe(0.4); // the floor
    // It did not bother searching above a floor that already failed.
    expect(calls).toEqual([0.4]);
  });

  it("returns a real encode, never a predicted size", async () => {
    const { encode } = fakeEncoder((q) => Math.round(q * 100));
    const result = await searchForTarget(1000, encode);
    // Whatever quality it settled on, the blob's size is that encode's size.
    expect(result.encoded.blob.size).toBe(result.encoded.size);
  });

  it("accepts the top quality when the target is generous", async () => {
    const { encode } = fakeEncoder((q) => Math.round(q * 100));
    const result = await searchForTarget(1_000_000, encode);
    expect(result.metTarget).toBe(true);
    expect(result.encoded.quality).toBe(0.95); // the highest step
  });

  it("does far fewer encodes than a linear scan of the steps", async () => {
    const { encode, calls } = fakeEncoder((q) => Math.round(q * 1000));
    await searchForTarget(700, encode);
    // Twelve steps; a binary search plus the floor probe is well under that.
    expect(calls.length).toBeLessThanOrEqual(6);
  });
});
