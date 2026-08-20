"use client";

import { useState } from "react";
import { humanBytes, summarise, validateJson, type JsonError } from "@/lib/dev/json";
import { jsonInWorker } from "@/lib/dev/work";
import { CodeBlock, CopyButton, DownloadButton, Note, TextBox } from "./ui";

/**
 * Format, minify, validate.
 *
 * The work goes to a worker rather than running here, because five megabytes
 * through parse and stringify is a few hundred milliseconds of frozen tab and a
 * frozen tab reads as broken. Validation of small input still runs inline: it
 * is the thing that has to feel instant, and spinning up a worker to check
 * forty characters would make it slower rather than faster.
 */
export function JsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<JsonError | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [indent, setIndent] = useState(2);

  async function transform(action: "format" | "minify") {
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const result = await jsonInWorker(action, input, indent);
      if (result.ok) {
        setOutput(result.output);
        const parsed = validateJson(input);
        setSummary(
          parsed.ok
            ? `Valid JSON, ${summarise(parsed.value)}. ${humanBytes(new Blob([result.output]).size)} out, ${humanBytes(new Blob([input]).size)} in.`
            : null,
        );
      } else {
        setOutput("");
        setError(result.error);
      }
    } catch (thrown) {
      setOutput("");
      setError({
        message: thrown instanceof Error ? thrown.message : "That could not be worked out.",
        line: 0,
        column: 0,
        excerpt: "",
      });
    } finally {
      setBusy(false);
    }
  }

  function check() {
    const result = validateJson(input);
    setOutput("");
    if (result.ok) {
      setError(null);
      setSummary(`Valid JSON, ${summarise(result.value)}.`);
    } else {
      setSummary(null);
      setError(result.error);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <label htmlFor="json-in" className="block text-[14px] font-semibold">
          JSON
        </label>
        <TextBox
          id="json-in"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'{"paste": "your JSON here"}'}
          className="mt-2 min-h-[320px]"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void transform("format")}
            disabled={busy || input.trim() === ""}
            className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Working" : "Format"}
          </button>
          <button
            type="button"
            onClick={() => void transform("minify")}
            disabled={busy || input.trim() === ""}
            className="ek-btn ek-btn-quiet disabled:cursor-not-allowed disabled:opacity-50"
          >
            Minify
          </button>
          <button
            type="button"
            onClick={check}
            disabled={input.trim() === ""}
            className="ek-btn ek-btn-quiet disabled:cursor-not-allowed disabled:opacity-50"
          >
            Check only
          </button>

          <label htmlFor="json-indent" className="ml-1 text-[13px] text-text-light">
            Indent
          </label>
          <select
            id="json-indent"
            value={indent}
            onChange={(event) => setIndent(Number(event.target.value))}
            className="rounded-[10px] border border-line bg-background px-2 py-1.5 text-[14px] outline-none focus:border-primary"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[14px] font-semibold">Result</h2>
          {output !== "" ? (
            <div className="flex gap-2">
              <CopyButton text={output} className="ek-btn ek-btn-accent px-4 py-2 text-[14px]" />
              <DownloadButton
                build={() => new Blob([output], { type: "application/json" })}
                filename="formatted.json"
                label="Save"
                className="ek-btn ek-btn-quiet px-4 py-2 text-[14px]"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-2">
          {error ? (
            <div className="ek-card border-danger/40 p-3">
              <Note tone="bad">
                {error.line > 0
                  ? `Line ${error.line}, column ${error.column}: ${error.message}`
                  : error.message}
              </Note>
              {error.excerpt ? (
                <pre className="mt-2 overflow-x-auto bg-bg-soft p-2 font-mono text-[13px] leading-tight">
                  {error.excerpt}
                </pre>
              ) : null}
            </div>
          ) : output !== "" ? (
            <CodeBlock className="min-h-[320px]">{output}</CodeBlock>
          ) : (
            <div className="ek-card flex min-h-[320px] items-center justify-center bg-bg-soft p-4">
              <p className="text-[14px] text-text-light">The result appears here.</p>
            </div>
          )}
          {summary ? <p className="mt-2 text-[13px] text-text-light">{summary}</p> : null}
        </div>
      </div>
    </div>
  );
}
