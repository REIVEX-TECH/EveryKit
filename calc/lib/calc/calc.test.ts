import { describe, expect, it } from "vitest";
import {
  atMidday,
  daysBetween,
  describeDuration,
  difference,
  exactDuration,
  longDate,
  nextBirthday,
  parseDate,
  toIsoDate,
} from "./dates";
import { CATEGORIES, convert, formatResult, parseValue, unitsFor } from "./units";
import { calculateLoan, formatMoney, parseAmount, parseMonths, parseRate } from "./emi";
import {
  changeNote,
  isWhatPercentOf,
  parseNumber,
  percentChange,
  percentOf,
  tidy,
} from "./percentage";

const d = (iso: string) => parseDate(iso) as Date;

describe("dates", () => {
  it("reads a date input as a local calendar date", () => {
    const date = d("2026-08-05");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(5);
  });

  it("refuses a date that does not exist", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("2025-02-29")).toBeNull();
    expect(parseDate("2026-13-01")).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("tomorrow")).toBeNull();
  });

  it("accepts 29 February in a leap year", () => {
    expect(parseDate("2024-02-29")).not.toBeNull();
  });

  it("counts whole days regardless of the time of day", () => {
    expect(daysBetween(d("2026-08-01"), d("2026-08-05"))).toBe(4);
    expect(daysBetween(d("2026-08-05"), d("2026-08-01"))).toBe(-4);
    expect(daysBetween(d("2026-08-05"), d("2026-08-05"))).toBe(0);
  });

  it("counts across a daylight saving boundary without losing a day", () => {
    // Late March and late October are where a naive hour-based count slips.
    expect(daysBetween(d("2026-03-28"), d("2026-03-30"))).toBe(2);
    expect(daysBetween(d("2026-10-24"), d("2026-10-26"))).toBe(2);
  });

  it("counts a year as a year", () => {
    expect(daysBetween(d("2025-01-01"), d("2026-01-01"))).toBe(365);
    expect(daysBetween(d("2024-01-01"), d("2025-01-01"))).toBe(366);
  });

  describe("exact age", () => {
    it("walks the calendar rather than dividing", () => {
      expect(exactDuration(d("2000-01-15"), d("2026-08-21"))).toEqual({
        years: 26,
        months: 7,
        days: 6,
      });
    });

    it("is zero on the day itself", () => {
      expect(exactDuration(d("2000-08-21"), d("2000-08-21"))).toEqual({
        years: 0,
        months: 0,
        days: 0,
      });
    });

    it("turns over exactly on the birthday", () => {
      expect(exactDuration(d("2000-08-21"), d("2026-08-20")).years).toBe(25);
      expect(exactDuration(d("2000-08-21"), d("2026-08-21")).years).toBe(26);
    });

    it("counts days when a month cannot complete, rather than inventing a clamp", () => {
      // 31 January has no anniversary in February, so no whole month has
      // passed by 1 March. Calling it "1 month and 1 day" would mean deciding
      // that 31 January plus a month is 28 February, which is a guess. The day
      // count is the part that is not a matter of opinion.
      expect(exactDuration(d("2026-01-31"), d("2026-03-01"))).toEqual({
        years: 0,
        months: 0,
        days: 29,
      });
      expect(exactDuration(d("2024-01-31"), d("2024-03-01"))).toEqual({
        years: 0,
        months: 0,
        days: 30,
      });
      // One day later the month does complete, on the 31st.
      expect(exactDuration(d("2026-01-31"), d("2026-03-31"))).toEqual({
        years: 0,
        months: 2,
        days: 0,
      });
    });

    it("handles somebody born on 29 February", () => {
      expect(exactDuration(d("2000-02-29"), d("2025-02-28")).years).toBe(24);
      expect(exactDuration(d("2000-02-29"), d("2025-03-01")).years).toBe(25);
      expect(exactDuration(d("2000-02-29"), d("2024-02-29"))).toEqual({
        years: 24,
        months: 0,
        days: 0,
      });
    });

    it("reads out with the empty parts left out", () => {
      expect(describeDuration({ years: 26, months: 7, days: 6 })).toBe(
        "26 years, 7 months and 6 days",
      );
      expect(describeDuration({ years: 1, months: 0, days: 1 })).toBe("1 year and 1 day");
      expect(describeDuration({ years: 0, months: 0, days: 0 })).toBe("0 days");
      expect(describeDuration({ years: 0, months: 1, days: 0 })).toBe("1 month");
    });
  });

  describe("the next birthday", () => {
    it("finds this year's when it has not happened yet", () => {
      const next = nextBirthday(d("2000-12-25"), d("2026-08-21"));
      expect(toIsoDate(next.date)).toBe("2026-12-25");
      expect(next.days).toBe(126);
    });

    it("rolls to next year when it has passed", () => {
      const next = nextBirthday(d("2000-01-15"), d("2026-08-21"));
      expect(toIsoDate(next.date)).toBe("2027-01-15");
    });

    it("is today when today is the day", () => {
      const next = nextBirthday(d("2000-08-21"), d("2026-08-21"));
      expect(next.days).toBe(0);
    });

    it("observes a 29 February birthday on 1 March in a common year", () => {
      // A choice rather than a fact, and the one most people make. Said on the
      // page as well as here.
      const common = nextBirthday(d("2000-02-29"), d("2026-01-01"));
      expect(toIsoDate(common.date)).toBe("2026-03-01");
      expect(common.isLeapDay).toBe(true);

      const leap = nextBirthday(d("2000-02-29"), d("2028-01-01"));
      expect(toIsoDate(leap.date)).toBe("2028-02-29");
    });
  });

  describe("the difference between two dates", () => {
    it("excludes the end date by default", () => {
      const result = difference(d("2026-08-01"), d("2026-08-05"), false);
      expect(result.days).toBe(4);
      expect(result.weeks).toBe(0);
      expect(result.remainderDays).toBe(4);
    });

    it("includes it when asked, which is the other question people mean", () => {
      const result = difference(d("2026-08-01"), d("2026-08-05"), true);
      expect(result.days).toBe(5);
    });

    it("splits into whole weeks and days left over", () => {
      const result = difference(d("2026-08-01"), d("2026-08-18"), false);
      expect(result.days).toBe(17);
      expect(result.weeks).toBe(2);
      expect(result.remainderDays).toBe(3);
    });

    it("does not care which date came first", () => {
      const forward = difference(d("2026-08-01"), d("2026-08-05"), false);
      const backward = difference(d("2026-08-05"), d("2026-08-01"), false);
      expect(backward.days).toBe(forward.days);
      expect(backward.months).toBe(forward.months);
    });

    it("counts whole months", () => {
      expect(difference(d("2026-01-15"), d("2026-08-14"), false).months).toBe(6);
      expect(difference(d("2026-01-15"), d("2026-08-15"), false).months).toBe(7);
    });
  });

  it("writes a date the way it reads out loud", () => {
    expect(longDate(d("2026-08-05"))).toBe("Wednesday, 5 August 2026");
  });

  it("round trips through an ISO string", () => {
    expect(toIsoDate(d("2026-08-05"))).toBe("2026-08-05");
    expect(toIsoDate(atMidday(new Date(2026, 0, 1, 23, 59)))).toBe("2026-01-01");
  });
});

