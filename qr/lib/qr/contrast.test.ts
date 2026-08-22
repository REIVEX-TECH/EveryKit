import { describe, expect, it } from "vitest";
import { contrastRatio, judgeContrast, luminance, hexToRgb } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("is 1 for a colour against itself", () => {
    expect(contrastRatio("#1d81f2", "#1d81f2")).toBeCloseTo(1, 5);
  });
  it("does not care which way round the two are given", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#000000"),
      5,
    );
  });
  it("reads three-digit hex", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 0);
  });
});

describe("luminance", () => {
  it("runs from 0 at black to 1 at white", () => {
    expect(luminance(hexToRgb("#000000"))).toBeCloseTo(0, 5);
    expect(luminance(hexToRgb("#ffffff"))).toBeCloseTo(1, 5);
  });
});

describe("judgeContrast", () => {
  it("passes the default dark on white", () => {
    const v = judgeContrast("#171717", "#ffffff");
    expect(v.level).toBe("ok");
  });

  it("passes a strong brand colour on white", () => {
    // A dark blue code on white is a common, scannable choice.
    expect(judgeContrast("#1156a8", "#ffffff").level).toBe("ok");
  });

  it("warns when the two are close but the right way round", () => {
    const v = judgeContrast("#777777", "#ffffff");
    expect(v.level).toBe("warn");
    if (v.level !== "ok") expect(v.message).toMatch(/low/i);
  });

  it("fails two tones too close to separate", () => {
    const v = judgeContrast("#888888", "#999999");
    expect(v.level).toBe("bad");
  });

  it("calls out an inverted code on its own terms", () => {
    // A light code on a dark ground: even at high contrast this scans badly.
    const v = judgeContrast("#ffffff", "#000000");
    expect(v.level).toBe("bad");
    if (v.level !== "ok") expect(v.message).toMatch(/inverted|swap/i);
  });
});
