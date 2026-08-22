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

export type DocType = "invoice" | "quote" | "receipt";

/**
 * What changes between the three documents: the heading, the two labels people
 * read, and the number prefix. They share one engine and one layout; only the
 * words move. A receipt also carries a paid stamp and a payment-method line,
 * which the renderer draws when the type is receipt.
 */
export type DocConfig = {
  title: string;
  /** Label for the number field. */
  numberLabel: string;
  /** Default prefix for a fresh document's number. */
  numberPrefix: string;
  /** Label for the second date, which means something different each time. */
  dateLabel: string;
  /** Shown on a receipt only. */
  stamp?: string;
};

export const DOC_TYPES: Record<DocType, DocConfig> = {
  invoice: { title: "Invoice", numberLabel: "Invoice number", numberPrefix: "INV-001", dateLabel: "Due" },
  quote: { title: "Quote", numberLabel: "Quote number", numberPrefix: "QUO-001", dateLabel: "Valid until" },
  receipt: { title: "Receipt", numberLabel: "Receipt number", numberPrefix: "RCP-001", dateLabel: "Paid on", stamp: "PAID" },
};

export type Invoice = {
  docType: DocType;
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
  /** Shown on a receipt: how it was paid. Ignored by the other two. */
  paymentMethod: string;
  /** A data URL for the logo, held only in memory. */
  logoDataUrl: string | null;
};

export const EMPTY_LINE: Line = { description: "", quantity: 1, unitPriceMinor: 0 };

export function emptyInvoice(today: string, docType: DocType = "invoice"): Invoice {
  return {
    docType,
    number: DOC_TYPES[docType].numberPrefix,
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
    paymentMethod: "",
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

  const config = DOC_TYPES[invoice.docType];
  const rows: string[] = [];
  rows.push(`${config.title} ${invoice.number}`.trim());
  if (invoice.seller.name.trim()) rows.push(`From: ${invoice.seller.name.trim()}`);
  if (invoice.buyer.name.trim()) rows.push(`To: ${invoice.buyer.name.trim()}`);
  if (invoice.issued.trim()) rows.push(`Issued: ${invoice.issued.trim()}`);
  if (invoice.due.trim()) rows.push(`${config.dateLabel}: ${invoice.due.trim()}`);
  if (invoice.docType === "receipt" && invoice.paymentMethod.trim()) {
    rows.push(`Paid by: ${invoice.paymentMethod.trim()}`);
  }
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
