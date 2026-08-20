import { describe, expect, it } from "vitest";
import { matches, nextRuns, parseCron, type CronParsed } from "./cron";

function parsed(expression: string): CronParsed {
  const result = parseCron(expression);
  if (!result.ok) throw new Error(`expected ${expression} to parse: ${result.error.message}`);
  return result.parsed;
}

function description(expression: string): string {
  const result = parseCron(expression);
  if (!result.ok) throw new Error(`expected ${expression} to parse: ${result.error.message}`);
  return result.description;
}

function error(expression: string) {
  const result = parseCron(expression);
  if (result.ok) throw new Error(`expected ${expression} to fail`);
  return result.error;
}

describe("the shape of an expression", () => {
  it("wants five fields and says how many it found", () => {
    expect(error("* * * *").message).toContain("This has 4");
    expect(error("* * * * * *").message).toContain("This has 6");
    expect(error("").message).toContain("five fields");
  });

  it("does not pretend to read the @ shorthands", () => {
    // Half-supporting these is how somebody ends up trusting a wrong answer.
    const problem = error("@daily");
    expect(problem.message).toContain("@daily is 0 0 * * *");
  });

  it("is not upset by extra whitespace", () => {
    expect(parseCron("  0   9  *  *  *  ").ok).toBe(true);
  });
});

describe("plain values, ranges, lists and steps", () => {
  it("takes a single value in every field", () => {
    const p = parsed("5 4 3 2 1");
    expect(p.minutes).toEqual([5]);
    expect(p.hours).toEqual([4]);
    expect(p.daysOfMonth).toEqual([3]);
    expect(p.months).toEqual([2]);
    expect(p.daysOfWeek).toEqual([1]);
  });

  it("expands a star to the whole field", () => {
    expect(parsed("* * * * *").minutes).toHaveLength(60);
    expect(parsed("* * * * *").hours).toHaveLength(24);
    expect(parsed("* * * * *").daysOfMonth).toEqual(
      Array.from({ length: 31 }, (_, i) => i + 1),
    );
  });

  it("expands a range", () => {
    expect(parsed("10-13 * * * *").minutes).toEqual([10, 11, 12, 13]);
  });

  it("expands a list, sorted and without duplicates", () => {
    expect(parsed("30,0,15,0 * * * *").minutes).toEqual([0, 15, 30]);
  });

  it("expands a step across the whole field", () => {
    expect(parsed("*/15 * * * *").minutes).toEqual([0, 15, 30, 45]);
    expect(parsed("* */6 * * *").hours).toEqual([0, 6, 12, 18]);
  });

  it("expands a step inside a range", () => {
    expect(parsed("0-30/10 * * * *").minutes).toEqual([0, 10, 20, 30]);
  });

  it("reads a step on a single value as from there to the end", () => {
    // `5/15` is how every cron writes "from 5, then every 15".
    expect(parsed("5/15 * * * *").minutes).toEqual([5, 20, 35, 50]);
  });

  it("combines lists of ranges and steps in one field", () => {
    expect(parsed("0-4,10,20-30/5 * * * *").minutes).toEqual([0, 1, 2, 3, 4, 10, 20, 25, 30]);
  });
});

