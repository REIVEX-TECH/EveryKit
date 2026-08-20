"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  CATEGORIES,
  DEFAULT_PAIR,
  convert,
  findUnit,
  formatResult,
  parseValue,
  unitsFor,
  type Category,
} from "@/lib/calc/units";
import { CopyButton, Field, Input, Note, Select } from "./ui";

/**
 * Length, weight, temperature and area.
 *
 * The categories are separate on purpose. A single list of every unit invites
 * converting kilograms to miles, and a converter that answers that question is
 * a converter that has stopped meaning anything.
 */
export function UnitsTool() {
  const [category, setCategory] = useState<Category>("length");
  const [from, setFrom] = useState(DEFAULT_PAIR.length[0]);
  const [to, setTo] = useState(DEFAULT_PAIR.length[1]);
  const [value, setValue] = useState("1");

  const parsed = useMemo(() => parseValue(value), [value]);
  const result = parsed === null ? null : convert(parsed, category, from, to);

  const fromUnit = findUnit(category, from);
  const toUnit = findUnit(category, to);

  const changeCategory = (next: Category) => {
    setCategory(next);
    const [a, b] = DEFAULT_PAIR[next];
    setFrom(a);
    setTo(b);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    // The answer becomes the question, which is what somebody swapping wants.
    if (result !== null) setValue(formatResult(result));
  };

  const summary =
    result !== null && fromUnit && toUnit
      ? `${value} ${fromUnit.symbol} is ${formatResult(result)} ${toUnit.symbol}`
      : "";

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-[14px] font-semibold">What are you converting</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(CATEGORIES) as Category[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => changeCategory(id)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                category === id
                  ? "bg-primary-dark text-white"
                  : "border border-line bg-background hover:border-line-strong"
              }`}
            >
              {CATEGORIES[id].label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-3">
          <Field label="From" htmlFor="u-value">
            <Input
              id="u-value"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              inputMode="decimal"
              className="text-[18px]"
            />
          </Field>
          <Select
            aria-label="Convert from"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          >
            {unitsFor(category).map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Swap the two units"
          className="ek-btn ek-btn-quiet mb-1 self-center px-4 py-2"
        >
          <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
          Swap
        </button>

        <div className="flex flex-col gap-3">
          <Field label="To" htmlFor="u-result">
            <output
              id="u-result"
              className="block w-full rounded-[10px] border border-line bg-bg-soft px-3 py-2 text-[18px] tabular-nums"
            >
              {result === null ? "..." : formatResult(result)}
            </output>
          </Field>
          <Select
            aria-label="Convert to"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          >
            {unitsFor(category).map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {value.trim() !== "" && parsed === null ? (
        <Note tone="bad">That is not a number.</Note>
      ) : null}

      {result !== null && fromUnit && toUnit ? (
        <div className="ek-card bg-bg-soft p-5">
          <p className="text-[20px] leading-snug">
            {value} {fromUnit.symbol} is{" "}
            <strong className="font-semibold">
              {formatResult(result)} {toUnit.symbol}
            </strong>
          </p>
          <div className="mt-4">
            <CopyButton text={summary} label="Copy" />
          </div>
        </div>
      ) : null}

      <p className="text-[13px] text-text-light">
        {category === "temperature"
          ? "Temperature is not a ratio: its scales start in different places, so 20 degrees is not twice 10. The conversion adds and subtracts offsets rather than multiplying, which is the mistake most converters make."
          : "The factors here are the exact definitions rather than rounded measurements. An inch is exactly 25.4 mm and a pound is exactly 0.45359237 kg by international agreement."}{" "}
        Answers are capped at six significant figures, because a converter that prints
        2.5400000000000005 has told you the truth about floating point and nothing about the
        measurement.
      </p>
    </div>
  );
}
