import { describe, expect, it } from "vitest";
import {
  buildCountdownQuery,
  countdownSentence,
  parseCountdown,
  timeLeft,
} from "./countdown";

describe("parseCountdown", () => {
  it("reads a name and date from a query string", () => {
    expect(parseCountdown("?n=Maths%20paper&d=2027-06-01")).toEqual({
      name: "Maths paper",
      date: "2027-06-01",
    });
  });
  it("works without the leading question mark", () => {
    expect(parseCountdown("d=2027-06-01")).toEqual({ name: "", date: "2027-06-01" });
  });
  it("rejects a missing or malformed date", () => {
    expect(parseCountdown("?n=x")).toBeNull();
    expect(parseCountdown("?d=1st June")).toBeNull();
  });
  it("caps a very long name", () => {
    const long = "a".repeat(200);
    expect(parseCountdown(`?n=${long}&d=2027-06-01`)!.name).toHaveLength(80);
  });
});

describe("buildCountdownQuery round-trips through parse", () => {
  it("survives the trip with special characters intact", () => {
    const params = { name: "Physics: unit 2 & 3", date: "2027-05-14" };
    const parsed = parseCountdown(buildCountdownQuery(params));
    expect(parsed).toEqual(params);
  });
  it("omits an empty name", () => {
    expect(buildCountdownQuery({ name: "", date: "2027-05-14" })).toBe("?d=2027-05-14");
  });
});

describe("timeLeft", () => {
  it("counts to the end of the exam day", () => {
    // From the very start of the 1st, the 3rd ends about 3 days later.
    const now = new Date(2027, 5, 1, 0, 0, 0);
    const left = timeLeft("2027-06-03", now);
    expect(left.passed).toBe(false);
    expect(left.days).toBe(2); // plus the 23:59 remainder of the third day
    expect(left.hours).toBe(23);
  });
  it("reads not-passed on the exam day itself", () => {
    const now = new Date(2027, 5, 3, 9, 0, 0);
    const left = timeLeft("2027-06-03", now);
    expect(left.passed).toBe(false);
    expect(left.days).toBe(0);
  });
  it("reads passed once the day is over", () => {
    const now = new Date(2027, 5, 4, 0, 0, 1);
    expect(timeLeft("2027-06-03", now).passed).toBe(true);
  });
});

describe("countdownSentence", () => {
  it("names the exam and the time left", () => {
    expect(countdownSentence({ days: 2, hours: 3, minutes: 4, passed: false }, "Maths")).toBe(
      "2 days, 3 hours and 4 minutes until Maths.",
    );
  });
  it("singularises and drops empty units", () => {
    expect(countdownSentence({ days: 1, hours: 0, minutes: 0, passed: false }, "Maths")).toBe(
      "1 day until Maths.",
    );
    // With no days, minutes are always shown so the last hour still ticks.
    expect(countdownSentence({ days: 0, hours: 0, minutes: 0, passed: false }, "Maths")).toBe(
      "0 minutes until Maths.",
    );
  });
  it("falls back to a generic label", () => {
    expect(countdownSentence({ days: 5, hours: 0, minutes: 0, passed: false }, "")).toContain(
      "your exam",
    );
  });
  it("says it has passed", () => {
    expect(countdownSentence({ days: 0, hours: 0, minutes: 0, passed: true }, "Maths")).toMatch(
      /has passed/,
    );
  });
});
