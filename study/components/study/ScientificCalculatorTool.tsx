"use client";

import { useMemo, useRef, useState } from "react";
import { evaluate, type Angle } from "@/lib/study/calculator";

/**
 * A scientific calculator with one screen and one clean pad.
 *
 * The expression is a plain text field, so it takes keyboard input directly and
 * the buttons only append to it. The result is worked out live by the tested
 * evaluator, never `eval`, and shown only when the expression is complete, so a
 * half-typed sum does not flash an error.
 */

function formatResult(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const rounded = Math.round(n * 1e10) / 1e10;
  return String(rounded);
}

export function ScientificCalculatorTool() {
  const [expr, setExpr] = useState("");
  const [angle, setAngle] = useState<Angle>("deg");
  const [memory, setMemory] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => {
    if (expr.trim() === "") return null;
    try {
      return formatResult(evaluate(expr, angle));
    } catch {
      return null;
    }
  }, [expr, angle]);

  const append = (text: string) => {
    setExpr((current) => current + text);
    inputRef.current?.focus();
  };

  const commit = () => {
    if (result && result !== "Error") setExpr(result);
  };

  const currentValue = (): number => {
    try {
      return evaluate(expr || "0", angle);
    } catch {
      return 0;
    }
  };

  const funcs = ["sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt"];
  const pad: Array<{ label: string; insert?: string; action?: () => void; accent?: boolean }> = [
    { label: "C", action: () => setExpr("") },
    { label: "⌫", action: () => setExpr((c) => c.slice(0, -1)) },
    { label: "(", insert: "(" },
    { label: ")", insert: ")" },
    { label: "7", insert: "7" },
    { label: "8", insert: "8" },
    { label: "9", insert: "9" },
    { label: "÷", insert: "/" },
    { label: "4", insert: "4" },
    { label: "5", insert: "5" },
    { label: "6", insert: "6" },
    { label: "×", insert: "*" },
    { label: "1", insert: "1" },
    { label: "2", insert: "2" },
    { label: "3", insert: "3" },
    { label: "−", insert: "-" },
    { label: "0", insert: "0" },
    { label: ".", insert: "." },
    { label: "=", action: commit, accent: true },
    { label: "+", insert: "+" },
  ];

  return (
    <div className="max-w-[420px]">
      <div className="ek-card p-4">
        {/* Screen */}
        <input
          ref={inputRef}
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          inputMode="text"
          aria-label="Expression"
          placeholder="0"
          className="w-full rounded-[10px] border border-line bg-bg-soft px-3 py-2 text-right font-mono text-[20px] outline-none focus:border-primary"
        />
        <div className="mt-1 h-6 text-right font-mono text-[15px] text-text-light">
          {result ? `= ${result}` : ""}
        </div>

        {/* Angle mode and memory */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border border-line">
            {(["deg", "rad"] as Angle[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAngle(mode)}
                aria-pressed={angle === mode}
                className={`px-3 py-1 text-[13px] ${
                  angle === mode ? "bg-primary-dark text-white" : "text-text-light"
                }`}
              >
                {mode === "deg" ? "Deg" : "Rad"}
              </button>
            ))}
          </div>
          <span className="ml-auto flex gap-1">
            {[
              { label: "MC", action: () => setMemory(0) },
              { label: "MR", action: () => append(String(memory)) },
              { label: "M+", action: () => setMemory((m) => m + currentValue()) },
              { label: "M−", action: () => setMemory((m) => m - currentValue()) },
            ].map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={m.action}
                className="rounded-[8px] border border-line px-2 py-1 text-[13px] text-text-light hover:border-line-strong"
              >
                {m.label}
              </button>
            ))}
          </span>
        </div>

        {/* Functions */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {funcs.map((fn) => (
            <button
              key={fn}
              type="button"
              onClick={() => append(`${fn}(`)}
              className="rounded-[8px] border border-line bg-background py-1.5 text-[13px] hover:border-line-strong"
            >
              {fn}
            </button>
          ))}
          {[
            { label: "xʸ", insert: "^" },
            { label: "x!", insert: "!" },
            { label: "π", insert: "pi" },
            { label: "e", insert: "e" },
            { label: "√", insert: "sqrt(" },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => append(b.insert)}
              className="rounded-[8px] border border-line bg-background py-1.5 text-[13px] hover:border-line-strong"
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Number pad */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {pad.map((key) => (
            <button
              key={key.label}
              type="button"
              onClick={() => (key.action ? key.action() : append(key.insert ?? ""))}
              className={`rounded-[10px] py-3 text-[17px] font-semibold ${
                key.accent
                  ? "bg-accent text-white"
                  : /[0-9.]/.test(key.label)
                    ? "bg-bg-soft hover:bg-line"
                    : "border border-line bg-background hover:border-line-strong"
              }`}
            >
              {key.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[13px] text-text-light">
        Type directly or use the pad. Enter works out the answer; the buttons cover trig, logs,
        powers, roots, factorial and memory. Trig follows the {angle === "deg" ? "degree" : "radian"}{" "}
        mode above.
      </p>
    </div>
  );
}
