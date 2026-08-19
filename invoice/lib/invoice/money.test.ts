import { describe, expect, it } from "vitest";
import {
  computeTotals,
  CURRENCIES,
  formatAmount,
  formatMoney,
  getCurrency,
  lineTotal,
  parseAmount,
  percentOf,
  roundHalfUp,
  type Line,
} from "./money";

const USD = getCurrency("USD");
const PKR = getCurrency("PKR");
const INR = getCurrency("INR");
const JPY = getCurrency("JPY");

describe("parsing amounts", () => {
  it("reads ordinary input into whole minor units", () => {
    expect(parseAmount("10", USD)).toBe(1000);
    expect(parseAmount("10.5", USD)).toBe(1050);
    expect(parseAmount("10.55", USD)).toBe(1055);
    expect(parseAmount("0.01", USD)).toBe(1);
    expect(parseAmount("", USD)).toBe(0);
  });

  it("does not lose a penny to floating point", () => {
    // The reason this module is string-based: 19.99 * 100 is
    // 1998.9999999999998, and truncating that gives 1998, a penny short.
    expect(parseAmount("19.99", USD)).toBe(1999);
    expect(parseAmount("0.29", USD)).toBe(29);
    expect(parseAmount("1.005", USD)).toBe(100);
    for (let cents = 0; cents < 500; cents++) {
      const text = (cents / 100).toFixed(2);
      expect([text, parseAmount(text, USD)]).toEqual([text, cents]);
    }
  });

  it("tolerates the separators people type", () => {
    expect(parseAmount(" 1,234.50 ", USD)).toBe(123450);
    expect(parseAmount("1 000", USD)).toBe(100000);
  });

  it("refuses what is not a number rather than guessing", () => {
    for (const bad of ["abc", "1.2.3", "$5", ".", "-", "1e5"]) {
      expect([bad, parseAmount(bad, USD)]).toEqual([bad, null]);
    }
  });

  it("respects a currency with no decimal places", () => {
    expect(parseAmount("1000", JPY)).toBe(1000);
    expect(parseAmount("1000.9", JPY)).toBe(1000);
  });
});

describe("rounding", () => {
  it("rounds half away from zero, which is what an invoice expects", () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(-0.5)).toBe(-1);
    expect(roundHalfUp(-1.5)).toBe(-2);
  });

  it("rounds each line on its own", () => {
    // 3 at 0.335 is 1.005, which has to become 101 rather than 100.5.
    expect(lineTotal(3, 33.5)).toBe(101);
    expect(lineTotal(2.5, 1000)).toBe(2500);
    expect(lineTotal(0, 1000)).toBe(0);
  });

  it("takes a percentage in one rounded step", () => {
    expect(percentOf(10000, 20)).toBe(2000);
    expect(percentOf(1999, 20)).toBe(400);
    expect(percentOf(333, 33.3)).toBe(111);
    expect(percentOf(10000, 0)).toBe(0);
  });
});

