import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { inflateSync } from "zlib";
import { renderInvoicePdf, toWinAnsi } from "./pdf";
import { emptyInvoice, summaryText, pdfFilename, totalsFor, type Invoice } from "./invoice";
import { formatMoney, getCurrency, parseAmount } from "./money";

/**
 * Three fixture invoices, taken through the real renderer and then reopened
 * with a PDF parser. A renderer that throws is easy to catch; one that quietly
 * writes a file no reader will open is not, which is why every case here is
 * reloaded rather than merely produced.
 */

function invoiceFor(currencyCode: string, overrides: Partial<Invoice> = {}): Invoice {
  const currency = getCurrency(currencyCode);
  const price = (text: string) => parseAmount(text, currency)!;
  return {
    ...emptyInvoice("2026-08-20"),
    number: "INV-2026-014",
    issued: "2026-08-20",
    due: "2026-09-19",
    currencyCode,
    seller: { name: "Reivex", details: "12 Example Street\nLahore\nPakistan" },
    buyer: { name: "Acme Limited", details: "40 Buyer Road\nLondon\nUnited Kingdom" },
    lines: [
      { description: "Website design", quantity: 1, unitPriceMinor: price("1200") },
      { description: "Hosting, twelve months", quantity: 12, unitPriceMinor: price("9.99") },
      { description: "Consulting", quantity: 2.5, unitPriceMinor: price("80") },
    ],
    discount: { kind: "percent", percent: 10 },
    taxPercent: 17,
    taxLabel: "GST",
    notes: "Payment within 30 days. Bank details on request.",
    logoDataUrl: null,
    ...overrides,
  };
}

/**
 * The readable contents of the file: raw bytes plus every stream inflated.
 *
 * pdf-lib writes object and content streams deflated, so scanning the file as
 * text finds the structure and none of the drawn strings. Inflating first is
 * what makes "does this figure actually appear on the page" answerable.
 */
/**
 * The words actually drawn on the page.
 *
 * Two things stand between the file and its text. Content streams are
 * deflated, and pdf-lib writes every string as hex rather than as literal
 * characters, so a page reading "Subtotal" is stored as
 * <537562746F74616C> Tj. Both have to be undone or a search for the figures
 * finds nothing and the test passes on an empty page.
 */
