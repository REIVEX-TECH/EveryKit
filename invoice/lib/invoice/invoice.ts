/**
 * The invoice itself: what is on it, and the text summary.
 */

import {
  computeTotals,
  formatMoney,
  getCurrency,
  type Discount,
  type Line,
  type Totals,
} from "./money";

export type Party = {
  name: string;
  /** Address and anything else, free text over several lines. */
  details: string;
};

export type Invoice = {
  number: string;
  issued: string;
  due: string;
  currencyCode: string;
  seller: Party;
  buyer: Party;
  lines: Line[];
  discount: Discount;
  taxPercent: number;
  taxLabel: string;
  notes: string;
  /** A data URL for the logo, held only in memory. */
  logoDataUrl: string | null;
};

export const EMPTY_LINE: Line = { description: "", quantity: 1, unitPriceMinor: 0 };

export function emptyInvoice(today: string): Invoice {
  return {
    number: "INV-001",
    issued: today,
    due: "",
    currencyCode: "USD",
    seller: { name: "", details: "" },
    buyer: { name: "", details: "" },
    lines: [{ ...EMPTY_LINE }],
    discount: { kind: "none" },
    taxPercent: 0,
    taxLabel: "Tax",
    notes: "",
    logoDataUrl: null,
  };
}

/** Lines with something actually on them. A blank row is not billed. */
export function billableLines(invoice: Invoice): Line[] {
  return invoice.lines.filter(
    (line) => line.description.trim() !== "" || line.unitPriceMinor !== 0,
  );
}

export function totalsFor(invoice: Invoice): Totals {
  return computeTotals(billableLines(invoice), invoice.discount, invoice.taxPercent);
}

/**
 * The plain text summary, for the copy button.
 *
 * Deliberately the totals rather than the whole invoice: someone pasting this
 * into an email or a chat wants the figures, and a full transcription of every
 * line is not readable in that context.
 */
export function summaryText(invoice: Invoice): string {
  const currency = getCurrency(invoice.currencyCode);
  const totals = totalsFor(invoice);
  const money = (minor: number) => formatMoney(minor, currency);

  const rows: string[] = [];
  rows.push(`Invoice ${invoice.number}`.trim());
  if (invoice.seller.name.trim()) rows.push(`From: ${invoice.seller.name.trim()}`);
  if (invoice.buyer.name.trim()) rows.push(`To: ${invoice.buyer.name.trim()}`);
  if (invoice.issued.trim()) rows.push(`Issued: ${invoice.issued.trim()}`);
  if (invoice.due.trim()) rows.push(`Due: ${invoice.due.trim()}`);
  rows.push("");
  rows.push(`Subtotal: ${money(totals.subtotalMinor)}`);
  if (totals.discountMinor > 0) rows.push(`Discount: -${money(totals.discountMinor)}`);
  if (invoice.taxPercent > 0) {
    rows.push(`${invoice.taxLabel || "Tax"} ${invoice.taxPercent}%: ${money(totals.taxMinor)}`);
  }
  rows.push(`Total: ${money(totals.totalMinor)}`);
  return rows.join("\n");
}

/** A filename that says which invoice it is. */
export function pdfFilename(invoice: Invoice): string {
  const number = invoice.number.trim().replace(/[\\/:*?"<>|]/g, "-") || "invoice";
  return `${number}.pdf`;
}
