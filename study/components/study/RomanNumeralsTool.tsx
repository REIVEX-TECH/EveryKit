"use client";

import { useState } from "react";
import { toRoman, fromRoman } from "@/lib/study/roman";
import { CopyButton, Field, Input, Note } from "./ui";

export function RomanNumeralsTool() {
  const [number, setNumber] = useState("2024");
  const [roman, setRoman] = useState("MMXXIV");
  const [error, setError] = useState<string | null>(null);

  function onNumber(text: string) {
    setNumber(text);
    if (text.trim() === "") {
      setRoman("");
      setError(null);
      return;
    }
    const n = Number(text);
    if (!Number.isInteger(n)) {
      setError("Enter a whole number.");
      return;
    }
    const result = toRoman(n);
    if ("error" in result) {
      setError(result.error);
    } else {
      setRoman(result.roman);
      setError(null);
    }
  }

  function onRoman(text: string) {
    setRoman(text.toUpperCase());
    const result = fromRoman(text);
    if ("error" in result) {
      setError(result.error || null);
    } else {
      setNumber(String(result.value));
      setError(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Number" htmlFor="number" note="From 1 to 3999.">
        <div className="flex items-center gap-2">
          <Input id="number" inputMode="numeric" value={number} onChange={(e) => onNumber(e.target.value)} className="text-[17px]" />
          <CopyButton text={() => number} label="" className="ek-btn ek-btn-quiet shrink-0" />
        </div>
      </Field>

      <Field label="Roman numeral" htmlFor="roman">
        <div className="flex items-center gap-2">
          <Input id="roman" value={roman} onChange={(e) => onRoman(e.target.value)} className="font-mono text-[17px] tracking-wide" autoCapitalize="characters" spellCheck={false} />
          <CopyButton text={() => roman} label="" className="ek-btn ek-btn-quiet shrink-0" />
        </div>
      </Field>

      {error ? <Note tone="bad">{error}</Note> : null}

      <div className="ek-card bg-bg-soft p-4 text-[14px] leading-relaxed text-text-light">
        <p className="font-semibold text-foreground">How the numerals work</p>
        <p className="mt-1">
          Seven letters carry fixed values: I is 1, V is 5, X is 10, L is 50, C is 100, D is 500 and M is
          1000. You add them from largest to smallest, so MMXXIV is 1000 plus 1000 plus 10 plus 10 plus 4.
          When a smaller letter sits directly before a larger one it is subtracted instead, which is why 4
          is IV and 9 is IX, rather than IIII. A letter repeats at most three times, and there is no zero
          and no single letter past M, so the system stops at 3999.
        </p>
      </div>

      <Note tone="quiet">Converted in your browser. Nothing is sent anywhere.</Note>
    </div>
  );
}
