"use client";

import { useMemo, useState } from "react";
import { parseCurl } from "@/lib/dev/curl";
import { toFetch, toAxios, toPython } from "@/lib/dev/curlGen";
import { CopyButton, Field, Note, TextBox } from "./ui";

type Target = "fetch" | "axios" | "python";

const TARGETS: Array<{ id: Target; label: string }> = [
  { id: "fetch", label: "fetch" },
  { id: "axios", label: "axios" },
  { id: "python", label: "Python requests" },
];

const SAMPLE = `curl -X POST https://api.example.com/login \\
  -H "Content-Type: application/json" \\
  -d '{"user":"ada","password":"secret"}'`;

export function CurlConverterTool() {
  const [input, setInput] = useState(SAMPLE);
  const [target, setTarget] = useState<Target>("fetch");

  const result = useMemo(() => {
    const parsed = parseCurl(input);
    if ("error" in parsed) return { ok: false as const, error: parsed.error };
    return {
      ok: true as const,
      code: { fetch: toFetch(parsed.parsed), axios: toAxios(parsed.parsed), python: toPython(parsed.parsed) },
      unsupported: parsed.parsed.unsupported,
    };
  }, [input]);

  return (
    <div className="flex flex-col gap-4">
      <Field label="curl command" htmlFor="curl">
        <TextBox id="curl" value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[120px]" placeholder="Paste a curl command" />
      </Field>

      {result.ok === false ? (
        result.error ? <Note tone="bad">{result.error}</Note> : null
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={target === t.id}
                onClick={() => setTarget(t.id)}
                className={`rounded-full border px-4 py-1.5 text-[14px] ${
                  target === t.id ? "border-primary-dark bg-primary-dark text-white" : "border-line text-text-light hover:border-line-strong"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[14px] font-semibold">{TARGETS.find((t) => t.id === target)?.label}</span>
              <CopyButton text={() => result.code[target]} />
            </div>
            <TextBox readOnly value={result.code[target]} aria-label="Generated code" className="min-h-[180px]" />
          </div>

          {result.unsupported.length > 0 ? (
            <Note tone="bad">
              Not carried over: {result.unsupported.join(", ")}. The rest of the request is converted; add these by hand if you need them.
            </Note>
          ) : null}
        </>
      )}

      <Note tone="quiet">Parsed and converted in your browser. Nothing you paste is sent anywhere.</Note>
    </div>
  );
}
