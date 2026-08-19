import { describe, expect, it } from "vitest";
import {
  compressPdf,
  explodePdf,
  extractPages,
  imagesToPdf,
  mergePdfs,
  organisePages,
  pageCount,
  pageRotations,
  pageSizes,
  splitPdf,
} from "./operations";
import { makeMarkedPdf, readPageLabels, tinyPng } from "./fixtures";

describe("mergePdfs", () => {
  it("keeps every page, in the order the files were given", async () => {
    const a = await makeMarkedPdf("A", 3);
    const b = await makeMarkedPdf("B", 2);
    const merged = await mergePdfs([a.bytes, b.bytes]);

    expect(await pageCount(merged)).toBe(5);
    expect(await readPageLabels(merged)).toEqual(["A1", "A2", "A3", "B1", "B2"]);
  });

  it("respects a reordering of the inputs", async () => {
    const a = await makeMarkedPdf("A", 2);
    const b = await makeMarkedPdf("B", 1);
    expect(await readPageLabels(await mergePdfs([b.bytes, a.bytes]))).toEqual([
      "B1",
      "A1",
      "A2",
    ]);
  });

  it("merges a single file into an identical set of pages", async () => {
    const a = await makeMarkedPdf("A", 4);
    expect(await readPageLabels(await mergePdfs([a.bytes]))).toEqual(a.labels);
  });

  it("refuses an empty selection rather than producing an empty file", async () => {
    await expect(mergePdfs([])).rejects.toThrow(/nothing to merge/i);
  });
});

describe("extractPages", () => {
  it("takes exactly the pages asked for, in the order asked for", async () => {
    const doc = await makeMarkedPdf("P", 6);
    const out = await extractPages(doc.bytes, [4, 0, 2]);
    expect(await pageCount(out)).toBe(3);
    // Order preserved: people reorder by typing, and sorting it back for them
    // would silently discard what they meant.
    expect(await readPageLabels(out)).toEqual(["P5", "P1", "P3"]);
  });

  it("allows the same page twice", async () => {
    const doc = await makeMarkedPdf("P", 3);
    expect(await readPageLabels(await extractPages(doc.bytes, [1, 1]))).toEqual([
      "P2",
      "P2",
    ]);
  });

  it("refuses a page that does not exist", async () => {
    const doc = await makeMarkedPdf("P", 2);
    await expect(extractPages(doc.bytes, [5])).rejects.toThrow(/Page 6 does not exist/);
  });
});

describe("splitPdf", () => {
  it("produces one file per group, with the right pages in each", async () => {
    const doc = await makeMarkedPdf("P", 6);
    const parts = await splitPdf(doc.bytes, [
      [0, 1],
      [2, 3],
      [4, 5],
    ]);

    expect(parts).toHaveLength(3);
    expect(await readPageLabels(parts[0])).toEqual(["P1", "P2"]);
    expect(await readPageLabels(parts[1])).toEqual(["P3", "P4"]);
    expect(await readPageLabels(parts[2])).toEqual(["P5", "P6"]);
  });

  it("loses no pages across the whole split", async () => {
    const doc = await makeMarkedPdf("P", 7);
    const parts = await splitPdf(doc.bytes, [
      [0, 1, 2],
      [3, 4],
      [5, 6],
    ]);
    const all = (await Promise.all(parts.map(readPageLabels))).flat();
    expect(all).toEqual(doc.labels);
  });
});

describe("explodePdf", () => {
  it("gives one single-page file per page", async () => {
    const doc = await makeMarkedPdf("P", 4);
    const parts = await explodePdf(doc.bytes);
    expect(parts).toHaveLength(4);
    for (const part of parts) expect(await pageCount(part)).toBe(1);
    expect((await Promise.all(parts.map(readPageLabels))).flat()).toEqual(doc.labels);
  });
});

