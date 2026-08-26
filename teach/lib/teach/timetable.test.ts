import { describe, expect, it } from "vitest";
import {
  blockPosition,
  decodeSchedule,
  encodeSchedule,
  formatTime,
  isValidBlock,
  parseTime,
  scheduleFromQuery,
  scheduleQuery,
  timeRange,
  type ClassBlock,
} from "./timetable";

const blocks: ClassBlock[] = [
  { id: "b0", day: 0, start: 540, end: 600, name: "Maths", location: "Room 2", color: "#1d81f2" },
  { id: "b1", day: 2, start: 780, end: 870, name: "Physics", location: "Lab 1", color: "#0d9488" },
];

describe("time parsing", () => {
  it("parses and formats times", () => {
    expect(parseTime("09:00")).toBe(540);
    expect(parseTime("14:30")).toBe(870);
    expect(formatTime(540)).toBe("9:00");
    expect(formatTime(870)).toBe("14:30");
  });

  it("rejects nonsense times", () => {
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime("nope")).toBeNull();
    expect(parseTime("9:60")).toBeNull();
  });
});

describe("validation", () => {
  it("needs a name and an end after the start", () => {
    expect(isValidBlock({ name: "x", day: 0, start: 100, end: 200 })).toBe(true);
    expect(isValidBlock({ name: "", day: 0, start: 100, end: 200 })).toBe(false);
    expect(isValidBlock({ name: "x", day: 0, start: 200, end: 100 })).toBe(false);
  });
});

describe("layout", () => {
  it("derives the hour range from the blocks", () => {
    expect(timeRange(blocks)).toEqual({ startHour: 9, endHour: 15 });
    expect(timeRange([])).toEqual({ startHour: 8, endHour: 18 });
  });

  it("positions a block as a fraction of the grid", () => {
    const range = { startHour: 9, endHour: 15 }; // 360 minutes tall
    const pos = blockPosition(blocks[0], range); // 9:00-10:00
    expect(pos.top).toBeCloseTo(0, 6);
    expect(pos.height).toBeCloseTo(60 / 360, 6);
  });
});

describe("schedule encode/decode", () => {
  it("round-trips a schedule through the URL, regenerating ids", () => {
    const decoded = decodeSchedule(encodeSchedule(blocks));
    expect(decoded).toHaveLength(2);
    expect(decoded[0]).toMatchObject({ day: 0, start: 540, end: 600, name: "Maths", location: "Room 2" });
    expect(decoded[1]).toMatchObject({ day: 2, name: "Physics" });
  });

  it("round-trips through a full query string", () => {
    const query = scheduleQuery(blocks);
    expect(query.startsWith("?s=")).toBe(true);
    expect(scheduleFromQuery(query)).toHaveLength(2);
  });

  it("gives an empty query for an empty or all-invalid schedule", () => {
    expect(scheduleQuery([])).toBe("");
    expect(decodeSchedule("garbage!!")).toEqual([]);
  });
});
