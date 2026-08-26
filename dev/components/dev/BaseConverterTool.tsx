"use client";

import { useState } from "react";
import { BASES, parseInBase, toBase, type Base } from "@/lib/dev/baseConvert";
import { CopyButton, Field, Note } from "./ui";

export function BaseConverterTool() {
  const [value, setValue] = useState<bigint>(255n);
  const [active, setActive] = useState<Base | null>(null);
  const [activeText, setActiveText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onChange(base: Base, text: string) {
    setActive(base);
    setActiveText(text);
    const result = parseInBase(text, base);
    if ("error" in result) {
      setError(result.error || null);
    } else {
      setValue(result.value);
      setError(null);
    }
  }

  const fieldValue = (base: Base) => (base === active ? activeText : toBase(value, base));

  return (
    <div className="flex flex-col gap-4">
      {BASES.map(({ base, name, label }) => (
        <Field key={base} label={label} htmlFor={name}>
          <div className="flex items-center gap-2">
            <input
              id={name}
              value={fieldValue(base)}
              onChange={(e) => onChange(base, e.target.value)}
              inputMode={base === 10 ? "numeric" : "text"}
              spellCheck={false}
              className="w-full rounded-[10px] border border-line bg-background px-3 py-2 font-mono text-[15px] outline-none focus:border-primary"
            />
            <CopyButton text={() => toBase(value, base)} label="" className="ek-btn ek-btn-quiet shrink-0" />
          </div>
        </Field>
      ))}

      {error ? <Note tone="bad">{error}</Note> : null}

      <Note tone="quiet">
        Whole numbers of any size, using your browser&apos;s big integers, so a value too large for an
        ordinary number still converts exactly.
      </Note>
    </div>
  );
}
