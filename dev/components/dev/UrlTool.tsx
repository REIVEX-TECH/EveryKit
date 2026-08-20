"use client";

import { useState } from "react";
import { URL_MODE_NOTE, decodeUrl, encodeUrl, type UrlMode } from "@/lib/dev/encode";
import { CopyButton, Note, TextBox } from "./ui";

/**
 * URL encoding, with the one distinction that matters made visible.
 *
 * Component versus full URL is the entire tool. Somebody who escapes a whole
 * URL with the component rule gets their slashes turned into %2F and a link
 * that goes nowhere; somebody who escapes a query value with the full rule
 * leaves an ampersand in it and splits their own parameter in two. The note
 * under the switch says which is which, in one line, every time.
 */
export function UrlTool() {
  const [mode, setMode] = useState<UrlMode>("component");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState("");

  function run(nextDirection: "encode" | "decode", nextMode: UrlMode, text: string) {
    setError(null);
    if (text === "") {
      setOutput("");
      return;
    }
    if (nextDirection === "encode") {
      setOutput(encodeUrl(text, nextMode));
      return;
    }
    const result = decodeUrl(text, nextMode);
    if (result.ok) setOutput(result.text);
    else {
      setOutput("");
      setError(result.message);
    }
  }

  const pill = (active: boolean) =>
    `rounded-full px-4 py-2 text-[14px] font-semibold ${
      active ? "bg-primary-dark text-white" : "border border-line bg-background hover:border-line-strong"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-5">
        <fieldset>
          <legend className="text-[14px] font-semibold">Direction</legend>
          <div className="mt-2 flex gap-2">
            {(["encode", "decode"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => {
                  setDirection(value);
                  run(value, mode, input);
                }}
                className={pill(direction === value)}
              >
                {value === "encode" ? "Encode" : "Decode"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[14px] font-semibold">Rule</legend>
          <div className="mt-2 flex gap-2">
            {(["component", "full"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  run(direction, value, input);
                }}
                className={pill(mode === value)}
              >
                {value === "component" ? "Component" : "Whole URL"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="max-w-[70ch] text-[14px] text-text-light">{URL_MODE_NOTE[mode]}</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="url-in" className="block text-[14px] font-semibold">
            Input
          </label>
          <TextBox
            id="url-in"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              run(direction, mode, event.target.value);
            }}
            placeholder={
              mode === "component" ? "search terms & symbols" : "https://example.com/a path?q=1"
            }
            className="mt-2 min-h-[160px]"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[14px] font-semibold">Result</h2>
            {output !== "" ? (
              <CopyButton text={output} className="ek-btn ek-btn-accent px-4 py-2 text-[14px]" />
            ) : null}
          </div>
          <TextBox
            id="url-out"
            readOnly
            value={output}
            aria-label="Result"
            className="mt-2 min-h-[160px] bg-bg-soft"
          />
          {error ? <Note tone="bad">{error}</Note> : null}
        </div>
      </div>
    </div>
  );
}
