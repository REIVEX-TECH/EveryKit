"use client";

import { useMemo, useState } from "react";
import { parseFormula, molarMass, breakdown, hasEstimated } from "@/lib/study/molarMass";
import { CopyButton, Field, Input, Note } from "./ui";

const EXAMPLES = ["H2O", "H2SO4", "Ca(OH)2", "CuSO4·5H2O", "C6H12O6"];

export function MolarMassTool() {
  const [formula, setFormula] = useState("H2SO4");

  const result = useMemo(() => {
    const parsed = parseFormula(formula);
    if ("error" in parsed) return { ok: false as const, error: parsed.error };
    return {
      ok: true as const,
      total: molarMass(parsed.counts),
      rows: breakdown(parsed.counts),
      estimated: hasEstimated(parsed.counts),
    };
  }, [formula]);

  const error = result.ok ? null : result.error;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Formula" htmlFor="formula" note="Case matters: Co is cobalt, CO is carbon and oxygen. Dots and brackets are fine.">
        <Input
          id="formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          className="font-mono text-[17px]"
          placeholder="e.g. Ca(OH)2"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => setFormula(ex)} className="rounded-full border border-line px-3 py-1 font-mono text-[13px] text-text-light hover:border-line-strong">
            {ex}
          </button>
        ))}
      </div>

      {error ? <Note tone="bad">{error}</Note> : null}

      {result.ok ? (
        <>
          <div className="ek-card bg-bg-soft p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <span className="text-[28px] font-semibold tabular-nums">{result.total.toFixed(3)}</span>
                <span className="ml-1 text-[15px] text-text-light">g/mol</span>
              </div>
              <CopyButton text={() => `${result.total.toFixed(3)} g/mol`} label="Copy" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-line text-left text-[12px] text-text-light">
                  <th className="py-1.5 pr-2 font-semibold">Element</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Atoms</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Atomic mass</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Subtotal</th>
                  <th className="py-1.5 text-right font-semibold">Percent</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.element.symbol} className="border-b border-line/60">
                    <td className="py-1.5 pr-2">
                      <span className="font-semibold">{row.element.symbol}</span>
                      <span className="ml-1 text-text-light">{row.element.name}</span>
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{row.count}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{row.element.mass}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{row.subtotal.toFixed(3)}</td>
                    <td className="py-1.5 text-right tabular-nums">{((row.subtotal / result.total) * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.estimated ? (
            <Note tone="quiet">
              One element here has no stable isotope, so its mass is the mass number of its best-known
              isotope rather than a measured standard weight. The total is approximate for that reason.
            </Note>
          ) : null}
        </>
      ) : null}

      <Note tone="quiet">
        Worked out in your browser from standard atomic weights. Nothing you type is sent anywhere.
      </Note>
    </div>
  );
}
