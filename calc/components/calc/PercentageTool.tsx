"use client";

import { useMemo, useState } from "react";
import {
  changeNote,
  isWhatPercentOf,
  parseNumber,
  percentChange,
  percentOf,
  type Answer,
} from "@/lib/calc/percentage";
import { CopyButton, Input, Note } from "./ui";

/**
 * The three percentage questions, on one page, in their own words.
 *
 * They are three different sums that all get searched for as "percentage
 * calculator", and the hard part is not the arithmetic. It is knowing which of
 * the three you want, which is why each block is phrased as the sentence people
 * actually type rather than labelled with an algebraic form.
 */
export function PercentageTool() {
  return (
    <div className="flex flex-col gap-8">
      <PercentOf />
      <IsWhatPercent />
      <PercentChange />

      <p className="text-[13px] text-text-light">
        Answers are rounded to four decimal places, which is past the point where any of these
        questions cares. Numbers can be typed with commas or a percent sign; both are ignored.
      </p>
    </div>
  );
}

function Block({
  title,
  children,
  answer,
  extra,
}: {
  title: string;
  children: React.ReactNode;
  answer: Answer;
  extra?: string | null;
}) {
  return (
    <section className="ek-card p-5">
      <h2 className="text-[17px]">{title}</h2>
      <div className="mt-4 flex flex-wrap items-end gap-3">{children}</div>

      {answer && "error" in answer ? (
        <Note tone="bad">{answer.error}</Note>
      ) : answer ? (
        <div className="mt-4">
          <p className="text-[22px] leading-snug">{answer.sentence}</p>
          {extra ? <p className="mt-2 text-[14px] text-text-light">{extra}</p> : null}
          <div className="mt-3">
            <CopyButton
              text={answer.sentence}
              label="Copy"
              className="ek-btn ek-btn-quiet px-4 py-2 text-[14px]"
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[14px] text-text-light">Fill in both boxes for an answer.</p>
      )}
    </section>
  );
}

function Cell({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="w-32">
      <label htmlFor={id} className="block text-[13px] text-text-light">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  );
}

function PercentOf() {
  const [percent, setPercent] = useState("");
  const [total, setTotal] = useState("");
  const answer = useMemo(
    () => percentOf(parseNumber(percent), parseNumber(total)),
    [percent, total],
  );

  return (
    <Block title="What is X percent of Y" answer={answer}>
      <Cell id="p1-a" label="Percent" value={percent} onChange={setPercent} placeholder="15" />
      <span className="pb-2.5 text-[15px] text-text-light">percent of</span>
      <Cell id="p1-b" label="Number" value={total} onChange={setTotal} placeholder="200" />
    </Block>
  );
}

function IsWhatPercent() {
  const [part, setPart] = useState("");
  const [total, setTotal] = useState("");
  const answer = useMemo(
    () => isWhatPercentOf(parseNumber(part), parseNumber(total)),
    [part, total],
  );

  return (
    <Block title="X is what percent of Y" answer={answer}>
      <Cell id="p2-a" label="Part" value={part} onChange={setPart} placeholder="30" />
      <span className="pb-2.5 text-[15px] text-text-light">is what percent of</span>
      <Cell id="p2-b" label="Whole" value={total} onChange={setTotal} placeholder="200" />
    </Block>
  );
}

function PercentChange() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const answer = useMemo(() => percentChange(parseNumber(from), parseNumber(to)), [from, to]);
  const note = useMemo(() => changeNote(parseNumber(from), parseNumber(to)), [from, to]);

  return (
    <Block title="Percent change from X to Y" answer={answer} extra={note}>
      <Cell id="p3-a" label="From" value={from} onChange={setFrom} placeholder="40" />
      <span className="pb-2.5 text-[15px] text-text-light">to</span>
      <Cell id="p3-b" label="To" value={to} onChange={setTo} placeholder="50" />
    </Block>
  );
}
