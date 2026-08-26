"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { buildPool, entropyBits, strengthLabel, type SetId } from "@/lib/dev/password";
import { CopyButton, Field, Note } from "./ui";

const SETS: Array<{ id: SetId; label: string }> = [
  { id: "lower", label: "Lowercase" },
  { id: "upper", label: "Uppercase" },
  { id: "digits", label: "Digits" },
  { id: "symbols", label: "Symbols" },
];

/**
 * A uniform draw from the pool using the browser's cryptographic random source,
 * with rejection sampling so the modulo does not bias the low characters. Never
 * Math.random, which is not safe for secrets.
 */
function generate(pool: string, length: number): string {
  if (pool.length === 0 || length <= 0) return "";
  const limit = 256 - (256 % pool.length);
  const out: string[] = [];
  const bytes = new Uint8Array(length * 2);
  crypto.getRandomValues(bytes);
  let i = 0;
  while (out.length < length) {
    if (i >= bytes.length) {
      crypto.getRandomValues(bytes);
      i = 0;
    }
    const b = bytes[i++];
    if (b < limit) out.push(pool[b % pool.length]);
  }
  return out.join("");
}

export function PasswordTool() {
  const [length, setLength] = useState(20);
  const [sets, setSets] = useState<Record<SetId, boolean>>({ lower: true, upper: true, digits: true, symbols: true });
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");

  const activeSets = SETS.filter((s) => sets[s.id]).map((s) => s.id);
  const pool = buildPool(activeSets, excludeAmbiguous);
  const bits = entropyBits(pool.length, length);
  const label = strengthLabel(bits);

  const regenerate = useCallback(() => {
    setPassword(generate(pool, length));
  }, [pool, length]);

  // A password on screen from the first render, and a fresh one whenever the
  // settings change, so the reading always matches what is shown.
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const barColor =
    label === "weak" ? "var(--color-danger)" : label === "fair" ? "var(--color-accent)" : label === "strong" ? "var(--color-primary)" : "var(--color-success)";

  return (
    <div className="flex flex-col gap-5">
      <div className="ek-card flex items-center gap-3 bg-bg-soft p-3">
        <code className="min-w-0 flex-1 break-all font-mono text-[16px]">{password || "Pick at least one character set"}</code>
        <button type="button" onClick={regenerate} aria-label="Generate another" className="ek-btn ek-btn-quiet shrink-0">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-soft" aria-hidden="true">
          <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.min(100, (bits / 128) * 100)}%`, backgroundColor: barColor }} />
        </div>
        <p className="mt-1.5 text-[13px] text-text-light">
          {pool.length === 0 ? "No characters to choose from." : <>Strength {label}, about {Math.round(bits)} bits of entropy from {pool.length} possible characters.</>}
        </p>
      </div>

      <Field label={`Length: ${length}`} htmlFor="length">
        <input
          id="length"
          type="range"
          min={6}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
      </Field>

      <fieldset>
        <legend className="text-[14px] font-semibold">Include</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {SETS.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                checked={sets[s.id]}
                onChange={(e) => setSets({ ...sets, [s.id]: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {s.label}
            </label>
          ))}
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={excludeAmbiguous} onChange={(e) => setExcludeAmbiguous(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
            No look-alikes
          </label>
        </div>
      </fieldset>

      <div>
        <CopyButton text={() => password} label="Copy password" disabled={password === ""} />
      </div>

      <Note tone="quiet">Made in your browser with a cryptographic random source. Nothing is generated on a server or sent anywhere.</Note>
    </div>
  );
}
