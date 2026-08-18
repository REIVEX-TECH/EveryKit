/**
 * LetterDoc to PDF, in the browser.
 *
 * pdf-lib rather than a React renderer: a formal letter is one column of
 * left-aligned text in one face, so the only hard part is line wrapping, and
 * doing that by hand costs a few dozen lines against several hundred kilobytes
 * of dependency on the landing page.
 *
 * Helvetica is used rather than IBM Plex Sans. It is one of the fourteen fonts
 * every PDF reader has built in, so nothing is embedded and nothing is fetched;
 * embedding Plex would mean shipping a font file to produce a document that
 * looks near-identical at letter sizes. The page keeps Plex on screen.
 */

import type { LetterDoc } from "@/lib/letter/types";

/** A4 in PDF points, and 25mm margins in the same unit. */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = (25 / 25.4) * 72;

const BODY_SIZE = 11;
const LINE_HEIGHT = 15.5;
const PARAGRAPH_GAP = 9;
const BLOCK_GAP = 16;

/**
 * Standard-font PDFs are encoded in WinAnsi, which has no em dash, no curly
 * quotes and no ellipsis. pdf-lib drops what it cannot encode rather than
 * failing, so a subject line reading "Appeal against refusal - standard visitor
 * visa" silently became "Appeal against refusal  standard visitor visa" with a
 * hole in it. The letters are written with real typography, so the substitution
 * happens here, at the one boundary that cannot carry it.
 */
function toWinAnsi(text: string): string {
  return text
    .replace(/[—–]/g, "-")
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[•]/g, "-");
}

export async function renderPdf(doc: LetterDoc): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);

  const usableWidth = PAGE_WIDTH - MARGIN * 2;

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // Measured on the substituted text, or the wrap would be computed for
  // characters that are not the ones drawn.
  const widthOf = (text: string, font: typeof regular, size: number) =>
    font.widthOfTextAtSize(toWinAnsi(text), size);

  /** Start a new page when the next line would cross the bottom margin. */
  function ensureRoom(needed: number) {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function draw(text: string, x: number, font: typeof regular, size: number) {
    page.drawText(toWinAnsi(text), { x, y, size, font, color: black });
  }

  /** Greedy wrap. A single word longer than the line is left to overhang. */
  function wrap(text: string, font: typeof regular, size: number, width: number): string[] {
    const words = toWinAnsi(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line === "" ? word : `${line} ${word}`;
      if (widthOf(candidate, font, size) <= width) {
        line = candidate;
      } else {
        if (line !== "") lines.push(line);
        line = word;
      }
    }
    if (line !== "") lines.push(line);
    return lines.length > 0 ? lines : [""];
  }

  function writeLines(lines: string[], font = regular, size = BODY_SIZE, rightAlign = false) {
    for (const line of lines) {
      ensureRoom(LINE_HEIGHT);
      const x = rightAlign
        ? PAGE_WIDTH - MARGIN - widthOf(line, font, size)
        : MARGIN;
      draw(line, x, font, size);
      y -= LINE_HEIGHT;
    }
  }

  function writeParagraph(text: string, font = regular, size = BODY_SIZE) {
    writeLines(wrap(text, font, size, usableWidth), font, size);
  }

  // Sender block, right-aligned — the convention on a formal letter.
  if (doc.sender.length > 0) {
    writeLines(doc.sender, regular, BODY_SIZE, true);
    y -= BLOCK_GAP;
  }

  if (doc.recipient.length > 0) {
    writeLines(doc.recipient);
    y -= BLOCK_GAP;
  }

  if (doc.date) {
    writeLines([doc.date]);
    y -= BLOCK_GAP;
  }

  if (doc.subject) {
    writeParagraph(doc.subject, bold);
    y -= BLOCK_GAP;
  }

  writeLines([`${doc.salutation},`]);
  y -= PARAGRAPH_GAP;

  for (const para of doc.body) {
    writeParagraph(para);
    y -= PARAGRAPH_GAP;
  }

  y -= BLOCK_GAP - PARAGRAPH_GAP;
  writeLines([`${doc.valediction},`]);
  // Room for a real signature between the valediction and the typed name.
  y -= LINE_HEIGHT * 2;
  writeLines(doc.signOff);

  if (doc.enclosures && doc.enclosures.length > 0) {
    y -= BLOCK_GAP;
    writeLines(["Enclosed:"], bold);
    for (const item of doc.enclosures) {
      writeLines(wrap(`- ${item}`, regular, BODY_SIZE, usableWidth));
    }
  }

  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}
