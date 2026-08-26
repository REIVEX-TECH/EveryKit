"use client";

import { useMemo, useState } from "react";
import { jsonToTypes } from "@/lib/dev/jsonToTypes";
import { CopyButton, Field, Input, Note, TextBox } from "./ui";

const SAMPLE =
  '{\n  "id": 1,\n  "name": "Ada",\n  "tags": ["admin", "author"],\n  "address": { "city": "London", "zip": "N1" },\n  "orders": [{ "ref": "A1", "total": 9.99 }, { "ref": "A2" }]\n}';

function validName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]/g, "");
  return /^[A-Za-z]/.test(cleaned) ? cleaned : "Root";
}

export function JsonToTypesTool() {
  const [input, setInput] = useState(SAMPLE);
  const [rootName, setRootName] = useState("Root");

  const result = useMemo(() => {
    if (input.trim() === "") return { output: "" };
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const match = message.match(/position (\d+)/);
      const line = match ? input.slice(0, Number(match[1])).split("\n").length : null;
      return { error: `Invalid JSON${line ? ` (line ${line})` : ""}: ${message}` };
    }
    return { output: jsonToTypes(parsed, validName(rootName)) };
  }, [input, rootName]);

  const output = "output" in result ? result.output : "";
  const error = "error" in result ? result.error : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="JSON" htmlFor="input" className="sm:col-span-2">
          <TextBox id="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste a representative object" />
        </Field>
        <Field label="Root type name" htmlFor="root">
          <Input id="root" value={rootName} onChange={(e) => setRootName(e.target.value)} className="sm:w-64" />
        </Field>
      </div>

      {error ? <Note tone="bad">{error}</Note> : null}

      {output ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[14px] font-semibold">TypeScript</span>
            <CopyButton text={() => output} />
          </div>
          <TextBox readOnly value={output} aria-label="TypeScript interfaces" className="min-h-[220px]" />
        </div>
      ) : null}

      <Note tone="quiet">
        Types are inferred from one sample, so treat them as a first draft: a field that is null in your
        example but a string in real data will come out as null. Nothing you paste is sent anywhere.
      </Note>
    </div>
  );
}
