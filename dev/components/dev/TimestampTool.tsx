"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import {
  localZoneName,
  parseLocalDateTime,
  parseStamp,
  relative,
  toIsoUtc,
  toLocalString,
  toUnixSeconds,
  type Unit,
} from "@/lib/dev/timestamp";
import { CopyButton, Field, Input, Note, Select } from "./ui";

/**
 * Unix time, both directions.
 *
 * The unit is guessed from the size of the number and can be overridden,
 * because ten digits and thirteen digits are the same "big number" to a person
 * and a factor of a thousand to a computer. Guessing and saying which way it
 * guessed is more useful than asking first.
 */
export function TimestampTool() {
  const [stamp, setStamp] = useState("");
  const [unit, setUnit] = useState<Unit | "auto">("auto");
  const [typed, setTyped] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  // Ticking, so the relative line does not go stale while the page is open.
  // Rendered only after mount: a clock in server output would not match the
  // browser and would be a hydration mismatch.
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const zone = useMemo(() => localZoneName(), []);
  const parsed = useMemo(
    () => parseStamp(stamp, unit === "auto" ? undefined : unit),
    [stamp, unit],
  );
  const fromTyped = useMemo(() => parseLocalDateTime(typed), [typed]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px]">A timestamp, into a date</h2>
          <button
            type="button"
            onClick={() => {
              const current = new Date();
              setStamp(String(toUnixSeconds(current)));
              setUnit("seconds");
            }}
            className="ek-btn ek-btn-quiet px-4 py-2 text-[14px]"
          >
            <Clock aria-hidden="true" className="h-4 w-4" />
            Now
          </button>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Unix timestamp" htmlFor="ts-in">
            <Input
              id="ts-in"
              value={stamp}
              onChange={(event) => setStamp(event.target.value)}
              placeholder="1516242622"
              inputMode="numeric"
              className="font-mono"
            />
          </Field>
          <Field label="Read as" htmlFor="ts-unit">
            <Select
              id="ts-unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value as Unit | "auto")}
            >
              <option value="auto">Guess from the size</option>
              <option value="seconds">Seconds</option>
              <option value="milliseconds">Milliseconds</option>
            </Select>
          </Field>
        </div>

        {stamp.trim() !== "" && !parsed ? (
          <Note tone="bad">That is not a whole number of seconds or milliseconds.</Note>
        ) : null}

        {parsed ? (
          <dl className="ek-card mt-3 divide-y divide-line">
            <Row label={`Local time (${zone})`} value={toLocalString(parsed.date)} />
            <Row label="UTC" value={toIsoUtc(parsed.date)} />
            <Row label="Relative" value={now ? relative(parsed.date, now.getTime()) : "..."} />
            <Row
              label="Read as"
              value={`${parsed.unit}${unit === "auto" ? ", guessed from its size" : ""}`}
            />
          </dl>
        ) : null}
      </section>

      <section>
        <h2 className="text-[17px]">A date, into a timestamp</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field
            label="Date and time"
            htmlFor="ts-date"
            note={`Read as ${zone}, which is what you mean when you type a time.`}
          >
            <Input
              id="ts-date"
              type="datetime-local"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          </Field>
        </div>

        {typed !== "" && !fromTyped ? <Note tone="bad">That date does not exist.</Note> : null}

        {fromTyped ? (
          <dl className="ek-card mt-3 divide-y divide-line">
            <Row label="Seconds" value={String(toUnixSeconds(fromTyped))} copy />
            <Row label="Milliseconds" value={String(fromTyped.getTime())} copy />
            <Row label="UTC" value={toIsoUtc(fromTyped)} copy />
          </dl>
        ) : null}
      </section>

      {now ? (
        <p className="text-[13px] text-text-light">
          Right now it is {toUnixSeconds(now)} seconds, {now.getTime()} milliseconds.
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, value, copy = false }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      <dt className="w-44 shrink-0 text-[13px] font-semibold">{label}</dt>
      <dd className="min-w-0 flex-1 break-all font-mono text-[14px]">{value}</dd>
      {copy ? (
        <CopyButton
          text={value}
          label="Copy"
          className="ek-btn ek-btn-quiet shrink-0 px-3 py-1.5 text-[13px]"
        />
      ) : null}
    </div>
  );
}
