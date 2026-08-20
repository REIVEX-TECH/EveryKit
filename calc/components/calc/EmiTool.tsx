"use client";

import { useMemo, useState } from "react";
import {
  CURRENCIES,
  MAX_MONTHS,
  calculateLoan,
  formatMoney,
  parseAmount,
  parseMonths,
  parseRate,
} from "@/lib/calc/emi";
import { CopyButton, Field, Input, Note, Select } from "./ui";

/**
 * Loan instalments, with the schedule that explains them.
 *
 * The schedule is the point. A monthly payment on its own tells you what leaves
 * your account; the schedule shows how little of the first year touches the
 * principal, which is the thing most people have never seen written down.
 */
export function EmiTool() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [months, setMonths] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [showAll, setShowAll] = useState(false);

  const principal = useMemo(() => parseAmount(amount), [amount]);
  const annualRate = useMemo(() => parseRate(rate), [rate]);
  const term = useMemo(() => parseMonths(months), [months]);

  const locale = CURRENCIES.find((item) => item.code === currency)?.locale ?? "en-US";
  const money = (minor: number) => formatMoney(minor, currency, locale);

  const result =
    principal !== null && principal > 0 && annualRate !== null && term !== null
      ? calculateLoan(principal, annualRate, term)
      : null;

  const rows = result ? (showAll ? result.schedule : result.schedule.slice(0, 12)) : [];

  const summary = result
    ? `${money(result.monthly)} a month for ${term} months. Total paid ${money(result.totalPaid)}, of which ${money(result.totalInterest)} is interest.`
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Loan amount" htmlFor="emi-amount">
          <Input
            id="emi-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="100000"
          />
        </Field>
        <Field label="Annual rate" htmlFor="emi-rate" note="A percentage, as your bank quotes it.">
          <Input
            id="emi-rate"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            inputMode="decimal"
            placeholder="7.5"
          />
        </Field>
        <Field label="Term in months" htmlFor="emi-months" note={`Up to ${MAX_MONTHS}.`}>
          <Input
            id="emi-months"
            value={months}
            onChange={(event) => setMonths(event.target.value)}
            inputMode="numeric"
            placeholder="240"
          />
        </Field>
        <Field label="Currency" htmlFor="emi-currency">
          <Select
            id="emi-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {amount.trim() !== "" && principal === null ? (
        <Note tone="bad">The amount can have at most two decimal places.</Note>
      ) : null}
      {rate.trim() !== "" && annualRate === null ? (
        <Note tone="bad">The rate has to be a percentage between 0 and 200.</Note>
      ) : null}
      {months.trim() !== "" && term === null ? (
        <Note tone="bad">The term has to be a whole number of months, up to {MAX_MONTHS}.</Note>
      ) : null}

      {result ? (
        <>
          <div className="ek-card bg-bg-soft p-6">
            <p className="text-[13px] text-text-light">Every month</p>
            <p className="mt-1 text-[40px] font-semibold leading-none tabular-nums">
              {money(result.monthly)}
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[13px] text-text-light">Total paid over {term} months</dt>
                <dd className="mt-0.5 text-[20px] font-semibold tabular-nums">
                  {money(result.totalPaid)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-text-light">Of which interest</dt>
                <dd className="mt-0.5 text-[20px] font-semibold tabular-nums">
                  {money(result.totalInterest)}
                </dd>
              </div>
            </dl>

            <p className="mt-5 text-[14px] text-text-light">
              Estimates for planning. Not financial advice.
            </p>

            <div className="mt-4">
              <CopyButton text={summary} label="Copy the result" />
            </div>
          </div>

          <section>
            <h2 className="text-[17px]">The schedule</h2>
            <p className="mt-1 text-[13px] text-text-light">
              Where each payment goes. Early on almost all of it is interest, which is the part
              worth seeing written down.
            </p>

            <div className="ek-card mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-text-light">
                    <th scope="col" className="px-3 py-2 font-semibold">Month</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Payment</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Interest</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Principal</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Left owing</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.number} className="border-b border-line last:border-0">
                      <td className="px-3 py-1.5 tabular-nums">{row.number}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{money(row.payment)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-text-light">
                        {money(row.interest)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{money(row.principal)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{money(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.schedule.length > 12 ? (
              <button
                type="button"
                onClick={() => setShowAll((current) => !current)}
                className="ek-btn ek-btn-quiet mt-3 px-4 py-2 text-[14px]"
              >
                {showAll
                  ? "Show the first year only"
                  : `Show all ${result.schedule.length} months`}
              </button>
            ) : null}
          </section>

          <p className="text-[13px] text-text-light">
            Worked out in whole cents rather than in decimals, so the schedule ends at exactly
            zero instead of a few cents either side of it. The last instalment settles whatever is
            left, which is what a bank does. Real quotes differ: fees, insurance, a different day
            count convention and any rate that is not fixed will all move the number.
          </p>
        </>
      ) : null}
    </div>
  );
}