describe("unit conversion", () => {
  it("converts length against the exact definitions", () => {
    // An inch is exactly 25.4 mm by international agreement.
    expect(convert(1, "length", "in", "cm")).toBeCloseTo(2.54, 10);
    expect(convert(1, "length", "mi", "km")).toBeCloseTo(1.609344, 10);
    expect(convert(1, "length", "ft", "in")).toBeCloseTo(12, 10);
    expect(convert(100, "length", "cm", "m")).toBeCloseTo(1, 10);
    expect(convert(1, "length", "nmi", "m")).toBeCloseTo(1852, 10);
  });

  it("converts weight against the exact definitions", () => {
    // A pound is exactly 0.45359237 kg.
    expect(convert(1, "weight", "lb", "kg")).toBeCloseTo(0.45359237, 12);
    expect(convert(1, "weight", "kg", "lb")).toBeCloseTo(2.2046226218, 8);
    expect(convert(16, "weight", "oz", "lb")).toBeCloseTo(1, 10);
    expect(convert(1, "weight", "st", "lb")).toBeCloseTo(14, 8);
  });

  it("converts temperature by its offsets, not as a ratio", () => {
    // The bug this guards: 20C is not twice 10C in any other scale.
    expect(convert(0, "temperature", "c", "f")).toBeCloseTo(32, 10);
    expect(convert(100, "temperature", "c", "f")).toBeCloseTo(212, 10);
    expect(convert(-40, "temperature", "c", "f")).toBeCloseTo(-40, 10);
    expect(convert(98.6, "temperature", "f", "c")).toBeCloseTo(37, 8);
    expect(convert(0, "temperature", "c", "k")).toBeCloseTo(273.15, 10);
    expect(convert(0, "temperature", "k", "c")).toBeCloseTo(-273.15, 10);
    expect(convert(32, "temperature", "f", "k")).toBeCloseTo(273.15, 8);
  });

  it("converts area, including the local units", () => {
    expect(convert(1, "area", "sqm", "sqft")).toBeCloseTo(10.7639104, 6);
    expect(convert(1, "area", "acre", "sqm")).toBeCloseTo(4046.8564224, 6);
    expect(convert(1, "area", "ha", "acre")).toBeCloseTo(2.4710538, 6);
    expect(convert(20, "area", "marla", "kanal")).toBeCloseTo(1, 3);
  });

  it("is its own inverse", () => {
    for (const [category, [from, to]] of Object.entries({
      length: ["mi", "mm"],
      weight: ["st", "g"],
      temperature: ["f", "k"],
      area: ["acre", "sqcm"],
    } as const)) {
      const there = convert(7.5, category as never, from, to) as number;
      const back = convert(there, category as never, to, from) as number;
      expect(back).toBeCloseTo(7.5, 6);
    }
  });

  it("returns nothing for a unit it does not have", () => {
    expect(convert(1, "length", "parsec", "m")).toBeNull();
    expect(convert(Number.NaN, "length", "m", "cm")).toBeNull();
  });

  it("has every unit in every category carrying a factor, except temperature", () => {
    for (const category of ["length", "weight", "area"] as const) {
      for (const unit of unitsFor(category)) expect(typeof unit.factor).toBe("number");
    }
    for (const unit of unitsFor("temperature")) expect(unit.factor).toBeUndefined();
    expect(Object.keys(CATEGORIES)).toHaveLength(4);
  });

  it("caps the precision rather than printing floating point noise", () => {
    expect(formatResult(2.5400000000000005)).toBe("2.54");
    expect(formatResult(0)).toBe("0");
    expect(formatResult(1 / 3)).toBe("0.333333");
    expect(formatResult(1e15)).toContain("e+");
    expect(formatResult(1e-9)).toContain("e-");
  });

  it("takes a number with the separators people paste", () => {
    expect(parseValue("1,234.5")).toBe(1234.5);
    expect(parseValue(" 42 ")).toBe(42);
    expect(parseValue("-5")).toBe(-5);
    expect(parseValue("abc")).toBeNull();
    expect(parseValue("")).toBeNull();
  });
});

