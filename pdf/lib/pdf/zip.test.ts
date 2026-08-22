import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { zipNamedFiles } from "./zip";

describe("zipNamedFiles", () => {
  it("round-trips the files under the names they were given", () => {
    const zipped = zipNamedFiles([
      { name: "page-1.jpg", bytes: new Uint8Array([1, 2, 3]) },
      { name: "page-2.jpg", bytes: new Uint8Array([4, 5]) },
    ]);

    const out = unzipSync(zipped);
    expect(Object.keys(out).sort()).toEqual(["page-1.jpg", "page-2.jpg"]);
    expect(Array.from(out["page-1.jpg"])).toEqual([1, 2, 3]);
    expect(Array.from(out["page-2.jpg"])).toEqual([4, 5]);
  });

  it("refuses an empty set and a duplicate name", () => {
    expect(() => zipNamedFiles([])).toThrow(/nothing to zip/i);
    expect(() =>
      zipNamedFiles([
        { name: "a.bin", bytes: new Uint8Array([1]) },
        { name: "a.bin", bytes: new Uint8Array([2]) },
      ]),
    ).toThrow(/same name/i);
  });
});