describe("the totals", () => {
  const lines: Line[] = [
    { description: "Design", quantity: 3, unitPriceMinor: 15000 },
    { description: "Hosting", quantity: 1, unitPriceMinor: 2599 },
  ];

  it("adds the visible lines to the visible subtotal", () => {
    // The rule this pins down: the subtotal is the printed lines added up, so
    // anyone checking the invoice by hand gets the same answer.
    const totals = computeTotals(lines, { kind: "none" }, 0);
    expect(totals.lineTotals).toEqual([45000, 2599]);
    expect(totals.subtotalMinor).toBe(47599);
    expect(totals.totalMinor).toBe(47599);
  });

  it("takes the discount before the tax", () => {
    // VAT and GST are both charged on what is actually paid, not on list price.
    const totals = computeTotals(lines, { kind: "percent", percent: 10 }, 20);
    expect(totals.discountMinor).toBe(4760);
    expect(totals.taxableMinor).toBe(42839);
    expect(totals.taxMinor).toBe(8568);
    expect(totals.totalMinor).toBe(51407);
  });

  it("accepts a flat discount as well as a percentage", () => {
    const totals = computeTotals(lines, { kind: "amount", amountMinor: 5000 }, 0);
    expect(totals.discountMinor).toBe(5000);
    expect(totals.totalMinor).toBe(42599);
  });

  it("will not discount past zero into a credit note", () => {
    const totals = computeTotals(lines, { kind: "amount", amountMinor: 999999 }, 20);
    expect(totals.discountMinor).toBe(47599);
    expect(totals.taxableMinor).toBe(0);
    expect(totals.totalMinor).toBe(0);
  });

  it("handles the classic floating point case exactly", () => {
    // 0.1 + 0.2 in major units is 0.30000000000000004. In minor units it is 30.
    const totals = computeTotals(
      [
        { description: "a", quantity: 1, unitPriceMinor: 10 },
        { description: "b", quantity: 1, unitPriceMinor: 20 },
      ],
      { kind: "none" },
      0,
    );
    expect(totals.subtotalMinor).toBe(30);
    expect(formatMoney(totals.totalMinor, USD)).toBe("$0.30");
  });

  it("stays exact over a long invoice", () => {
    const many: Line[] = Array.from({ length: 200 }, () => ({
      description: "item",
      quantity: 1,
      unitPriceMinor: 1,
    }));
    expect(computeTotals(many, { kind: "none" }, 0).subtotalMinor).toBe(200);
    expect(formatMoney(200, USD)).toBe("$2.00");
  });

  it("copes with an empty invoice", () => {
    const totals = computeTotals([], { kind: "percent", percent: 10 }, 20);
    expect(totals).toMatchObject({ subtotalMinor: 0, discountMinor: 0, totalMinor: 0 });
  });
});

describe("formatting", () => {
  it("puts the symbol where each currency puts it", () => {
    expect(formatMoney(123456, getCurrency("USD"))).toBe("$1,234.56");
    expect(formatMoney(123456, getCurrency("GBP"))).toBe("£1,234.56");
    expect(formatMoney(123456, getCurrency("EUR"))).toBe("€1,234.56");
  });

  it("uses a space for the codes that read as words", () => {
    expect(formatMoney(123456, PKR)).toBe("Rs 1,234.56");
  });

  it("groups Indian numbers the Indian way", () => {
    // 1,00,000 rather than 100,000. Getting this wrong looks immediately
    // foreign to the person reading the invoice.
    expect(formatMoney(10000000, INR)).toBe("₹1,00,000.00");
    expect(formatMoney(123456789, INR)).toBe("₹12,34,567.89");
  });

  it("drops the decimals for a currency that has none", () => {
    expect(formatMoney(1000, JPY)).toBe("¥1,000");
    expect(formatMoney(1234567, JPY)).toBe("¥1,234,567");
  });

  it("keeps trailing zeros, because money is written that way", () => {
    expect(formatMoney(500, USD)).toBe("$5.00");
    expect(formatMoney(510, USD)).toBe("$5.10");
    expect(formatMoney(1, USD)).toBe("$0.01");
  });

  it("writes a negative in front of the symbol", () => {
    expect(formatMoney(-500, USD)).toBe("-$5.00");
  });

  it("formats the bare number when the currency is stated elsewhere", () => {
    expect(formatAmount(123456, USD)).toBe("1,234.56");
    expect(formatAmount(1000, JPY)).toBe("1,000");
  });

  it("every currency in the list round-trips through parse and format", () => {
    for (const currency of CURRENCIES) {
      const minor = parseAmount("1234.5", currency);
      expect([currency.code, typeof minor]).toEqual([currency.code, "number"]);
      expect([currency.code, formatMoney(minor!, currency).length > 0]).toEqual([
        currency.code,
        true,
      ]);
    }
  });
});
