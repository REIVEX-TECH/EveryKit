/**
 * The invoice as an A4 PDF.
 *
 * One template, laid out properly, rather than a gallery of half-finished ones.
 * pdf-lib is loaded through a dynamic import so the page carries it only when
 * someone actually downloads.
 */

import { formatAmount, formatMoney, getCurrency } from "./money";
import { billableLines, DOC_TYPES, totalsFor, type Invoice } from "./invoice";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
/** 20mm margins, in points. */
const MARGIN = (20 / 25.4) * 72;

const TITLE_SIZE = 22;
const BODY_SIZE = 10;
const SMALL_SIZE = 9;
const LINE_HEIGHT = 14;

/**
 * Standard-font PDFs are encoded in WinAnsi, which has no em dash, no curly
 * quotes and no ellipsis. pdf-lib drops what it cannot encode rather than
 * failing, so text silently arrives with holes in it. The same substitution the
 * Letters kit learned to do, at the same boundary.
 *
 * The rupee sign is the addition here: it is outside WinAnsi entirely, so an
 * Indian invoice would lose its currency symbol from every figure on the page.
 * "Rs" is not the symbol, but it is unambiguous and it survives.
 */
export function toWinAnsi(text: string): string {
  return text
    .replace(/[—–]/g, "-")
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[•]/g, "-")
    .replace(/₹/g, "Rs")
    .replace(/[₨]/g, "Rs");
}

