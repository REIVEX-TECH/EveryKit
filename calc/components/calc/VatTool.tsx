"use client";

import { useMemo, useState } from "react";
import { CURRENCIES, formatMoney, parseAmount } from "@/lib/calc/emi";
import { applyVat, parsePercent, type VatDirection } from "@/lib/calc/money";
import { CopyButton, Field, Input, Note, Select } from "./ui";

/**
 * Add VAT or GST to a net price, or pull it back out of a gross one. Both
 * directions, because extracting the tax from a tax-inclusive price is the half
 * people reliably get wrong: the tax in a gross figure is not the rate times
 * the gross.
 */
export function VatTool() {
  const [direction, setDirection] = useState<VatDirection>("add");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("20");
  const [currency, setCurrency] = useState("USD");

  const locale = CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US";
  const money = (minor: number) => formatMoney(minor, currency, locale);

  const amountMinor = parseAmount(amount);
  const ratePct = parsePercent(rate);

  const result = useMemo(() => {
    if (amountMinor === null || ratePct === null) return null;
    return applyVat(direction, { amountMinor, rate: ratePct });
  }, [direction, amountMinor, ratePct]);

  const sentence = result
    ? `Net ${money(result.netMinor)}, tax ${money(result.taxMinor)} at ${ratePct}%, gross ${money(result.grossMinor)}.`
    : "";

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-[14px] font-semibold">Which way</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["add", "Add tax to a net price"],
              ["extract", "Take tax out of a gross price"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDirection(value)}
              aria-pressed={direction === value}
              className={[
                "inline-flex min-h-[36px] items-center rounded-full border px-4 py-2 text-[14px] transition-colors",
                direction === value
                  ? "border-primary-dark bg-primary-dark text-white"
                  : "border-line text-text-light hover:border-line-strong hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Currency" htmlFor="vat-currency">
          <Select id="vat-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </Select>
        </Field>
        <Field label={direction === "add" ? "Net amount" : "Gross amount"} htmlFor="vat-amount">
          <Input
            id="vat-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
          />
        </Field>
        <Field label="Rate" htmlFor="vat-rate" note="VAT or GST, as a percentage.">
          <Input
            id="vat-rate"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="20"
          />
        </Field>
      </div>

      {result ? (
        <section className="ek-card p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Figure label="Net" value={money(result.netMinor)} />
            <Figure label={`Tax at ${ratePct}%`} value={money(result.taxMinor)} />
            <Figure label="Gross" value={money(result.grossMinor)} strong />
          </div>
          {direction === "extract" ? (
            <p className="mt-4 text-[13px] text-text-light">
              The tax inside a gross price is the gross divided by one plus the rate, not the rate
              times the gross. At {ratePct}% the tax in {money(result.grossMinor)} is{" "}
              {money(result.taxMinor)}, not {money(Math.round((result.grossMinor * ratePct!) / 100))}.
            </p>
          ) : null}
          <div className="mt-4">
            <CopyButton text={sentence} className="ek-btn ek-btn-quiet px-4 py-2 text-[14px]" />
          </div>
        </section>
      ) : (
        <Note tone="quiet">Enter an amount and a rate for an answer.</Note>
      )}
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[13px] text-text-light">{label}</p>
      <p className={`tabular-nums ${strong ? "text-[26px]" : "text-[20px]"} leading-tight`}>{value}</p>
    </div>
  );
}
