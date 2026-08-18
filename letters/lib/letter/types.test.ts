import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addressing,
  compact,
  formatDate,
  has,
  list,
  nightsBetween,
  paragraph,
  plural,
  sentence,
} from "./types";

describe("compact", () => {
  it("drops empty, whitespace-only and missing entries", () => {
    expect(compact(["a", "", "  ", null, undefined, false, "b"])).toEqual(["a", "b"]);
  });
});

describe("sentence", () => {
  it("joins the parts that exist and closes with a full stop", () => {
    expect(sentence("I am Sana", "and I live in Manchester")).toBe(
      "I am Sana and I live in Manchester.",
    );
  });

  it("returns nothing at all when every part is missing", () => {
    // This is what stops an unanswered optional field leaving a bare full stop.
    expect(sentence(undefined, "", false)).toBe("");
  });

  it("does not double up punctuation", () => {
    expect(sentence("Is that right?")).toBe("Is that right?");
    expect(sentence("It is settled.")).toBe("It is settled.");
  });

  it("collapses the gaps left by a dropped fragment", () => {
    expect(sentence("The visit runs from Monday", "", "to Friday")).toBe(
      "The visit runs from Monday to Friday.",
    );
  });
});

describe("paragraph", () => {
  it("skips sentences that did not apply", () => {
    expect(paragraph("One.", "", "Two.")).toBe("One. Two.");
  });

  it("is empty when nothing applied, so the paragraph can be dropped whole", () => {
    expect(paragraph("", false, null)).toBe("");
  });
});

describe("list", () => {
  it("reads as a person would write it", () => {
    expect(list(["tuition"])).toBe("tuition");
    expect(list(["tuition", "rent"])).toBe("tuition and rent");
    expect(list(["tuition", "rent", "food"])).toBe("tuition, rent and food");
  });

  it("ignores blanks rather than leaving stray commas", () => {
    expect(list(["tuition", "", "food"])).toBe("tuition and food");
  });
});

describe("addressing", () => {
  it("pairs an unnamed recipient with Yours faithfully", () => {
    expect(addressing(undefined)).toEqual({
      salutation: "Dear Sir or Madam",
      valediction: "Yours faithfully",
    });
    expect(addressing("   ")).toEqual({
      salutation: "Dear Sir or Madam",
      valediction: "Yours faithfully",
    });
  });

  it("pairs a named recipient with Yours sincerely", () => {
    expect(addressing("Mr Adeyemi")).toEqual({
      salutation: "Dear Mr Adeyemi",
      valediction: "Yours sincerely",
    });
  });
});

describe("formatDate", () => {
  it("defaults to day-first long form", () => {
    expect(formatDate("2026-08-17")).toBe("17 August 2026");
  });

  it("supports the other two formats", () => {
    expect(formatDate("2026-08-17", "long-month-first")).toBe("August 17, 2026");
    expect(formatDate("2026-08-17", "iso")).toBe("2026-08-17");
  });

  it("returns nothing for a missing or malformed date", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("not a date")).toBe("");
    expect(formatDate("2026-13-01")).toBe("");
  });

  it("does not shift the day across timezones", () => {
    // A naive new Date("2026-01-01") is midnight UTC, which is the previous day
    // west of Greenwich. Letters dated a day early look careless.
    expect(formatDate("2026-01-01")).toBe("1 January 2026");
    expect(formatDate("2026-12-31")).toBe("31 December 2026");
  });
});

describe("addDays and addMonths", () => {
  it("adds days across a month boundary", () => {
    expect(addDays("2026-08-30", 5)).toBe("2026-09-04");
  });

  it("adds whole months", () => {
    expect(addMonths("2026-08-17", 1)).toBe("2026-09-17");
    expect(addMonths("2026-08-17", 3)).toBe("2026-11-17");
  });

  it("clamps to the end of a shorter month", () => {
    // One month's notice given on 31 January ends 28 February, not 3 March.
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
  });

  it("returns nothing for an unusable date", () => {
    expect(addDays("", 5)).toBe("");
    expect(addMonths("nope", 1)).toBe("");
  });
});

describe("nightsBetween", () => {
  it("counts nights, not days", () => {
    expect(nightsBetween("2026-11-04", "2026-11-25")).toBe(21);
    expect(nightsBetween("2026-11-04", "2026-11-05")).toBe(1);
  });

  it("returns null when the dates are missing or the wrong way round", () => {
    expect(nightsBetween("2026-11-04", "2026-11-04")).toBeNull();
    expect(nightsBetween("2026-11-25", "2026-11-04")).toBeNull();
    expect(nightsBetween("", "2026-11-04")).toBeNull();
  });
});

describe("plural", () => {
  it("does not write '1 nights'", () => {
    expect(plural(1, "night")).toBe("1 night");
    expect(plural(3, "night")).toBe("3 nights");
  });
});

describe("has", () => {
  it("treats whitespace as unanswered", () => {
    expect(has("x")).toBe(true);
    expect(has("")).toBe(false);
    expect(has("   ")).toBe(false);
    expect(has(undefined)).toBe(false);
  });
});