export async function renderInvoicePdf(invoice: Invoice): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const currency = getCurrency(invoice.currencyCode);
  const totals = totalsFor(invoice);
  const lines = billableLines(invoice);

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.09, 0.09, 0.09);
  const muted = rgb(0.35, 0.35, 0.35);
  const rule = rgb(0.85, 0.88, 0.92);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const right = PAGE_WIDTH - MARGIN;
  let y = PAGE_HEIGHT - MARGIN;

  const widthOf = (text: string, font: typeof regular, size: number) =>
    font.widthOfTextAtSize(toWinAnsi(text), size);

  const draw = (
    text: string,
    x: number,
    at: number,
    options: { size?: number; font?: typeof regular; color?: typeof ink } = {},
  ) => {
    const size = options.size ?? BODY_SIZE;
    page.drawText(toWinAnsi(text), {
      x,
      y: at,
      size,
      font: options.font ?? regular,
      color: options.color ?? ink,
    });
  };

  /** Right-aligned, which every money column on an invoice has to be. */
  const drawRight = (
    text: string,
    edge: number,
    at: number,
    options: { size?: number; font?: typeof regular; color?: typeof ink } = {},
  ) => {
    const size = options.size ?? BODY_SIZE;
    const font = options.font ?? regular;
    draw(text, edge - widthOf(text, font, size), at, { ...options, size, font });
  };

  const wrap = (text: string, font: typeof regular, size: number, maxWidth: number) => {
    const out: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      const words = toWinAnsi(paragraph).split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        out.push("");
        continue;
      }
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
        else {
          if (current) out.push(current);
          current = word;
        }
      }
      if (current) out.push(current);
    }
    return out;
  };

  const newPageIfNeeded = (needed: number) => {
    if (y - needed > MARGIN) return;
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  // --- Header -------------------------------------------------------------
  let headerBottom = y;
  if (invoice.logoDataUrl) {
    try {
      const isPng = invoice.logoDataUrl.startsWith("data:image/png");
      const base64 = invoice.logoDataUrl.split(",")[1] ?? "";
      const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const image = isPng ? await pdf.embedPng(binary) : await pdf.embedJpg(binary);
      const maxWidth = 150;
      const maxHeight = 60;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = image.width * scale;
      const height = image.height * scale;
      page.drawImage(image, { x: MARGIN, y: y - height, width, height });
      headerBottom = y - height;
    } catch {
      // A logo that cannot be embedded is not worth failing the invoice for.
    }
  }

  const config = DOC_TYPES[invoice.docType];
  drawRight(config.title.toUpperCase(), right, y - TITLE_SIZE + 4, { size: TITLE_SIZE, font: bold });
  let metaY = y - TITLE_SIZE - 8;
  const meta: Array<[string, string]> = [];
  if (invoice.number.trim()) meta.push([config.numberLabel, invoice.number.trim()]);
  if (invoice.issued.trim()) meta.push(["Issued", invoice.issued.trim()]);
  if (invoice.due.trim()) meta.push([config.dateLabel, invoice.due.trim()]);
  for (const [label, value] of meta) {
    drawRight(`${label}: ${value}`, right, metaY, { size: SMALL_SIZE, color: muted });
    metaY -= 12;
  }

  y = Math.min(headerBottom, metaY) - 16;

  // --- Parties ------------------------------------------------------------
  const columnWidth = (PAGE_WIDTH - MARGIN * 2 - 24) / 2;
  const partyTop = y;
  let leftY = partyTop;
  let rightY = partyTop;

  const drawParty = (
    title: string,
    party: { name: string; details: string },
    x: number,
    startY: number,
  ) => {
    let at = startY;
    draw(title, x, at, { size: SMALL_SIZE, font: bold, color: muted });
    at -= 14;
    if (party.name.trim()) {
      draw(party.name.trim(), x, at, { size: BODY_SIZE + 1, font: bold });
      at -= LINE_HEIGHT;
    }
    for (const row of wrap(party.details, regular, BODY_SIZE, columnWidth)) {
      draw(row, x, at, { color: muted });
      at -= LINE_HEIGHT - 2;
    }
    return at;
  };

  leftY = drawParty("FROM", invoice.seller, MARGIN, partyTop);
  rightY = drawParty("BILL TO", invoice.buyer, MARGIN + columnWidth + 24, partyTop);
  y = Math.min(leftY, rightY) - 18;

  // --- Table --------------------------------------------------------------
  const qtyRight = right - 210;
  const priceRight = right - 105;
  const amountRight = right;
  const descriptionWidth = qtyRight - MARGIN - 60;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: right, y },
    thickness: 1,
    color: rule,
  });
  y -= 14;

  draw("DESCRIPTION", MARGIN, y, { size: SMALL_SIZE, font: bold, color: muted });
  drawRight("QTY", qtyRight, y, { size: SMALL_SIZE, font: bold, color: muted });
  drawRight("UNIT PRICE", priceRight, y, { size: SMALL_SIZE, font: bold, color: muted });
  drawRight("AMOUNT", amountRight, y, { size: SMALL_SIZE, font: bold, color: muted });
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 1, color: rule });
  y -= 16;

  lines.forEach((line, index) => {
    const rows = wrap(line.description || " ", regular, BODY_SIZE, descriptionWidth);
    newPageIfNeeded(rows.length * LINE_HEIGHT + 20);

    const top = y;
    rows.forEach((row, rowIndex) => {
      draw(row, MARGIN, top - rowIndex * LINE_HEIGHT);
    });
    drawRight(String(line.quantity), qtyRight, top);
    drawRight(formatAmount(line.unitPriceMinor, currency), priceRight, top);
    drawRight(formatAmount(totals.lineTotals[index], currency), amountRight, top);

    y = top - rows.length * LINE_HEIGHT - 6;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: right, y: y + 4 }, thickness: 0.5, color: rule });
    y -= 6;
  });

  // --- Totals -------------------------------------------------------------
  newPageIfNeeded(110);
  y -= 6;
  const totalsLeft = right - 220;

  const totalRow = (label: string, value: string, options: { strong?: boolean } = {}) => {
    const font = options.strong ? bold : regular;
    const size = options.strong ? BODY_SIZE + 2 : BODY_SIZE;
    draw(label, totalsLeft, y, { font, size, color: options.strong ? ink : muted });
    drawRight(value, right, y, { font, size });
    y -= options.strong ? 20 : LINE_HEIGHT + 2;
  };

  totalRow("Subtotal", formatMoney(totals.subtotalMinor, currency));
  if (totals.discountMinor > 0) {
    totalRow("Discount", `-${formatMoney(totals.discountMinor, currency)}`);
  }
  if (invoice.taxPercent > 0) {
    totalRow(
      `${invoice.taxLabel || "Tax"} ${invoice.taxPercent}%`,
      formatMoney(totals.taxMinor, currency),
    );
  }
  page.drawLine({
    start: { x: totalsLeft, y: y + 8 },
    end: { x: right, y: y + 8 },
    thickness: 1,
    color: rule,
  });
  y -= 6;
  totalRow("Total", formatMoney(totals.totalMinor, currency), { strong: true });

  // --- Notes --------------------------------------------------------------
  if (invoice.notes.trim()) {
    const rows = wrap(invoice.notes, regular, SMALL_SIZE, PAGE_WIDTH - MARGIN * 2);
    newPageIfNeeded(rows.length * 12 + 30);
    y -= 16;
    draw("NOTES", MARGIN, y, { size: SMALL_SIZE, font: bold, color: muted });
    y -= 14;
    for (const row of rows) {
      draw(row, MARGIN, y, { size: SMALL_SIZE, color: muted });
      y -= 12;
    }
  }

  // A receipt says how it was paid, and carries a PAID stamp near the total.
  if (invoice.docType === "receipt") {
    if (invoice.paymentMethod.trim()) {
      newPageIfNeeded(26);
      y -= 16;
      draw("PAID BY", MARGIN, y, { size: SMALL_SIZE, font: bold, color: muted });
      y -= 14;
      draw(invoice.paymentMethod.trim(), MARGIN, y, { size: SMALL_SIZE, color: muted });
      y -= 12;
    }
    if (config.stamp) {
      // Drawn in the top-right corner, under the heading, so it reads at a
      // glance without colliding with the totals.
      draw(config.stamp, right - widthOf(config.stamp, bold, SMALL_SIZE + 4), headerBottom + 6, {
        size: SMALL_SIZE + 4,
        font: bold,
        color: muted,
      });
    }
  }

  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}