describe("names", () => {
  it("takes month names, in any case", () => {
    expect(parsed("0 0 1 JAN *").months).toEqual([1]);
    expect(parsed("0 0 1 dec *").months).toEqual([12]);
  });

  it("takes day names and ranges of them", () => {
    expect(parsed("0 9 * * MON-FRI").daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    expect(parsed("0 9 * * sat,sun").daysOfWeek).toEqual([0, 6]);
  });

  it("takes month ranges by name", () => {
    expect(parsed("0 0 1 JUN-AUG *").months).toEqual([6, 7, 8]);
  });

  it("folds 7 to Sunday rather than refusing it", () => {
    // Somebody who wrote 7 meant Sunday, and most crons agree.
    expect(parsed("0 0 * * 7").daysOfWeek).toEqual([0]);
    expect(parsed("0 0 * * 0,7").daysOfWeek).toEqual([0]);
  });

  it("does not take a name in a field that has none", () => {
    expect(error("MON * * * *").field).toBe("minute");
  });
});

describe("what it refuses, and what it says", () => {
  it("names the field that is wrong", () => {
    expect(error("60 * * * *").field).toBe("minute");
    expect(error("* 24 * * *").field).toBe("hour");
    expect(error("* * 32 * *").field).toBe("dayOfMonth");
    expect(error("* * * 13 *").field).toBe("month");
    expect(error("* * * * 8").field).toBe("dayOfWeek");
  });

  it("rejects a day of month of zero, since there is no 0th", () => {
    expect(error("* * 0 * *").field).toBe("dayOfMonth");
  });

  it("explains what the field would have accepted", () => {
    expect(error("* * * 13 *").message).toContain("1 to 12");
    expect(error("* * * 13 *").message).toContain("JAN to DEC");
  });

  it("refuses a backwards range rather than guessing at a wrap", () => {
    expect(error("* * * * FRI-MON").message).toContain("runs backwards");
  });

  it("refuses a step of zero or a step that is not a number", () => {
    expect(error("*/0 * * * *").message).toContain("above zero");
    expect(error("*/x * * * *").message).toContain("above zero");
  });

  it("refuses an empty item in a list", () => {
    expect(error("1,,2 * * * *").message).toContain("empty item");
  });

  it("refuses nonsense outright", () => {
    expect(parseCron("every day at nine").ok).toBe(false);
    expect(parseCron("hello").ok).toBe(false);
    expect(parseCron("* * * * banana").ok).toBe(false);
  });
});

describe("the sentence", () => {
  it("reads the common schedules the way a person would say them", () => {
    expect(description("* * * * *")).toBe("Every minute, every day.");
    expect(description("*/15 * * * *")).toBe("Every 15 minutes, every day.");
    expect(description("0 * * * *")).toBe("At the top of every hour, every day.");
    expect(description("30 * * * *")).toBe("At 30 minutes past every hour, every day.");
    expect(description("0 9 * * *")).toBe("At 09:00, every day.");
    expect(description("30 8 * * 1,3,5")).toBe("At 08:30, on Monday, Wednesday and Friday.");
    expect(description("0 9 * * MON-FRI")).toBe("At 09:00, Monday to Friday.");
    expect(description("0 0 1 * *")).toBe("At 00:00, on the 1st.");
    expect(description("0 0 1 1 *")).toBe("At 00:00, on the 1st, in January.");
  });

  it("uses ordinals correctly, including the teens", () => {
    expect(description("0 0 11,12,13,21,22 * *")).toContain("11th, 12th, 13th, 21st and 22nd");
  });

  it("collapses a long list of times rather than reciting it", () => {
    // Ten clock times in one sentence is a list, not an explanation.
    expect(description("0,30 0-9 * * *")).toContain("At 20 times a day");
  });

  it("says out loud that both day fields means either, not both", () => {
    const sentence = description("0 0 13 * FRI");
    expect(sentence).toContain("runs when either one matches");
    expect(description("0 0 13 * *")).not.toContain("either one matches");
  });
});

describe("the next run times", () => {
  // A fixed Wednesday, so every expectation below is checkable by hand.
  const wednesday = new Date(2026, 7, 19, 10, 30, 0);

  it("finds the next five, in order, all in the future", () => {
    const runs = nextRuns(parsed("0 * * * *"), wednesday);
    expect(runs).toHaveLength(5);
    expect(runs.map((d) => d.getHours())).toEqual([11, 12, 13, 14, 15]);
    expect(runs.every((d) => d.getTime() > wednesday.getTime())).toBe(true);
    expect(runs.every((d) => d.getMinutes() === 0)).toBe(true);
  });

  it("never returns the current minute, only later ones", () => {
    const onTheMinute = new Date(2026, 7, 19, 10, 0, 0);
    const runs = nextRuns(parsed("0 * * * *"), onTheMinute);
    expect(runs[0].getHours()).toBe(11);
  });

  it("crosses into the next day when the time has passed", () => {
    const runs = nextRuns(parsed("0 9 * * *"), wednesday, 2);
    expect(runs[0].getDate()).toBe(20);
    expect(runs[0].getHours()).toBe(9);
    expect(runs[1].getDate()).toBe(21);
  });

  it("honours a day of week", () => {
    const runs = nextRuns(parsed("0 9 * * MON"), wednesday, 3);
    expect(runs.every((d) => d.getDay() === 1)).toBe(true);
    expect(runs[0].getDate()).toBe(24);
  });

  it("honours the either rule when both day fields are set", () => {
    // The 13th of any month, or any Friday.
    const p = parsed("0 0 13 * FRI");
    expect(matches(p, new Date(2026, 7, 13, 0, 0))).toBe(true); // a 13th
    expect(matches(p, new Date(2026, 7, 21, 0, 0))).toBe(true); // a Friday
    expect(matches(p, new Date(2026, 7, 19, 0, 0))).toBe(false); // neither
  });

  it("finds 29 February without hanging or inventing one", () => {
    const runs = nextRuns(parsed("0 0 29 2 *"), new Date(2026, 0, 1, 0, 0), 2);
    expect(runs).toHaveLength(2);
    expect(runs.map((d) => d.getFullYear())).toEqual([2028, 2032]);
    expect(runs.every((d) => d.getMonth() === 1 && d.getDate() === 29)).toBe(true);
  });

  it("returns nothing rather than looping forever on a date that cannot happen", () => {
    // The 30th of February. The search gives up after four years.
    expect(nextRuns(parsed("0 0 30 2 *"), wednesday, 5)).toEqual([]);
  });

  it("handles a schedule that fires every minute", () => {
    const runs = nextRuns(parsed("* * * * *"), wednesday, 3);
    expect(runs.map((d) => d.getMinutes())).toEqual([31, 32, 33]);
  });
});
