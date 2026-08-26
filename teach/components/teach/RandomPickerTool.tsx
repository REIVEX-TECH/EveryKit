"use client";

import { useMemo, useState } from "react";
import { Shuffle, RotateCcw } from "lucide-react";
import { parseRoster } from "@/lib/teach/roster";
import { Field, Note, TextBox } from "./ui";

export function RandomPickerTool() {
  const [text, setText] = useState("");
  const [noRepeat, setNoRepeat] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [used, setUsed] = useState<string[]>([]);

  const roster = useMemo(() => parseRoster(text), [text]);
  const remaining = noRepeat ? roster.filter((n) => !used.includes(n)) : roster;

  function pick() {
    const pool = remaining;
    if (pool.length === 0) return;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    setPicked(choice);
    if (noRepeat) setUsed((u) => [...u, choice]);
  }

  function reset() {
    setUsed([]);
    setPicked(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Your class list" htmlFor="roster" note="One name a line.">
        <TextBox
          id="roster"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            reset();
          }}
          placeholder={"Ada Lovelace\nGrace Hopper\nAlan Turing"}
          className="min-h-[140px]"
        />
      </Field>

      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          checked={noRepeat}
          onChange={(e) => {
            setNoRepeat(e.target.checked);
            reset();
          }}
          className="h-4 w-4 accent-[var(--color-primary)]"
        />
        Don&apos;t repeat until everyone has been picked
      </label>

      <div className="ek-card flex min-h-[140px] flex-col items-center justify-center p-6 text-center">
        {picked ? (
          <div className="text-[28px] font-semibold leading-tight">{picked}</div>
        ) : (
          <p className="text-[14px] text-text-light">Press pick to choose a student.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={pick}
          disabled={remaining.length === 0}
          className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Shuffle aria-hidden="true" className="h-4 w-4" />
          {remaining.length === 0 && roster.length > 0 ? "Everyone picked" : "Pick a student"}
        </button>
        {noRepeat && used.length > 0 ? (
          <button type="button" onClick={reset} className="ek-btn ek-btn-quiet">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Start over
          </button>
        ) : null}
        {noRepeat && roster.length > 0 ? (
          <span className="text-[13px] text-text-light">
            {remaining.length} of {roster.length} still to come
          </span>
        ) : null}
      </div>

      <Note tone="quiet">
        The list stays in your browser and is not uploaded. Close the tab and it is gone.
      </Note>
    </div>
  );
}
