"use client";

import { useEffect, useMemo, useState } from "react";
import { describeDuration, difference, longDate, parseDate, toIsoDate } from "@/lib/calc/dates";
import { CopyButton, Field, Input, Note } from "./ui";

/**
 * The gap between two dates, with the counting rule on screen.
 *
 * Including the end date or not is the difference between "how many days
 * between the 1st and the 5th" and "how many days do I have, counting today".
 * Both questions get asked constantly and each answer is wrong for the other,
 * so it is a switch you can see rather than an assumption buried in the code.
 */
export function DateDifferenceTool() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [includeEnd, setIncludeEnd] = useState(false);

  // Defaulted to today only after mount, for the same hydration reason as the
  // age tool: the server does not know what day it is where you are.
  useEffect(() => {
    const today = toIsoDate(new Date());
    setFrom((current) => current || today);
  }, []);

  const start = useMemo(() => parseDate(from), [from]);
  const end = useMemo(() => parseDate(to), [to]);
  const result = start && end ? difference(start, end, includeEnd) : null;

  const summary =
    result && start && end
      ? `${longDate(start)} to ${longDate(end)} is ${result.days.toLocaleString("en")} days${includeEnd ? ", counting both ends" : ""}.`
      : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From" htmlFor="dd-from">
          <Input
            id="dd-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </Field>
        <Field label="To" htmlFor="dd-to">
          <Input id="dd-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-[14px]">
        <input
          type="checkbox"
          checked={includeEnd}
          onChange={(event) => setIncludeEnd(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        />
        <span>
          Count the end date as well
          <span className="mt-0.5 block text-[13px] text-text-light">
            Off, the 1st to the 5th is four days. On, it is five. Use it when you are counting days
            you have rather than the gap between two events.
          </span>
        </span>
      </label>

      {from !== "" && !start ? <Note tone="bad">The first date does not exist.</Note> : null}
      {to !== "" && !end ? <Note tone="bad">The second date does not exist.</Note> : null}

      {result && start && end ? (
        <>
          <div className="ek-card bg-bg-soft p-6">
            <p className="text-[13px] text-text-light">Between the two dates</p>
            <p className="mt-1 text-[44px] font-semibold leading-none tabular-nums">
              {result.days.toLocaleString("en")}
            </p>
            <p className="mt-1 text-[16px] text-text-light">
              day{result.days === 1 ? "" : "s"}
            </p>
            <div className="mt-4">
              <CopyButton text={summary} label="Copy" />
            </div>
          </div>

          <dl className="ek-card divide-y divide-line">
            <Row
              label="In weeks"
              value={
                result.remainderDays === 0
                  ? `${result.weeks} week${result.weeks === 1 ? "" : "s"}`
                  : `${result.weeks} week${result.weeks === 1 ? "" : "s"} and ${result.remainderDays} day${result.remainderDays === 1 ? "" : "s"}`
              }
            />
            <Row label="In whole months" value={`${result.months}`} />
            <Row label="As a calendar span" value={describeDuration(result.duration)} />
            <Row label="From" value={longDate(start)} />
            <Row label="To" value={longDate(end)} />
          </dl>

          <p className="text-[13px] text-text-light">
            Whole calendar days, so the time of day never comes into it and a clock change cannot
            move the answer. Whole months count completed ones: 15 January to 14 August is six
            months, and one day later it is seven.
          </p>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <dt className="text-[14px] text-text-light">{label}</dt>
      <dd className="text-[15px] font-semibold">{value}</dd>
    </div>
  );
}
