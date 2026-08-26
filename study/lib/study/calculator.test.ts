import { describe, expect, it } from "vitest";
import { evaluate } from "./calculator";

describe("evaluate", () => {
  it("does arithmetic with the right precedence", () => {
    expect(evaluate("2 + 3 * 4")).toBe(14);
    expect(evaluate("(2 + 3) * 4")).toBe(20);
    expect(evaluate("10 / 4")).toBe(2.5);
  });

  it("handles a unary minus", () => {
    expect(evaluate("-5 + 2")).toBe(-3);
    expect(evaluate("3 * -2")).toBe(-6);
    expect(evaluate("-(4 - 1)")).toBe(-3);
  });

  it("does powers, right-associative, and roots", () => {
    expect(evaluate("2 ^ 3 ^ 2")).toBe(512); // 2^(3^2), not (2^3)^2
    expect(evaluate("sqrt(144)")).toBe(12);
    expect(evaluate("√(9)")).toBe(3);
  });

  it("does trig in degrees by default and radians on request", () => {
    expect(evaluate("sin(30)")).toBeCloseTo(0.5, 10);
    expect(evaluate("cos(0)")).toBe(1);
    expect(evaluate("sin(pi / 2)", "rad")).toBeCloseTo(1, 10);
  });

  it("does logs and the constants", () => {
    expect(evaluate("log(1000)")).toBeCloseTo(3, 10);
    expect(evaluate("ln(e)")).toBeCloseTo(1, 10);
    expect(evaluate("pi")).toBeCloseTo(Math.PI, 12);
  });

  it("does factorial", () => {
    expect(evaluate("5!")).toBe(120);
    expect(evaluate("3! + 2")).toBe(8);
  });

  it("throws on malformed input rather than guessing", () => {
    expect(() => evaluate("2 +")).toThrow();
    expect(() => evaluate("(3 + 4")).toThrow();
    expect(() => evaluate("3 4")).toThrow();
    expect(() => evaluate("frobnicate(2)")).toThrow();
    expect(() => evaluate("")).toThrow();
  });

  it("never runs arbitrary code: a bare identifier is rejected", () => {
    expect(() => evaluate("alert")).toThrow();
    expect(() => evaluate("2 + window")).toThrow();
  });
});