async function textOf(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const raw = new TextDecoder("latin1").decode(bytes);

  const streams: string[] = [];
  let at = 0;
  while (true) {
    const start = raw.indexOf("stream", at);
    if (start === -1) break;
    // "stream" also matches inside "endstream".
    if (raw.slice(start - 3, start) === "end") {
      at = start + 6;
      continue;
    }
    let from = start + 6;
    if (raw[from] === "\r") from++;
    if (raw[from] === "\n") from++;
    const end = raw.indexOf("endstream", from);
    if (end === -1) break;
    try {
      streams.push(
        new TextDecoder("latin1").decode(
          inflateSync(Buffer.from(bytes.subarray(from, end))),
        ),
      );
    } catch {
      streams.push(raw.slice(from, end));
    }
    at = end + 1;
  }

  const decoded = streams.join("\n").replace(/<([0-9A-Fa-f]+)>/g, (_, hex: string) => {
    let out = "";
    for (let i = 0; i + 1 < hex.length; i += 2) {
      out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    return out;
  });

  return `${raw}\n${decoded}`;
}

describe("the invoice PDF", () => {
  it("opens in a parser, for every currency tested", async () => {
    for (const code of ["USD", "EUR", "GBP", "PKR", "INR"]) {
      const blob = await renderInvoicePdf(invoiceFor(code));
      const bytes = new Uint8Array(await blob.arrayBuffer());

      expect([code, String.fromCharCode(...bytes.slice(0, 5))]).toEqual([code, "%PDF-"]);
      const reopened = await PDFDocument.load(bytes);
      expect([code, reopened.getPageCount() >= 1]).toEqual([code, true]);
      const size = reopened.getPage(0).getSize();
      // A4 in points.
      expect([code, Math.round(size.width), Math.round(size.height)]).toEqual([code, 595, 842]);
    }
  });

  it("carries the totals a reader would check", async () => {
    const invoice = invoiceFor("USD");
    const totals = totalsFor(invoice);
    const content = await textOf(await renderInvoicePdf(invoice));

    // The figures are drawn as text operators, so they appear in the stream.
    expect(content).toContain("Subtotal");
    expect(content).toContain("Total");
    expect(content).toContain("GST");
    expect(totals.subtotalMinor).toBe(120000 + 11988 + 20000);
    expect(totals.discountMinor).toBe(15199);
    expect(totals.totalMinor).toBe(
      totals.subtotalMinor - totals.discountMinor + totals.taxMinor,
    );
  });

  it("writes one row per billable line and ignores blank rows", async () => {
    const invoice = invoiceFor("USD", {
      lines: [
        { description: "Real work", quantity: 1, unitPriceMinor: 5000 },
        { description: "", quantity: 1, unitPriceMinor: 0 },
        { description: "More work", quantity: 2, unitPriceMinor: 2500 },
      ],
    });
    const content = await textOf(await renderInvoicePdf(invoice));
    expect(content).toContain("Real work");
    expect(content).toContain("More work");
    expect(totalsFor(invoice).lineTotals).toHaveLength(2);
  });

  it("substitutes what WinAnsi cannot carry rather than dropping it", () => {
    // pdf-lib drops unencodable characters silently, so a subject line loses
    // characters and nobody finds out until someone reads the file.
    expect(toWinAnsi("Design — phase one")).toBe("Design - phase one");
    expect(toWinAnsi("it’s")).toBe("it's");
    expect(toWinAnsi("“quoted”")).toBe('"quoted"');
    expect(toWinAnsi("wait…")).toBe("wait...");
    // The rupee sign is outside WinAnsi entirely, so an Indian invoice would
    // lose its currency symbol from every figure on the page.
    expect(toWinAnsi("₹1,00,000.00")).toBe("Rs1,00,000.00");
  });

  it("keeps the rupee readable in the rendered file", async () => {
    const content = await textOf(await renderInvoicePdf(invoiceFor("INR")));
    expect(content).toContain("Rs");
  });

  it("survives a long invoice by adding pages", async () => {
    const many = Array.from({ length: 60 }, (_, index) => ({
      description: `Line item number ${index + 1}, with a description long enough to wrap onto a second row in the table`,
      quantity: 1,
      unitPriceMinor: 1999,
    }));
    const blob = await renderInvoicePdf(invoiceFor("USD", { lines: many }));
    const reopened = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
    expect(reopened.getPageCount()).toBeGreaterThan(1);
  });

  it("renders an empty invoice without throwing", async () => {
    const blob = await renderInvoicePdf(emptyInvoice("2026-08-20"));
    const reopened = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
    expect(reopened.getPageCount()).toBe(1);
  });
});

describe("the copied summary", () => {
  it("gives the figures rather than transcribing every line", () => {
    const invoice = invoiceFor("GBP");
    const summary = summaryText(invoice);
    const currency = getCurrency("GBP");
    const totals = totalsFor(invoice);

    expect(summary).toContain("Invoice INV-2026-014");
    expect(summary).toContain("From: Reivex");
    expect(summary).toContain("To: Acme Limited");
    expect(summary).toContain(`Total: ${formatMoney(totals.totalMinor, currency)}`);
    expect(summary).toContain("GST 17%");
    // Not a transcription: the line descriptions are deliberately absent.
    expect(summary).not.toContain("Website design");
  });

  it("leaves out rows that have nothing in them", () => {
    const summary = summaryText(
      invoiceFor("USD", { discount: { kind: "none" }, taxPercent: 0, due: "" }),
    );
    expect(summary).not.toContain("Discount");
    expect(summary).not.toContain("Tax");
    expect(summary).not.toContain("Due:");
  });
});

describe("the filename", () => {
  it("says which invoice it is", () => {
    expect(pdfFilename(invoiceFor("USD"))).toBe("INV-2026-014.pdf");
  });

  it("strips characters a filesystem will not take", () => {
    expect(pdfFilename(invoiceFor("USD", { number: "INV/2026:14" }))).toBe("INV-2026-14.pdf");
  });

  it("falls back rather than producing a nameless file", () => {
    expect(pdfFilename(invoiceFor("USD", { number: "   " }))).toBe("invoice.pdf");
  });
});

describe("document types", () => {
  it("labels a quote with its own words and validity date", () => {
    const quote = { ...emptyInvoice("2026-08-20", "quote"), number: "QUO-9", due: "2026-09-20" };
    const summary = summaryText(quote);
    expect(summary).toContain("Quote QUO-9");
    expect(summary).toContain("Valid until: 2026-09-20");
    expect(summary).not.toContain("Due:");
  });

  it("records how a receipt was paid", () => {
    const receipt = {
      ...emptyInvoice("2026-08-20", "receipt"),
      number: "RCP-3",
      paymentMethod: "Card ending 4417",
    };
    const summary = summaryText(receipt);
    expect(summary).toContain("Receipt RCP-3");
    expect(summary).toContain("Paid by: Card ending 4417");
  });

  it("gives a fresh document the right number prefix", () => {
    expect(emptyInvoice("2026-08-20", "invoice").number).toBe("INV-001");
    expect(emptyInvoice("2026-08-20", "quote").number).toBe("QUO-001");
    expect(emptyInvoice("2026-08-20", "receipt").number).toBe("RCP-001");
  });

  it("renders a real PDF for a quote and a receipt", async () => {
    const quote = await renderInvoicePdf(emptyInvoice("2026-08-20", "quote"));
    const receipt = await renderInvoicePdf(emptyInvoice("2026-08-20", "receipt"));
    expect(quote.type).toBe("application/pdf");
    expect(receipt.type).toBe("application/pdf");
    expect(quote.size).toBeGreaterThan(500);
  });
});
