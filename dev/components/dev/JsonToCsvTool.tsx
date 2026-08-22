"use client";

import { useMemo, useState } from "react";
import { textToCsv } from "@/lib/dev/jsonToCsv";
import { CopyButton, DownloadButton, Field, Note, Select, TextBox } from "./ui";

const SAMPLE = JSON.stringify(
  [
    { name: "Ada", role: "Engineer", address: { city: "London" } },
    { name: "Alan", role: "Mathematician", address: { city: "Manchester" } },
  ],
  null,
  2,
);

type Delim = "," | ";" | "\\t";

/**
 * JSON array to CSV, honest about its scope: flat objects and one level of
 * nesting. A nested object becomes dotted columns; anything deeper is written
 * as its JSON text in a cell rather than pretended into a table.
 */
export function JsonToCsvTool() {
  const [source, setSource] = useState("");
  const [delimiter, setDelimiter] = useState<Delim>(",");

  const result = useMemo(() => textToCsv(source, { delimiter }), [source, delimiter]);
  const hasInput = source.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Field label="Separator" htmlFor="delim" className="w-auto">
          <Select
            id="delim"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value as Delim)}
            className="w-auto"
          >
            <option value=",">Comma (.csv)</option>
            <option value=";">Semicolon</option>
            <option value="\t">Tab (.tsv)</option>
          </Select>
        </Field>
        <button
          type="button"
          onClick={() => setSource(SAMPLE)}
          className="inline-flex min-h-[24px] items-center text-[14px] text-text-light hover:text-primary-dark"
        >
          Use a sample
        </button>
      </div>

      <div>
        <label htmlFor="json-source" className="block text-[14px] font-semibold">
          JSON
        </label>
        <TextBox
          id="json-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={10}
          placeholder='[{"name": "Ada", "role": "Engineer"}]'
          className="mt-2 font-mono text-[14px]"
        />
        <p className="mt-1 text-[13px] text-text-light">
          An array of objects. One level of nesting becomes dotted columns like address.city;
          deeper structures and arrays are written as JSON text in a cell.
        </p>
      </div>

      {hasInput && !result.ok ? (
        <Note tone="bad">{result.error}</Note>
      ) : result.ok ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="csv-out" className="text-[14px] font-semibold">
              CSV
            </label>
            <p className="text-[13px] text-text-light">
              {result.rows} {result.rows === 1 ? "row" : "rows"}, {result.columns.length}{" "}
              {result.columns.length === 1 ? "column" : "columns"}
            </p>
          </div>
          <TextBox
            id="csv-out"
            value={result.csv}
            readOnly
            rows={10}
            className="mt-2 bg-bg-soft font-mono text-[14px]"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={() => result.csv} label="Copy CSV" />
            <DownloadButton
              build={() => new Blob([result.csv], { type: "text/csv;charset=utf-8" })}
              filename={delimiter === "\\t" ? "data.tsv" : "data.csv"}
              label="Download"
              className="ek-btn ek-btn-quiet"
            />
          </div>
        </div>
      ) : (
        <Note tone="quiet">Paste a JSON array of objects to convert.</Note>
      )}
    </div>
  );
}
