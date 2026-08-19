"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Copy, Download, Plus, X } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import {
  CURRENCIES,
  formatMoney,
  getCurrency,
  parseAmount,
  type Discount,
} from "@/lib/invoice/money";
import {
  emptyInvoice,
  pdfFilename,
  summaryText,
  totalsFor,
  type Invoice,
} from "@/lib/invoice/invoice";
import { renderInvoicePdf } from "@/lib/invoice/pdf";
import { Preview } from "./Preview";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function Workbench({ today }: { today: string }) {
  const [invoice, setInvoice] = useState<Invoice>(() => emptyInvoice(today));
  const [priceText, setPriceText] = useState<string[]>([""]);
  const [discountText, setDiscountText] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const currency = getCurrency(invoice.currencyCode);
  const totals = useMemo(() => totalsFor(invoice), [invoice]);

  const set = <K extends keyof Invoice>(key: K, value: Invoice[K]) =>
    setInvoice((current) => ({ ...current, [key]: value }));

  function setLine(index: number, patch: Partial<Invoice["lines"][number]>) {
    setInvoice((current) => ({
      ...current,
      lines: current.lines.map((line, at) => (at === index ? { ...line, ...patch } : line)),
    }));
  }

  function addLine() {
    setInvoice((current) => ({
      ...current,
      lines: [...current.lines, { description: "", quantity: 1, unitPriceMinor: 0 }],
    }));
    setPriceText((current) => [...current, ""]);
  }

  function removeLine(index: number) {
    setInvoice((current) => ({
      ...current,
      lines: current.lines.filter((_, at) => at !== index),
    }));
    setPriceText((current) => current.filter((_, at) => at !== index));
  }

  /**
   * Prices are held as typed text as well as parsed minor units, so a
   * half-finished "12." is not rewritten under the cursor while someone is
   * still typing the pence.
   */
  function onPrice(index: number, text: string) {
    setPriceText((current) => current.map((value, at) => (at === index ? text : value)));
    const minor = parseAmount(text, currency);
    if (minor !== null) setLine(index, { unitPriceMinor: minor });
  }

  function onDiscountAmount(text: string) {
    setDiscountText(text);
    const minor = parseAmount(text, currency);
    if (minor !== null) set("discount", { kind: "amount", amountMinor: minor });
  }

  function onLogo(file: File) {
    if (file.size > MAX_LOGO_BYTES) {
      setError("That logo is over 2 MB. A smaller one keeps the PDF small.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    // Read to a data URL and keep it in memory. It goes into the PDF on this
    // device and is never sent anywhere.
    reader.onload = () => set("logoDataUrl", String(reader.result));
    reader.readAsDataURL(file);
  }

  const take = useCallback((action: () => void) => {
    if (hasGivenEmail()) {
      action();
      return;
    }
    setGateFor(() => action);
  }, []);

  async function savePdf() {
    setBusy(true);
    setError(null);
    try {
      const blob = await renderInvoicePdf(invoice);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfFilename(invoice);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError("The PDF could not be written. Try removing the logo and downloading again.");
    } finally {
      setBusy(false);
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText(invoice));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("The clipboard was not available. Select the totals and copy them by hand.");
    }
  }

  const discountKind = invoice.discount.kind;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:items-start">
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="text-[18px]">Who it is from and to</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <PartyFields
              label="From"
              party={invoice.seller}
              onChange={(party) => set("seller", party)}
              idPrefix="seller"
            />
            <PartyFields
              label="Bill to"
              party={invoice.buyer}
              onChange={(party) => set("buyer", party)}
              idPrefix="buyer"
            />
          </div>
        </section>

        <section>
          <h2 className="text-[18px]">The invoice</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Field id="number" label="Invoice number" value={invoice.number} onChange={(v) => set("number", v)} />
            <Field id="issued" label="Issued" type="date" value={invoice.issued} onChange={(v) => set("issued", v)} />
            <Field id="due" label="Due" type="date" value={invoice.due} onChange={(v) => set("due", v)} />
          </div>
          <div className="mt-4">
            <label htmlFor="currency" className="block text-[14px] font-semibold">
              Currency
            </label>
            <select
              id="currency"
              value={invoice.currencyCode}
              onChange={(event) => set("currencyCode", event.target.value)}
              className="mt-2 w-full max-w-[260px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
            >
              {CURRENCIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.code}, {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h2 className="text-[18px]">What is being billed</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {invoice.lines.map((line, index) => (
              <li key={index} className="rounded-[12px] border border-line p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`desc-${index}`} className="sr-only">
                      Description for line {index + 1}
                    </label>
                    <input
                      id={`desc-${index}`}
                      type="text"
                      value={line.description}
                      onChange={(event) => setLine(index, { description: event.target.value })}
                      placeholder="What it is"
                      className="w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
                    />
                  </div>
                  {invoice.lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      aria-label={`Remove line ${index + 1}`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-light hover:bg-bg-soft hover:text-foreground"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div>
                    <label htmlFor={`qty-${index}`} className="block text-[13px] text-text-light">
                      Quantity
                    </label>
                    <input
                      id={`qty-${index}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={line.quantity}
                      onChange={(event) => setLine(index, { quantity: Number(event.target.value) || 0 })}
                      className="mt-1 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor={`price-${index}`} className="block text-[13px] text-text-light">
                      Unit price
                    </label>
                    <input
                      id={`price-${index}`}
                      type="text"
                      inputMode="decimal"
                      value={priceText[index] ?? ""}
                      onChange={(event) => onPrice(index, event.target.value)}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-[13px] text-text-light">Amount</p>
                    <p className="mt-1 py-2 text-[15px] font-semibold tabular-nums">
                      {formatMoney(totals.lineTotals[index] ?? 0, currency)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={addLine} className="ek-btn ek-btn-quiet mt-3 py-2 text-[14px]">
            <Plus size={15} aria-hidden="true" />
            Add a line
          </button>
        </section>

        <section>
          <h2 className="text-[18px]">Discount and tax</h2>
          <fieldset className="mt-3">
            <legend className="text-[14px] font-semibold">Discount</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["none", "None"],
                  ["percent", "A percentage"],
                  ["amount", "A fixed amount"],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={discountKind === kind}
                  onClick={() =>
                    set(
                      "discount",
                      kind === "none"
                        ? { kind: "none" }
                        : kind === "percent"
                          ? { kind: "percent", percent: 10 }
                          : ({ kind: "amount", amountMinor: 0 } as Discount),
                    )
                  }
                  className={[
                    "inline-flex min-h-[36px] items-center rounded-full border px-4 py-2 text-[14px] transition-colors",
                    discountKind === kind
                      ? "border-primary-dark bg-primary-dark text-white"
                      : "border-line text-text-light hover:border-line-strong hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {invoice.discount.kind === "percent" ? (
            <div className="mt-3">
              <label htmlFor="discount-percent" className="block text-[14px] font-semibold">
                Discount percent
              </label>
              <input
                id="discount-percent"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="any"
                value={invoice.discount.percent}
                onChange={(event) =>
                  set("discount", { kind: "percent", percent: Number(event.target.value) || 0 })
                }
                className="mt-2 w-[140px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
            </div>
          ) : null}

          {invoice.discount.kind === "amount" ? (
            <div className="mt-3">
              <label htmlFor="discount-amount" className="block text-[14px] font-semibold">
                Discount amount
              </label>
              <input
                id="discount-amount"
                type="text"
                inputMode="decimal"
                value={discountText}
                onChange={(event) => onDiscountAmount(event.target.value)}
                placeholder="0.00"
                className="mt-2 w-[140px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
              />
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              id="tax-label"
              label="Tax name"
              value={invoice.taxLabel}
              onChange={(v) => set("taxLabel", v)}
              placeholder="VAT, GST, Sales tax"
            />
            <div>
              <label htmlFor="tax-percent" className="block text-[14px] font-semibold">
                Tax percent
              </label>
              <input
                id="tax-percent"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={invoice.taxPercent}
                onChange={(event) => set("taxPercent", Number(event.target.value) || 0)}
                className="mt-2 w-[140px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <p className="mt-2 max-w-[60ch] text-[13px] text-text-light">
            The discount comes off before tax, which is how VAT and GST both work: tax is
            charged on what is actually paid.
          </p>
        </section>

        <section>
          <h2 className="text-[18px]">Notes and logo</h2>
          <div className="mt-3">
            <label htmlFor="notes" className="block text-[14px] font-semibold">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={invoice.notes}
              onChange={(event) => set("notes", event.target.value)}
              placeholder="Payment terms, bank details, anything else"
              className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="ek-btn ek-btn-quiet py-2 text-[14px]"
            >
              {invoice.logoDataUrl ? "Change the logo" : "Add a logo"}
            </button>
            {invoice.logoDataUrl ? (
              <button
                type="button"
                onClick={() => set("logoDataUrl", null)}
                className="inline-flex min-h-[24px] items-center text-[14px] text-text-light hover:text-primary-dark"
              >
                Remove it
              </button>
            ) : null}
            <input
              ref={logoRef}
              type="file"
              aria-label="Choose a logo from your device"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onLogo(file);
                event.target.value = "";
              }}
            />
            <p className="text-[13px] text-text-light">
              PNG or JPG. It goes into the PDF on this device and is never uploaded.
            </p>
          </div>
        </section>

        {error ? (
          <p role="alert" className="text-[14px] text-warn">
            {error}
          </p>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-6">
        <Preview invoice={invoice} />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => take(() => void savePdf())}
            disabled={busy}
            className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            {busy ? "Writing" : "Download the PDF"}
          </button>
          <button
            type="button"
            onClick={() => take(() => void copySummary())}
            className="ek-btn ek-btn-quiet"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>

        <p className="mt-3 text-[14px] text-text-light">
          Total {formatMoney(totals.totalMinor, currency)}
        </p>

        {gateFor ? (
          <EmailGate
            actionLabel="Continue"
            onDone={() => {
              gateFor();
              setGateFor(null);
            }}
            onCancel={() => setGateFor(null)}
          />
        ) : null}

        <MoreFromEveryKit />
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
      />
    </div>
  );
}

function PartyFields({
  label,
  party,
  onChange,
  idPrefix,
}: {
  label: string;
  party: { name: string; details: string };
  onChange: (party: { name: string; details: string }) => void;
  idPrefix: string;
}) {
  return (
    <div>
      <Field
        id={`${idPrefix}-name`}
        label={`${label} name`}
        value={party.name}
        onChange={(name) => onChange({ ...party, name })}
        placeholder={idPrefix === "seller" ? "Your business" : "Their business"}
      />
      <div className="mt-3">
        <label htmlFor={`${idPrefix}-details`} className="block text-[14px] font-semibold">
          {label} details
        </label>
        <textarea
          id={`${idPrefix}-details`}
          rows={3}
          value={party.details}
          onChange={(event) => onChange({ ...party, details: event.target.value })}
          placeholder={"Address\nEmail\nTax number"}
          className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
        />
      </div>
    </div>
  );
}
