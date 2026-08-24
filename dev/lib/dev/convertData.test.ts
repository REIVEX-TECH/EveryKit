import { describe, expect, it } from "vitest";
import { parseWorkbook, sheetNames, toOutput } from "./convertData";

describe("parseWorkbook + toOutput", () => {
  it("CSV to JSON gives one object per row", () => {
    const wb = parseWorkbook("name,age\nAda,36\nGrace,45", "csv");
    const json = toOutput(wb, "Sheet1", "json").text!;
    const rows = JSON.parse(json);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Ada");
    expect(String(rows[0].age)).toBe("36");
    expect(rows[1].name).toBe("Grace");
  });

  it("JSON to CSV gives a header row and one line per object", () => {
    const wb = parseWorkbook('[{"name":"Ada","age":36},{"name":"Grace","age":45}]', "json");
    const csv = toOutput(wb, "Sheet1", "csv").text!.trim().split(/\r?\n/);
    expect(csv[0]).toBe("name,age");
    expect(csv[1]).toBe("Ada,36");
    expect(csv[2]).toBe("Grace,45");
  });

  it("honours a chosen delimiter, both reading and writing", () => {
    const wb = parseWorkbook("name;age\nAda;36", "csv", ";");
    const rows = JSON.parse(toOutput(wb, "Sheet1", "json").text!);
    expect(rows[0].name).toBe("Ada");
    const semi = toOutput(wb, "Sheet1", "csv", ";").text!.trim().split(/\r?\n/);
    expect(semi[0]).toBe("name;age");
  });

  it("round-trips JSON through XLSX and back", () => {
    const source = '[{"name":"Ada","age":36},{"name":"Grace","age":45}]';
    const wb = parseWorkbook(source, "json");
    const out = toOutput(wb, "Sheet1", "xlsx");
    expect(out.bytes).toBeInstanceOf(Uint8Array);
    // XLSX is a zip: it starts with the PK signature.
    expect([out.bytes![0], out.bytes![1]]).toEqual([0x50, 0x4b]);

    const reread = parseWorkbook(out.bytes!, "xlsx");
    const rows = JSON.parse(toOutput(reread, reread.SheetNames[0], "json").text!);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Ada");
  });

  it("flattens a nested value to its JSON text in one cell", () => {
    const wb = parseWorkbook('[{"id":1,"meta":{"x":9}}]', "json");
    const csv = toOutput(wb, "Sheet1", "csv").text!;
    expect(csv).toContain('{""x"":9}'); // CSV-escaped JSON in the cell
  });

  it("exposes sheet names for the picker", () => {
    const wb = parseWorkbook("a,b\n1,2", "csv");
    expect(sheetNames(wb)).toEqual(["Sheet1"]);
  });

  it("rejects JSON that is not an array of rows", () => {
    expect(() => parseWorkbook('{"a":1}', "json")).toThrow(/array of rows/);
  });

  it("rejects text that is not valid JSON", () => {
    expect(() => parseWorkbook("not json", "json")).toThrow(/valid JSON/);
  });
});
