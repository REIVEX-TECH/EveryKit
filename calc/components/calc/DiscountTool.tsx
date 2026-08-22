"use client";

import { useMemo, useState } from "react";
import { CURRENCIES, formatMoney, parseAmount } from "@/lib/calc/emi";
import { applyDiscount, parsePercent } from "@/lib/calc/money";
import { CopyButton, Field, Input, Note, Select } from "./ui";

/**
 * Price, percent off, and an optional second discount, with the saved amount as
 * the headline. The second discount is the reason this exists: people add the
 * two percentages together, and stacked discounts do not add.
 */
export function DiscountTool() {
  const [price, setPrice] = useState("");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [currency, setCurrency] = useState("USD");

  const locale = CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US";
  const money = (minor: number) => formatMoney(minor, currency, locale);

  const priceMinor = parseAmount(price);
  const firstPct = parsePercent(first);
  const secondPct = second.trim() === "" ? null : parsePercent(second);

  const result = useMemo(() => {
    if (priceMinor === null || firstPct === null) return null;
    if (second.trim() !== "" && secondPct === null) return null;
    return applyDiscount({ priceMinor, first: firstPct, second: secondPct });
  }, [priceMinor, firstPct, secondPct, second]);

  const sentence = result
    ? `${money(priceMinor!)} with ${firstPct}% off` +
      (secondPct !== null ? ` then ${secondPct}% off` : "") +
      ` is ${money(result.finalMinor)}. You save ${money(result.savedMinor)}.`
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Currency" htmlFor="disc-currency">
          <Select id="disc-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Price" htmlFor="disc-price">
          <Input
            id="disc-price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="49.99"
          />
        </Field>
        <Field label="Percent off" htmlFor="disc-first">
          <Input
            id="disc-first"
            inputMode="decimal"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="20"
          />
        </Field>
        <Field
          label="Second discount"
          htmlFor="disc-second"
          note="Optional. Applied to what the first leaves."
        >
          <Input
            id="disc-second"
            inputMode="decimal"
            value={second}
            onChange={(e) => setSecond(e.target.value)}
            placeholder="10"
          />
        </Field>
      </div>

      {result ? (
        <section className="ek-card p-5">
          <p className="text-[14px] text-text-light">You pay</p>
          <p className="text-[34px] leading-tight tabular-nums">{money(result.finalMinor)}</p>
          <p className="mt-2 text-[16px]">
            You save <span className="font-semibold">{money(result.savedMinor)}</span>
            {secondPct !== null ? (
              <>
                {" "}
                <span className="text-text-light">
                  ({result.effectivePercent.toFixed(1)}% off in total, not{" "}
                  {(firstPct! + secondPct).toFixed(0)}%)
                </span>
              </>
            ) : null}
          </p>
          {secondPct !== null ? (
            <p className="mt-2 text-[13px] text-text-light">
              After the first discount it is {money(result.afterFirstMinor)}; the second comes off
              that, which is why two discounts never add up to their sum.
            </p>
          ) : null}
          <div className="mt-4">
            <CopyButton text={sentence} className="ek-btn ek-btn-quiet px-4 py-2 text-[14px]" />
          </div>
        </section>
      ) : (
        <Note tone="quiet">Enter a price and a percentage for an answer.</Note>
      )}
    </div>
  );
}
