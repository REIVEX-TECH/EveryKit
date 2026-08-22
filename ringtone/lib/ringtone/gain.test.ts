import { describe, expect, it } from "vitest";
import { applyGain, clippedFraction, maxCleanGain, percentToGain } from "./gain";

describe("applyGain", () => {
  it("scales every sample", () => {
    // Float32 rounds, so compare with tolerance rather than exact equality.
    const r = applyGain(new Float32Array([0.1, -0.2, 0.3]), 2);
    expect(r.channel[0]).toBeCloseTo(0.2, 5);
    expect(r.channel[1]).toBeCloseTo(-0.4, 5);
    expect(r.channel[2]).toBeCloseTo(0.6, 5);
  });

  it("counts samples that overflow the range", () => {
    const r = applyGain(new Float32Array([0.6, -0.6, 0.4]), 2);
    // 0.6*2 and -0.6*2 clip; 0.4*2=0.8 does not.
    expect(r.clippedSamples).toBe(2);
  });

  it("clips nothing at unity gain", () => {
    const r = applyGain(new Float32Array([1, -1, 0.5]), 1);
    expect(r.clippedSamples).toBe(0);
  });
});

describe("maxCleanGain", () => {
  it("is the reciprocal of the peak", () => {
    expect(maxCleanGain(new Float32Array([0.25, -0.5, 0.1]))).toBeCloseTo(2, 5);
  });
  it("applied to the clip leaves the peak at the ceiling and nothing clipping", () => {
    const ch = new Float32Array([0.25, -0.5, 0.1]);
    const g = maxCleanGain(ch);
    expect(applyGain(ch, g).clippedSamples).toBe(0);
  });
  it("is 1 for pure silence rather than dividing by zero", () => {
    expect(maxCleanGain(new Float32Array([0, 0, 0]))).toBe(1);
  });
});

describe("clippedFraction", () => {
  it("is the share of samples that overflow", () => {
    expect(clippedFraction(new Float32Array([0.6, 0.6, 0.1, 0.1]), 2)).toBeCloseTo(0.5, 5);
  });
  it("is zero for empty input", () => {
    expect(clippedFraction(new Float32Array([]), 4)).toBe(0);
  });
});

describe("percentToGain", () => {
  it("maps 100 to unity", () => {
    expect(percentToGain(100)).toBe(1);
    expect(percentToGain(200)).toBe(2);
    expect(percentToGain(50)).toBe(0.5);
  });
});
