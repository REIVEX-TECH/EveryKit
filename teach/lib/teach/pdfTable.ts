"use client";

import { pdfBlob } from "./download";

/**
 * pdf-lib's standard fonts encode Latin text only. Anything outside that (CJK,
 * Arabic, emoji) would throw, so it is replaced with a question mark rather than
 * crashing the export. A name in those scripts still exports; it just is not
 * drawn faithfully, which is a limitation of the built-in fonts, not the data.
 */
function safe(text: string): string {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

/**
 * A simple, paginated table PDF: a title, a few subtitle lines, a header row and
 * data rows. Enough for the curve and gradebook exports; each other tool draws
 * its own layout. Returns a ready-to-save Blob.
 */
export async function tablePdf(opts: {
  title: string;
  subtitle?: string[];
  headers: string[];
  rows: Array<Array<string | number>>;
  landscape?: boolean;
}): Promise<Blob> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const [pw, ph] = opts.landscape ? [842, 595] : [595, 842];
  const margin = 42;
  const colW = (pw - 2 * margin) / opts.headers.length;
  const maxChars = Math.max(4, Math.floor(colW / 5.4));

  let page = pdf.addPage([pw, ph]);
  let y = ph - margin;

  page.drawText(safe(opts.title), { x: margin, y, size: 18, font: bold });
  y -= 24;
  for (const line of opts.subtitle ?? []) {
    page.drawText(safe(line), { x: margin, y, size: 10, font });
    y -= 14;
  }
  y -= 8;

  const drawHeader = () => {
    opts.headers.forEach((h, i) => {
      page.drawText(safe(String(h)).slice(0, maxChars), { x: margin + i * colW, y, size: 10, font: bold });
    });
    y -= 16;
  };
  drawHeader();

  for (const row of opts.rows) {
    if (y < margin + 18) {
      page = pdf.addPage([pw, ph]);
      y = ph - margin;
      drawHeader();
    }
    row.forEach((cell, i) => {
      page.drawText(safe(String(cell)).slice(0, maxChars), { x: margin + i * colW, y, size: 10, font });
    });
    y -= 15;
  }

  return pdfBlob(await pdf.save());
}
