"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Download } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { hasGivenEmail } from "@/lib/emailCapture";
import type { ToolSlug } from "@/data/tools";
import { countAll, describeReadingTime } from "@/lib/text/count";
import {
  cleanText,
  looksAllCaps,
  NO_CLEANING,
  toLower,
  toSentence,
  toTitle,
  toUpper,
  type CleanOptions,
} from "@/lib/text/transform";
import { generateLorem } from "@/lib/text/lorem";

type CaseMode = "upper" | "lower" | "title" | "sentence";

const SAMPLE =
  "The quick brown fox jumps over the lazy dog. NASA sent a PDF about it. Then it slept.";

export function Workbench({ tool }: { tool: ToolSlug }) {
  const [input, setInput] = useState("");
  const [caseMode, setCaseMode] = useState<CaseMode>("sentence");
  const [clean, setClean] = useState<CleanOptions>({ ...NO_CLEANING, collapseSpaces: true });
  const [unit, setUnit] = useState<"paragraphs" | "words">("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const counts = useMemo(() => countAll(input), [input]);

  const output = useMemo(() => {
    if (tool === "word-counter") return input;
    if (tool === "case-converter") {
      if (caseMode === "upper") return toUpper(input);
      if (caseMode === "lower") return toLower(input);
      if (caseMode === "title") return toTitle(input);
      return toSentence(input);
    }
    if (tool === "clean-text") return cleanText(input, clean);
    return generateLorem({ unit, count, startWithClassic: classic });
  }, [tool, input, caseMode, clean, unit, count, classic]);

  const outputCounts = useMemo(() => countAll(output), [output]);

  function take(action: () => void) {
    if (hasGivenEmail()) {
      action();
      return;
    }
    setGateFor(() => action);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission can be refused. Selecting the text is the fallback
      // everyone already knows, so say that rather than showing an error.
      outputRef.current?.select();
    }
  }

  function saveTxt() {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tool}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  const showsInput = tool !== "lorem-ipsum";

  return (
    <div className="flex flex-col gap-6">
      {showsInput ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="input" className="text-[14px] font-semibold">
              Your text
            </label>
            <button
              type="button"
              onClick={() => setInput(SAMPLE)}
              className="inline-flex min-h-[24px] items-center text-[14px] text-text-light hover:text-primary-dark"
            >
              Use a sample
            </button>
          </div>
          <textarea
            id="input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={8}
            placeholder="Paste or type here. Everything updates as you go."
            className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
          />
        </div>
      ) : null}

      {tool === "word-counter" ? <Counts counts={counts} /> : null}

      {tool === "case-converter" ? (
        <>
          <fieldset>
            <legend className="text-[14px] font-semibold">Convert to</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["upper", "UPPER CASE"],
                  ["lower", "lower case"],
                  ["title", "Title Case"],
                  ["sentence", "Sentence case"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCaseMode(value)}
                  aria-pressed={caseMode === value}
                  className={[
                    "inline-flex min-h-[36px] items-center rounded-full border px-4 py-2 text-[14px] transition-colors",
                    caseMode === value
                      ? "border-primary-dark bg-primary-dark text-white"
                      : "border-line text-text-light hover:border-line-strong hover:text-foreground",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          {looksAllCaps(input) ? (
            <p className="max-w-[64ch] text-[13px] text-warn">
              This text is all capitals, so the acronym rule reads it as one long acronym and
              leaves it alone. Convert to lower case first, then to the case you wanted.
            </p>
          ) : null}
        </>
      ) : null}

      {tool === "clean-text" ? (
        <fieldset>
          <legend className="text-[14px] font-semibold">What to fix</legend>
          <div className="mt-2 flex flex-col gap-2">
            {(
              [
                ["collapseSpaces", "Trim extra spaces, and the ends of each line"],
                ["removeLineBreaks", "Remove line breaks, joining into one paragraph"],
                ["removeDuplicateLines", "Remove duplicate lines, keeping the first"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={clean[key]}
                  onChange={(event) =>
                    setClean((current) => ({ ...current, [key]: event.target.checked }))
                  }
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {tool === "lorem-ipsum" ? (
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="text-[14px] font-semibold">Measure by</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["paragraphs", "words"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUnit(value)}
                  aria-pressed={unit === value}
                  className={[
                    "inline-flex min-h-[36px] items-center rounded-full border px-4 py-2 text-[14px] transition-colors",
                    unit === value
                      ? "border-primary-dark bg-primary-dark text-white"
                      : "border-line text-text-light hover:border-line-strong hover:text-foreground",
                  ].join(" ")}
                >
                  {value === "paragraphs" ? "Paragraphs" : "Words"}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="count" className="block text-[14px] font-semibold">
              How many {unit}
            </label>
            <input
              id="count"
              type="number"
              inputMode="numeric"
              min={1}
              max={unit === "words" ? 2000 : 50}
              value={count}
              onChange={(event) => setCount(Number(event.target.value) || 1)}
              className="mt-2 w-[140px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={classic}
              onChange={(event) => setClassic(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Start with the classic opening
          </label>
        </div>
      ) : null}

      {tool !== "word-counter" ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="output" className="text-[14px] font-semibold">
              Result
            </label>
            <p className="text-[13px] text-text-light">
              {outputCounts.words} {outputCounts.words === 1 ? "word" : "words"},{" "}
              {outputCounts.characters} characters
            </p>
          </div>
          <textarea
            id="output"
            ref={outputRef}
            value={output}
            readOnly
            rows={8}
            className="mt-2 w-full rounded-[10px] border border-line bg-bg-soft px-3 py-2 text-[15px] outline-none"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => take(() => void copy())}
          disabled={output === ""}
          className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy aria-hidden="true" className="h-4 w-4" />
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => take(saveTxt)}
          disabled={output === ""}
          className="ek-btn ek-btn-quiet disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Download .txt
        </button>
      </div>

      {gateFor ? (
        <EmailGate
          actionLabel="Continue"
          onDone={() => {
            gateFor();
            setGateFor(null);
          }}
          onCancel={() => setGateFor(null)}
        />
      ) : null}
    </div>
  );
}

function Counts({ counts }: { counts: ReturnType<typeof countAll> }) {
  const rows: Array<[string, string]> = [
    ["Words", String(counts.words)],
    ["Characters", String(counts.characters)],
    ["Characters without spaces", String(counts.charactersNoSpaces)],
    ["Sentences", String(counts.sentences)],
    ["Paragraphs", String(counts.paragraphs)],
  ];

  return (
    <div className="ek-card p-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[13px] text-text-light">{label}</dt>
            <dd className="text-[22px] font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-line pt-3 text-[14px] text-text-light">
        {describeReadingTime(counts.words)}, at 200 words a minute.
      </p>
    </div>
  );
}
