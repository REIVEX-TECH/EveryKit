"use client";

import { useMemo, useState } from "react";
import { load, dump, YAMLException } from "js-yaml";
import { CopyButton, Field, Note, Select, TextBox } from "./ui";

type Direction = "json-to-yaml" | "yaml-to-json";

const SAMPLE = '{\n  "name": "Ada",\n  "roles": ["admin", "author"],\n  "active": true\n}';

/** Line number of a character offset, 1-based, for a JSON.parse error. */
function lineAt(text: string, position: number): number {
  return text.slice(0, position).split("\n").length;
}

function convert(input: string, direction: Direction): { output: string } | { error: string } {
  if (input.trim() === "") return { output: "" };
  try {
    if (direction === "json-to-yaml") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(input);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const match = message.match(/position (\d+)/);
        const where = match ? ` (line ${lineAt(input, Number(match[1]))})` : "";
        return { error: `Invalid JSON${where}: ${message}` };
      }
      return { output: dump(parsed, { indent: 2, lineWidth: -1 }) };
    }
    const parsed = load(input);
    return { output: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    if (e instanceof YAMLException) {
      const line = e.mark ? ` (line ${e.mark.line + 1})` : "";
      return { error: `Invalid YAML${line}: ${e.reason}` };
    }
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export function JsonYamlTool() {
  const [direction, setDirection] = useState<Direction>("json-to-yaml");
  const [input, setInput] = useState(SAMPLE);

  const result = useMemo(() => convert(input, direction), [input, direction]);
  const output = "output" in result ? result.output : "";
  const error = "error" in result ? result.error : null;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Direction" htmlFor="direction">
        <Select id="direction" value={direction} onChange={(e) => setDirection(e.target.value as Direction)} className="sm:w-64">
          <option value="json-to-yaml">JSON to YAML</option>
          <option value="yaml-to-json">YAML to JSON</option>
        </Select>
      </Field>

      <Field label={direction === "json-to-yaml" ? "JSON" : "YAML"} htmlFor="input">
        <TextBox id="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste here" />
      </Field>

      {error ? <Note tone="bad">{error}</Note> : null}

      {output ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[14px] font-semibold">{direction === "json-to-yaml" ? "YAML" : "JSON"}</span>
            <CopyButton text={() => output} />
          </div>
          <TextBox readOnly value={output} aria-label="Result" />
        </div>
      ) : null}

      <Note tone="quiet">Converted in your browser with js-yaml in safe mode. Nothing you paste is sent anywhere.</Note>
    </div>
  );
}
