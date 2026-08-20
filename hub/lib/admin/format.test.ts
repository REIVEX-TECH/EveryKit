import { describe, expect, it } from "vitest";
import { csvRow, relativeTime } from "./format";

const NOW = Date.parse("2026-08-20T12:00:00Z");

describe("how long ago", () => {
  const ago = (iso: string) => relativeTime(iso, NOW);

  it("reads the way a person would say it", () => {
    expect(ago("2026-08-20T11:59:30Z")).toBe("just now");
    expect(ago("2026-08-20T11:58:00Z")).toBe("2 minutes ago");
    expect(ago("2026-08-20T11:00:00Z")).toBe("1 hour ago");
    expect(ago("2026-08-20T10:00:00Z")).toBe("2 hours ago");
    expect(ago("2026-08-18T12:00:00Z")).toBe("2 days ago");
    expect(ago("2026-06-20T12:00:00Z")).toBe("2 months ago");
    expect(ago("2024-08-20T12:00:00Z")).toBe("2 years ago");
  });

  it("says one thing, not one things", () => {
    expect(ago("2026-08-20T11:59:00Z")).toBe("1 minute ago");
    expect(ago("2026-08-19T12:00:00Z")).toBe("1 day ago");
  });

  it("copes with a clock that is ahead, and with rubbish", () => {
    expect(ago("2026-08-20T12:05:00Z")).toBe("just now");
    expect(ago("not a date")).toBe("unknown");
  });
});

describe("a CSV row", () => {
  it("quotes every field and doubles the quotes inside", () => {
    expect(csvRow(["a", 2, null])).toBe('"a","2",""\r\n');
    expect(csvRow(['say "hi"'])).toBe('"say ""hi"""\r\n');
    expect(csvRow(["one,two"])).toBe('"one,two"\r\n');
  });

  it("stops a spreadsheet treating a field as a formula", () => {
    // An address can start with any of these, and a spreadsheet that evaluates
    // it is a spreadsheet that runs whatever somebody typed into a form.
    expect(csvRow(["=cmd()"])).toBe("\"'=cmd()\"\r\n");
    expect(csvRow(["+1"])).toBe("\"'+1\"\r\n");
    expect(csvRow(["-3"])).toBe("\"'-3\"\r\n");
    expect(csvRow(["@sum"])).toBe("\"'@sum\"\r\n");
  });

  it("ends every row the way a CSV reader expects", () => {
    expect(csvRow(["x"]).endsWith("\r\n")).toBe(true);
  });
});
