"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { MAX_COUNT, MIN_COUNT, clampCount, generateUuids } from "@/lib/dev/uuid";
import { CopyButton, Note } from "./ui";

/**
 * Version 4 UUIDs, as many as a hundred.
 *
 * Generated on mount so the page is useful the instant it loads rather than
 * after a click, and regenerated on demand. Nothing is stored: reloading gives
 * a different set, which is the correct behaviour for random identifiers and
 * the opposite of the seeded generator in the Text kit.
 */
export function UuidTool() {
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>([]);

  // Generated in an effect rather than in the initial state, because the server
  // renders this component too and random output there would not match what the
  // browser produces, which is a hydration mismatch.
  useEffect(() => {
    setIds(generateUuids(5));
  }, []);

  const regenerate = (next = count) => setIds(generateUuids(next));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="uuid-count" className="block text-[14px] font-semibold">
            How many
          </label>
          <input
            id="uuid-count"
            type="number"
            min={MIN_COUNT}
            max={MAX_COUNT}
            value={count}
            onChange={(event) => {
              const next = clampCount(Number(event.target.value));
              setCount(next);
              regenerate(next);
            }}
            className="mt-2 w-28 rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
          />
        </div>

        <button type="button" onClick={() => regenerate()} className="ek-btn ek-btn-accent">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          New ones
        </button>

        <CopyButton
          text={() => ids.join("\n")}
          label={`Copy all ${ids.length}`}
          disabled={ids.length === 0}
          className="ek-btn ek-btn-quiet"
        />
      </div>

      <Note tone="quiet">
        Version 4, from your browser&apos;s own cryptographic randomness rather than from
        Math.random, which is a fast sequence and not a random source. Between 1 and {MAX_COUNT} at
        a time.
      </Note>

      <ul className="ek-card divide-y divide-line">
        {ids.map((id) => (
          <li key={id} className="flex items-center justify-between gap-3 px-3 py-2">
            <code className="overflow-x-auto font-mono text-[13px]">{id}</code>
            <CopyButton
              text={id}
              label="Copy"
              className="ek-btn ek-btn-quiet shrink-0 px-3 py-1.5 text-[13px]"
            />
          </li>
        ))}
        {ids.length === 0 ? (
          <li className="px-3 py-6 text-center text-[14px] text-text-light">Generating.</li>
        ) : null}
      </ul>
    </div>
  );
}
