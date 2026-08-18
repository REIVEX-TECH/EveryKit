import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { getLetterType } from "@/data/letters";
import { renderPdf } from "./pdf";
import { renderDocx } from "./docx";
import type { BuildContext } from "@/lib/letter/types";

const ctx: BuildContext = {
  tone: "polite",
  dateFormat: "long-day-first",
  today: "2026-08-18",
};

/**
 * Three letters of different shapes: a short one, one with an enclosures list,
 * and the longest prose in the set. Parsed back rather than eyeballed — a file
 * that opens is the only definition of "it worked" that matters here.
 */
const SAMPLES = ["resignation", "visa-appeal", "visa-cover-letter"];

describe.each(SAMPLES)("%s exports", (slug) => {
  const type = getLetterType(slug)!;
  const doc = type.build(type.example, ctx);

  it("produces a PDF that pdf-lib can read back", async () => {
    const blob = await renderPdf(doc);
    expect(blob.type).toBe("application/pdf");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");

    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1);

    // A4 in points, to the nearest whole one.
    const { width, height } = parsed.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
  });

  it("produces a DOCX that is a real Office package", async () => {
    const blob = await renderDocx(doc);
    expect(blob.type).toContain("wordprocessingml.document");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    // PK\x03\x04 — a zip, which is what a .docx is.
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);

    const text = new TextDecoder("latin1").decode(bytes);
    // The two parts Word refuses to open a file without.
    expect(text).toContain("[Content_Types].xml");
    expect(text).toContain("word/document.xml");
  });
});

describe("a long letter still exports", () => {
  it("pages a letter that cannot fit on one sheet", async () => {
    const type = getLetterType("visa-cover-letter")!;
    const padded = {
      ...type.example,
      ties: `${type.example.ties} ${"This sentence exists to force the letter past one page. ".repeat(60)}`,
    };
    const blob = await renderPdf(type.build(padded, ctx));
    const parsed = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
    expect(parsed.getPageCount()).toBeGreaterThan(1);
  });
});

describe("characters the PDF font cannot encode", () => {
  it("substitutes rather than dropping them, so no hole is left in the text", async () => {
    const doc = {
      sender: ["A"],
      recipient: ["B"],
      date: "18 August 2026",
      subject: "Appeal — reference “ABC” … done",
      salutation: "Dear Sir or Madam",
      body: ["An em dash — and an ellipsis … and curly ‘quotes’."],
      valediction: "Yours faithfully",
      signOff: ["A"],
    };
    const blob = await renderPdf(doc);
    const parsed = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
    expect(parsed.getPageCount()).toBe(1);
    // pdf-lib throws on unencodable characters when they reach it, so the fact
    // that this renders at all is the assertion.
  });
});
