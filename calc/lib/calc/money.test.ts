import { describe, expect, it } from "vitest";
import { applyDiscount, applyVat, parsePercent } from "./money";
import { parseAmount } from "./emi";
import {
  parseMeasure,
  parsePeople,
  toKm,
  toLitresPerKm,
  toMinorPerLitre,
  tripCost,
} from "./trip";

const money = (s: string) => parseAmount(s)!;

describe("applyDiscount", () => {
  it("takes a single percentage off", () => {
    const r = applyDiscount({ priceMinor: money("100"), first: 25, second: null });
    expect(r.finalMinor).toBe(money("75"));
    expect(r.savedMinor).toBe(money("25"));
    expect(r.effectivePercent).toBeCloseTo(25, 5);
  });

  it("stacks a second discount on what the first leaves, not additively", () => {
    // 20% then 10% off 100 is 72, an effective 28% off, not 30%.
    const r = applyDiscount({ priceMinor: money("100"), first: 20, second: 10 });
    expect(r.afterFirstMinor).toBe(money("80"));
    expect(r.finalMinor).toBe(money("72"));
    expect(r.savedMinor).toBe(money("28"));
    expect(r.effectivePercent).toBeCloseTo(28, 5);
  });

  it("rounds to whole minor units and keeps the parts adding up", () => {
    // 33% off 9.99 = 6.6933 → 6.69; saved is the exact complement.
    const r = applyDiscount({ priceMinor: money("9.99"), first: 33, second: null });
    expect(r.finalMinor + r.savedMinor).toBe(money("9.99"));
  });

  it("handles a full 100% off", () => {
    const r = applyDiscount({ priceMinor: money("50"), first: 100, second: null });
    expect(r.finalMinor).toBe(0);
    expect(r.savedMinor).toBe(money("50"));
  });
});

describe("applyVat", () => {
  it("adds tax to a net amount", () => {
    const r = applyVat("add", { amountMinor: money("100"), rate: 20 });
    expect(r.netMinor).toBe(money("100"));
    expect(r.taxMinor).toBe(money("20"));
    expect(r.grossMinor).toBe(money("120"));
  });

  it("extracts tax from a gross amount, which is not the rate times the gross", () => {
    // The tax inside 120 at 20% is 20, not 24.
    const r = applyVat("extract", { amountMinor: money("120"), rate: 20 });
    expect(r.netMinor).toBe(money("100"));
    expect(r.taxMinor).toBe(money("20"));
    expect(r.grossMinor).toBe(money("120"));
  });

  it("keeps net, tax and gross adding up after rounding", () => {
    const r = applyVat("extract", { amountMinor: money("99.99"), rate: 17.5 });
    expect(r.netMinor + r.taxMinor).toBe(r.grossMinor);
    expect(r.grossMinor).toBe(money("99.99"));
  });

  it("is a no-op at a zero rate", () => {
    const add = applyVat("add", { amountMinor: money("40"), rate: 0 });
    expect(add.grossMinor).toBe(money("40"));
    expect(add.taxMinor).toBe(0);
  });
});

describe("parsePercent", () => {
  it("accepts 0 to 100 and rejects above", () => {
    expect(parsePercent("20")).toBe(20);
    expect(parsePercent("20%")).toBe(20);
    expect(parsePercent("0")).toBe(0);
    expect(parsePercent("150")).toBeNull();
    expect(parsePercent("abc")).toBeNull();
  });
});

describe("trip conversions", () => {
  it("converts miles to km", () => {
    expect(toKm(100, "mi")).toBeCloseTo(160.9344, 3);
    expect(toKm(100, "km")).toBe(100);
  });

  it("reads l/100km straight through", () => {
    expect(toLitresPerKm(8, "l100km")).toBeCloseTo(0.08, 6);
  });

  it("inverts mpg, so a higher figure means fewer litres per km", () => {
    const thirsty = toLitresPerKm(20, "mpg-us");
    const frugal = toLitresPerKm(50, "mpg-us");
    expect(frugal).toBeLessThan(thirsty);
    // 30 mpg (US) is a well-known ~7.84 l/100km.
    expect(toLitresPerKm(30, "mpg-us") * 100).toBeCloseTo(7.84, 1);
  });

  it("distinguishes US and imperial gallons", () => {
    // At the SAME mpg number, imperial burns more litres per km, because an
    // imperial gallon is the bigger measure. (A given car is rated a higher
    // mpg number in imperial, which is the opposite-looking fact people recall.)
    expect(toLitresPerKm(30, "mpg-uk")).toBeGreaterThan(toLitresPerKm(30, "mpg-us"));
  });

  it("converts a per-gallon price to per-litre", () => {
    // A price of 4.00 per US gallon is about 1.057 per litre.
    expect(toMinorPerLitre(400, "per-us-gallon")).toBeCloseTo(105.67, 1);
    expect(toMinorPerLitre(100, "per-litre")).toBe(100);
  });
});

describe("tripCost", () => {
  it("computes a plain metric trip", () => {
    // 500 km at 8 l/100km = 40 litres; at 1.50/litre = 60.00.
    const r = tripCost({
      distance: 500,
      distanceUnit: "km",
      efficiency: 8,
      efficiencyUnit: "l100km",
      fuelPriceMinor: 150,
      fuelPriceUnit: "per-litre",
      people: 1,
    });
    expect(r.litres).toBeCloseTo(40, 5);
    expect(r.totalMinor).toBe(6000);
    expect(r.perPersonMinor).toBe(6000);
  });

  it("splits the total between people", () => {
    const r = tripCost({
      distance: 500,
      distanceUnit: "km",
      efficiency: 8,
      efficiencyUnit: "l100km",
      fuelPriceMinor: 150,
      fuelPriceUnit: "per-litre",
      people: 4,
    });
    expect(r.perPersonMinor).toBe(1500);
  });

  it("agrees across unit systems for the same real trip", () => {
    // Metric: 160.9344 km at 7.84 l/100km, fuel 1.20/litre.
    const metric = tripCost({
      distance: 160.9344,
      distanceUnit: "km",
      efficiency: 7.84,
      efficiencyUnit: "l100km",
      fuelPriceMinor: 120,
      fuelPriceUnit: "per-litre",
      people: 1,
    });
    // Imperial-ish: 100 miles at 30 mpg US, same fuel priced per litre.
    const imperial = tripCost({
      distance: 100,
      distanceUnit: "mi",
      efficiency: 30,
      efficiencyUnit: "mpg-us",
      fuelPriceMinor: 120,
      fuelPriceUnit: "per-litre",
      people: 1,
    });
    // 30 mpg US is 7.84 l/100km to two places, so the two should land within a
    // few pennies of each other rather than being wildly different.
    expect(Math.abs(metric.totalMinor - imperial.totalMinor)).toBeLessThan(15);
  });
});

describe("trip parsing", () => {
  it("takes a whole number of people, 1 to 99", () => {
    expect(parsePeople("4")).toBe(4);
    expect(parsePeople("0")).toBeNull();
    expect(parsePeople("100")).toBeNull();
    expect(parsePeople("2.5")).toBeNull();
  });

  it("takes a positive measurement", () => {
    expect(parseMeasure("8.5")).toBe(8.5);
    expect(parseMeasure("1,000")).toBe(1000);
    expect(parseMeasure("0")).toBeNull();
    expect(parseMeasure("-5")).toBeNull();
  });
});
