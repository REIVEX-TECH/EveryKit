"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyButton, DownloadButton, Field, Note, Select, TextBox } from "@/components/dev/ui";
import {
  FORMAT_LABELS,
  parseWorkbook,
  sheetNames,
  toOutput,
  type DataFormat,
  type Output,
} from "@/lib/dev/convertData";

const FORMATS: DataFormat[] = ["csv", "json", "xlsx"];

const DELIMITERS: Array<{ value: string; label: string }> = [
  { value: ",", label: "Comma" },
  { value: ";", label: "Semicolon" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe" },
];

const EXTENSIONS: Record<DataFormat, string[]> = {
  csv: [".csv", ".tsv", ".txt"],
  json: [".json"],
  xlsx: [".xlsx", ".xls"],
};

export function ConvertDataTool() {
  const [from, setFrom] = useState<DataFormat>("csv");
  const [to, setTo] = useState<DataFormat>("json");
  const [delimiter, setDelimiter] = useState(",");

  const [text, setText] = useState("");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");

  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usesDelimiter = from === "csv" || to === "csv";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setOutput(null);
    const buffer = new Uint8Array(await file.arrayBuffer());
    setBytes(buffer);
    setFileName(file.name);

    // Guess the input format from the extension, so the common case needs no
    // fiddling. The person can still override it.
    const lower = file.name.toLowerCase();
    const guessed = (Object.keys(EXTENSIONS) as DataFormat[]).find((format) =>
      EXTENSIONS[format].some((ext) => lower.endsWith(ext)),
    );
    const nextFrom = guessed ?? from;
    setFrom(nextFrom);
    if (nextFrom !== "xlsx") setText(new TextDecoder().decode(buffer));

    if (nextFrom === "xlsx") {
      try {
        const wb = parseWorkbook(buffer, "xlsx");
        const names = sheetNames(wb);
        setSheets(names);
        setSheet(names[0] ?? "");
      } catch {
        setSheets([]);
      }
    } else {
      setSheets([]);
    }
  }

  const canConvert = from === "xlsx" ? bytes !== null : text.trim() !== "";

  function convert() {
    setError(null);
    setOutput(null);
    try {
      const source: string | Uint8Array =
        from === "xlsx" ? (bytes ?? new Uint8Array()) : text;
      const wb = parseWorkbook(source, from, delimiter);
      const chosen = sheet || wb.SheetNames[0];
      setOutput(toOutput(wb, chosen, to, delimiter));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That could not be converted.");
    }
  }

  const outName = useMemo(
    () => `converted.${output?.extension ?? to}`,
    [output?.extension, to],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Convert from" htmlFor="from">
          <Select
            id="from"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value as DataFormat);
              setOutput(null);
            }}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Convert to" htmlFor="to">
          <Select
            id="to"
            value={to}
            onChange={(e) => {
              setTo(e.target.value as DataFormat);
              setOutput(null);
            }}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {usesDelimiter ? (
        <Field
          label="CSV delimiter"
          htmlFor="delimiter"
          note="The character between fields, for reading and writing CSV."
        >
          <Select
            id="delimiter"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="sm:max-w-[220px]"
          >
            {DELIMITERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field
        label="Your file"
        htmlFor="file"
        note={
          from === "xlsx"
            ? "Excel files are binary, so choose a file rather than pasting."
            : "Choose a file, or paste the data below."
        }
      >
        <input
          id="file"
          type="file"
          accept={FORMATS.flatMap((f) => EXTENSIONS[f]).join(",")}
          onChange={(e) => void onFile(e.target.files?.[0])}
          className="block w-full text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white"
        />
        {fileName ? <span className="mt-1 block text-[13px] text-text-light">{fileName}</span> : null}
      </Field>

      {sheets.length > 1 ? (
        <Field label="Which sheet" htmlFor="sheet">
          <Select
            id="sheet"
            value={sheet}
            onChange={(e) => setSheet(e.target.value)}
            className="sm:max-w-[280px]"
          >
            {sheets.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {from !== "xlsx" ? (
        <Field label={`Or paste ${FORMAT_LABELS[from]}`} htmlFor="paste">
          <TextBox
            id="paste"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setBytes(null);
              setFileName(null);
              setOutput(null);
            }}
            placeholder={from === "json" ? '[{"name":"Ada","age":36}]' : "name,age\nAda,36"}
          />
        </Field>
      ) : null}

      <div>
        <button
          type="button"
          onClick={convert}
          disabled={!canConvert}
          className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Convert to {FORMAT_LABELS[to]}
        </button>
      </div>

      {error ? <Note tone="bad">{error}</Note> : null}

      {output ? (
        <div className="flex flex-col gap-3">
          {output.text !== undefined ? (
            <TextBox readOnly value={output.text} className="min-h-[220px]" />
          ) : (
            <Note tone="quiet">
              Your Excel file is ready. Spreadsheets are binary, so there is nothing to show here;
              download it below.
            </Note>
          )}
          <div className="flex flex-wrap gap-2">
            {output.text !== undefined ? <CopyButton text={output.text} label="Copy" /> : null}
            <DownloadButton
              build={() =>
                output.bytes !== undefined
                  ? new Blob([output.bytes.slice()], { type: output.mime })
                  : new Blob([output.text ?? ""], { type: output.mime })
              }
              filename={outName}
              label={`Download .${output.extension}`}
              className="ek-btn ek-btn-accent"
            />
          </div>
        </div>
      ) : null}

      <Note tone="quiet">
        A table is flat. Nested objects or arrays inside JSON rows are written as their JSON text in
        one cell, not spread across columns. For turning JSON into CSV specifically, the{" "}
        <Link href="/json-to-csv" className="ek-link">
          JSON to CSV
        </Link>{" "}
        tool covers the same ground.
      </Note>
    </div>
  );
}
