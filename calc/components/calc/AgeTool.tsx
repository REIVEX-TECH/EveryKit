"use client";

import { useEffect, useMemo, useState } from "react";
import {
  daysBetween,
  describeDuration,
  exactDuration,
  longDate,
  nextBirthday,
  parseDate,
  toIsoDate,
} from "@/lib/calc/dates";
import { CopyButton, Field, Input, Note } from "./ui";

/**
 * Age to the day, and the countdown to the next birthday.
 *
 * "Today" is only read after mount. Rendering a date on the server and a
 * different one in the browser is a hydration mismatch, and on a page whose
 * whole answer depends on today it would be a visible flicker rather than a
 * warning in a console nobody has open.
 */
export function AgeTool() {
  const [born, setBorn] = useState("");
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const date = useMemo(() => parseDate(born), [born]);
  const age = date && today ? exactDuration(date, today) : null;
  const birthday = date && today ? nextBirthday(date, today) : null;
  const totalDays = date && today ? daysBetween(date, today) : null;

  const future = date && today && date.getTime() > today.getTime();

  const summary =
    age && date
      ? `Born ${longDate(date)}. Age ${describeDuration(age)}, which is ${totalDays?.toLocaleString("en")} days.`
      : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-[280px]">
        <Field
          label="Date of birth"
          htmlFor="age-dob"
          note="Worked out in this page. The date is not sent anywhere and is not stored, so closing the tab is all it takes to be rid of it."
        >
          <Input
            id="age-dob"
            type="date"
            value={born}
            max={today ? toIsoDate(today) : undefined}
            onChange={(event) => setBorn(event.target.value)}
          />
        </Field>
      </div>

      {born !== "" && !date ? <Note tone="bad">That date does not exist.</Note> : null}
      {future ? <Note tone="bad">That is in the future, so there is no age to work out yet.</Note> : null}

      {age && date && birthday && !future ? (
        <>
          <div className="ek-card bg-bg-soft p-6">
            <p className="text-[13px] text-text-light">Age today</p>
            <p className="mt-1 text-[36px] font-semibold leading-tight sm:text-[44px]">
              {describeDuration(age)}
            </p>
            <p className="mt-2 text-[14px] text-text-light">
              Born {longDate(date)}.
            </p>
            <div className="mt-4">
              <CopyButton text={summary} label="Copy" />
            </div>
          </div>

          <dl className="ek-card divide-y divide-line">
            <Row label="In days" value={`${totalDays?.toLocaleString("en")} days`} />
            <Row
              label="In weeks"
              value={`${Math.floor((totalDays ?? 0) / 7).toLocaleString("en")} weeks and ${(totalDays ?? 0) % 7} days`}
            />
            <Row
              label="In months"
              value={`${(age.years * 12 + age.months).toLocaleString("en")} whole months`}
            />
            <Row
              label="Next birthday"
              value={
                birthday.days === 0
                  ? "Today. Happy birthday."
                  : `${longDate(birthday.date)}, ${birthday.days} day${birthday.days === 1 ? "" : "s"} away`
              }
            />
          </dl>

          {birthday.isLeapDay ? (
            <Note tone="quiet">
              You were born on 29 February, so in a year that does not have one the birthday here
              is counted on 1 March. That is the convention most places use, and it is a choice
              rather than a fact: some count 28 February instead.
            </Note>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <dt className="text-[14px] text-text-light">{label}</dt>
      <dd className="text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
