"use client";

import { formatAmount, formatMoney, getCurrency } from "@/lib/invoice/money";
import { billableLines, DOC_TYPES, totalsFor, type Invoice } from "@/lib/invoice/invoice";

/**
 * The A4 preview.
 *
 * The greys are the same values the PDF writer uses, which keeps the preview
 * honest and also keeps them readable: #777 on white is 4.48:1, just under what
 * small text needs, and Lighthouse was right to flag it.
 *
 * Laid out in HTML at the page's real proportions rather than rendered from
 * the PDF, so it updates on every keystroke without re-running the writer. The
 * two are kept in step by reading the same totals, so a figure can never differ
 * between what is shown and what is downloaded.
 */
export function Preview({ invoice }: { invoice: Invoice }) {
  const currency = getCurrency(invoice.currencyCode);
  const totals = totalsFor(invoice);
  const lines = billableLines(invoice);

  return (
    <div
      className="ek-card mx-auto w-full overflow-hidden bg-white p-0 text-[#171717]"
      style={{ maxWidth: 595, aspectRatio: "595 / 842" }}
      aria-label="A preview of the invoice"
    >
      <div className="flex h-full flex-col p-[6%] text-[10px] leading-[1.45]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {invoice.logoDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={invoice.logoDataUrl}
                alt=""
                style={{ maxWidth: 150, maxHeight: 60, objectFit: "contain" }}
              />
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[22px] font-semibold tracking-tight">
              {DOC_TYPES[invoice.docType].title.toUpperCase()}
            </p>
            {invoice.docType === "receipt" && DOC_TYPES.receipt.stamp ? (
              <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-[#595959]">
                {DOC_TYPES.receipt.stamp}
              </p>
            ) : null}
            {invoice.number.trim() ? (
              <p className="mt-1 text-[#4a4a4a]">{DOC_TYPES[invoice.docType].numberLabel}: {invoice.number}</p>
            ) : null}
            {invoice.issued.trim() ? <p className="text-[#4a4a4a]">Issued: {invoice.issued}</p> : null}
            {invoice.due.trim() ? (
              <p className="text-[#4a4a4a]">{DOC_TYPES[invoice.docType].dateLabel}: {invoice.due}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[8px] font-semibold tracking-wide text-[#595959]">FROM</p>
            {invoice.seller.name.trim() ? (
              <p className="mt-1 font-semibold">{invoice.seller.name}</p>
            ) : null}
            <p className="whitespace-pre-line text-[#4a4a4a]">{invoice.seller.details}</p>
          </div>
          <div>
            <p className="text-[8px] font-semibold tracking-wide text-[#595959]">BILL TO</p>
            {invoice.buyer.name.trim() ? (
              <p className="mt-1 font-semibold">{invoice.buyer.name}</p>
            ) : null}
            <p className="whitespace-pre-line text-[#4a4a4a]">{invoice.buyer.details}</p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="border-y border-[#dde3ea] text-[8px] tracking-wide text-[#595959]">
              <th className="py-1.5 text-left font-semibold">DESCRIPTION</th>
              <th className="py-1.5 text-right font-semibold">QTY</th>
              <th className="py-1.5 text-right font-semibold">UNIT PRICE</th>
              <th className="py-1.5 text-right font-semibold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-b border-[#eef2f6] align-top">
                <td className="py-1.5 pr-3">{line.description}</td>
                <td className="py-1.5 text-right tabular-nums">{line.quantity}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {formatAmount(line.unitPriceMinor, currency)}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {formatAmount(totals.lineTotals[index], currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-[55%] text-[10px]">
            <Row label="Subtotal" value={formatMoney(totals.subtotalMinor, currency)} />
            {totals.discountMinor > 0 ? (
              <Row label="Discount" value={`-${formatMoney(totals.discountMinor, currency)}`} />
            ) : null}
            {invoice.taxPercent > 0 ? (
              <Row
                label={`${invoice.taxLabel || "Tax"} ${invoice.taxPercent}%`}
                value={formatMoney(totals.taxMinor, currency)}
              />
            ) : null}
            <Row
              label="Total"
              value={formatMoney(totals.totalMinor, currency)}
              strong
              rule
            />
          </dl>
        </div>

        {invoice.docType === "receipt" && invoice.paymentMethod.trim() ? (
          <div className="mt-6">
            <p className="text-[8px] font-semibold tracking-wide text-[#595959]">PAID BY</p>
            <p className="mt-1 text-[9px] text-[#4a4a4a]">{invoice.paymentMethod}</p>
          </div>
        ) : null}

        {invoice.notes.trim() ? (
          <div className="mt-auto pt-6">
            <p className="text-[8px] font-semibold tracking-wide text-[#595959]">NOTES</p>
            <p className="mt-1 whitespace-pre-line text-[9px] text-[#4a4a4a]">{invoice.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * One row of the totals block.
 *
 * The rule above the total is drawn on this element rather than on a wrapper.
 * A dl may contain div groups, but nesting one div inside another around the
 * dt and dd breaks the content model, which is what Lighthouse flagged.
 */
function Row({
  label,
  value,
  strong,
  rule,
}: {
  label: string;
  value: string;
  strong?: boolean;
  rule?: boolean;
}) {
  return (
    <div
      className={[
        "flex justify-between gap-4",
        rule ? "mt-1 border-t border-[#dde3ea] pt-1.5" : "",
        strong ? "text-[12px] font-semibold" : "text-[#4a4a4a]",
      ].join(" ")}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