describe("organisePages", () => {
  it("reorders pages", async () => {
    const doc = await makeMarkedPdf("P", 3);
    const out = await organisePages(doc.bytes, [
      { from: 2, rotate: 0 },
      { from: 0, rotate: 0 },
      { from: 1, rotate: 0 },
    ]);
    expect(await readPageLabels(out)).toEqual(["P3", "P1", "P2"]);
  });

  it("writes the rotation into the page, not just the preview", async () => {
    const doc = await makeMarkedPdf("P", 3);
    const out = await organisePages(doc.bytes, [
      { from: 0, rotate: 90 },
      { from: 1, rotate: 180 },
      { from: 2, rotate: 0 },
    ]);
    expect(await pageRotations(out)).toEqual([90, 180, 0]);
  });

  it("adds to a rotation the page already carried", async () => {
    // A page that arrived rotated is already displayed that way, so the
    // buttons have to turn what the user can see rather than reset it.
    const doc = await makeMarkedPdf("P", 1, { rotate: 90 });
    const out = await organisePages(doc.bytes, [{ from: 0, rotate: 90 }]);
    expect(await pageRotations(out)).toEqual([180]);
  });

  it("wraps past a full turn", async () => {
    const doc = await makeMarkedPdf("P", 1, { rotate: 270 });
    const out = await organisePages(doc.bytes, [{ from: 0, rotate: 180 }]);
    expect(await pageRotations(out)).toEqual([90]);
  });

  it("drops pages left out of the plan", async () => {
    const doc = await makeMarkedPdf("P", 4);
    const out = await organisePages(doc.bytes, [
      { from: 0, rotate: 0 },
      { from: 3, rotate: 0 },
    ]);
    expect(await readPageLabels(out)).toEqual(["P1", "P4"]);
  });
});

describe("imagesToPdf", () => {
  const png = () => ({ bytes: tinyPng(), type: "image/png" as const });

  it("gives one page per image", async () => {
    const out = await imagesToPdf([png(), png(), png()], "a4");
    expect(await pageCount(out)).toBe(3);
  });

  it("lays pages out at A4 and Letter in points", async () => {
    expect(await pageSizes(await imagesToPdf([png()], "a4"))).toEqual([
      { width: 595, height: 842 },
    ]);
    expect(await pageSizes(await imagesToPdf([png()], "letter"))).toEqual([
      { width: 612, height: 792 },
    ]);
  });

  it("fits the page to the image when asked", async () => {
    // The fixture is 2x2, so the page should be too.
    expect(await pageSizes(await imagesToPdf([png()], "fit"))).toEqual([
      { width: 2, height: 2 },
    ]);
  });

  it("produces a file a strict reader can open", async () => {
    const out = await imagesToPdf([png()], "a4");
    expect(String.fromCharCode(...out.slice(0, 5))).toBe("%PDF-");
    // Reloading it through pdf-lib is the parse check.
    expect(await pageCount(out)).toBe(1);
  });

  it("refuses an empty set", async () => {
    await expect(imagesToPdf([], "a4")).rejects.toThrow(/no images/i);
  });
});

describe("compressPdf", () => {
  // The image re-encoding needs OffscreenCanvas, which Node does not have, so
  // what is checked here is the property that matters when it is missing: the
  // file that comes back is still a complete, openable document with every page
  // in it. A compressor that quietly loses a page is worse than one that saves
  // nothing.
  it("returns a whole document even when it cannot re-encode anything", async () => {
    const doc = await makeMarkedPdf("P", 4);
    const result = await compressPdf(doc.bytes, "email");

    expect(String.fromCharCode(...result.bytes.slice(0, 5))).toBe("%PDF-");
    expect(await readPageLabels(result.bytes)).toEqual(doc.labels);
    expect(result.imagesRecompressed).toBe(0);
  });

  it("says why nothing was compressed rather than implying it tried", async () => {
    const doc = await makeMarkedPdf("P", 2);
    const result = await compressPdf(doc.bytes, "smallest");
    expect(result.note).toBeTruthy();
  });
});