describe("loan instalments", () => {
  it("parses money into whole minor units without floating point loss", () => {
    expect(parseAmount("19.99")).toBe(1999);
    expect(parseAmount("1,000")).toBe(100000);
    expect(parseAmount("0.5")).toBe(50);
    expect(parseAmount("100.")).toBe(10000);
    expect(parseAmount("1.234")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("walks every value from 0.00 to 4.99 onto the exact integer", () => {
    for (let cents = 0; cents < 500; cents++) {
      const text = (cents / 100).toFixed(2);
      expect(parseAmount(text)).toBe(cents);
    }
  });

  it("matches the standard annuity formula", () => {
    // 100,000 over 12 months at 10 percent a year: 8,791.59 a month.
    const result = calculateLoan(10_000_000, 10, 12);
    expect(result.monthly).toBe(879159);
    expect(result.schedule).toHaveLength(12);
  });

  it("ends the schedule at exactly zero", () => {
    for (const [principal, rate, months] of [
      [10_000_000, 10, 12],
      [55_000_000, 7.35, 240],
      [123_456, 19.99, 37],
      [1, 5, 3],
    ] as const) {
      const result = calculateLoan(principal, rate, months);
      const last = result.schedule[result.schedule.length - 1];
      expect(last.balance).toBe(0);
      // Every cent of the principal is accounted for across the rows.
      const principalPaid = result.schedule.reduce((sum, row) => sum + row.principal, 0);
      expect(principalPaid).toBe(principal);
    }
  });

  it("keeps the totals consistent with the rows", () => {
    const result = calculateLoan(55_000_000, 7.35, 240);
    const paid = result.schedule.reduce((sum, row) => sum + row.payment, 0);
    const interest = result.schedule.reduce((sum, row) => sum + row.interest, 0);
    expect(result.totalPaid).toBe(paid);
    expect(result.totalInterest).toBe(interest);
    expect(result.totalPaid).toBe(55_000_000 + result.totalInterest);
  });

  it("handles a zero rate without dividing by zero", () => {
    const result = calculateLoan(1_200_000, 0, 12);
    expect(result.monthly).toBe(100_000);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(1_200_000);
  });

  it("charges more interest over a longer term", () => {
    const short = calculateLoan(10_000_000, 8, 60);
    const long = calculateLoan(10_000_000, 8, 240);
    expect(long.totalInterest).toBeGreaterThan(short.totalInterest);
    expect(long.monthly).toBeLessThan(short.monthly);
  });

  it("has interest falling and principal rising down the schedule", () => {
    const result = calculateLoan(10_000_000, 10, 12);
    for (let i = 1; i < result.schedule.length; i++) {
      expect(result.schedule[i].interest).toBeLessThanOrEqual(result.schedule[i - 1].interest);
    }
  });

  it("refuses terms and rates that are not real", () => {
    expect(parseMonths("0")).toBeNull();
    expect(parseMonths("601")).toBeNull();
    expect(parseMonths("12.5")).toBeNull();
    expect(parseMonths("240")).toBe(240);
    expect(parseRate("-1")).toBeNull();
    expect(parseRate("7.35%")).toBe(7.35);
    expect(parseRate("0")).toBe(0);
  });

  it("groups money the way the locale groups it", () => {
    expect(formatMoney(10_000_000, "INR", "en-IN")).toContain("1,00,000");
    expect(formatMoney(10_000_000, "USD", "en-US")).toContain("100,000");
  });
});

describe("percentages", () => {
  it("answers X percent of Y", () => {
    const answer = percentOf(15, 200);
    expect(answer && "value" in answer && answer.value).toBe(30);
    expect(answer && "sentence" in answer && answer.sentence).toBe("15% of 200 is 30.");
  });

  it("answers X is what percent of Y", () => {
    const answer = isWhatPercentOf(30, 200);
    expect(answer && "value" in answer && answer.value).toBe(15);
    expect(answer && "sentence" in answer && answer.sentence).toBe("30 is 15% of 200.");
  });

  it("refuses a percentage of zero rather than printing infinity", () => {
    const answer = isWhatPercentOf(30, 0);
    expect(answer && "error" in answer).toBe(true);
  });

  it("answers percent change, with a direction", () => {
    const up = percentChange(40, 50);
    expect(up && "value" in up && up.value).toBe(25);
    expect(up && "sentence" in up && up.sentence).toContain("an increase of 25%");

    const down = percentChange(50, 40);
    expect(down && "value" in down && down.value).toBe(-20);
    expect(down && "sentence" in down && down.sentence).toContain("a decrease of 20%");
  });

  it("says that a change is not symmetrical, which is the whole trap", () => {
    // 40 to 50 is 25 percent up; 50 back to 40 is 20 percent down.
    const note = changeNote(40, 50);
    expect(note).toContain("20%");
    expect(note).toContain("against where it started");
  });

  it("has nothing to add when the two directions agree", () => {
    expect(changeNote(100, 100)).toBeNull();
    expect(changeNote(null, 50)).toBeNull();
  });

  it("refuses a change from zero", () => {
    const answer = percentChange(0, 50);
    expect(answer && "error" in answer).toBe(true);
  });

  it("says no change when there is none", () => {
    const answer = percentChange(50, 50);
    expect(answer && "sentence" in answer && answer.sentence).toContain("no change");
  });

  it("waits until both boxes have a number", () => {
    expect(percentOf(null, 200)).toBeNull();
    expect(percentOf(15, null)).toBeNull();
  });

  it("takes numbers the way people type them", () => {
    expect(parseNumber("1,250")).toBe(1250);
    expect(parseNumber("15%")).toBe(15);
    expect(parseNumber("-3.5")).toBe(-3.5);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });

  it("rounds without leaving trailing zeroes", () => {
    expect(tidy(33.333333)).toBe("33.3333");
    expect(tidy(30)).toBe("30");
    expect(tidy(0.1 + 0.2)).toBe("0.3");
  });
});
