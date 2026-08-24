/**
 * Convert between CSV, JSON and XLSX, in the browser, through SheetJS.
 *
 * The three formats are all "a table, maybe several", so every conversion goes
 * through one intermediate: a SheetJS workbook. Read whatever came in into a
 * workbook, then write the workbook out in whatever was asked for. That keeps
 * the six directions as one read and one write rather than six special cases.
 *
 * The one honest limit, shared with the JSON to CSV tool: a table is flat.
 * Nested objects and arrays inside a JSON row do not become their own columns;
 * they are written as their JSON text in one cell. Spreadsheets have no idea
 * what a nested object is, and inventing a column-per-path guesses at a shape
 * the data does not promise.
 */

import * as XLSX from "xlsx";

export type DataFormat = "csv" | "json" | "xlsx";

export const FORMAT_LABELS: Record<DataFormat, string> = {
  csv: "CSV",
  json: "JSON",
  xlsx: "Excel (XLSX)",
};

/** Read the input into a workbook. `input` is text for CSV/JSON, bytes for XLSX. */
export function parseWorkbook(
  input: string | Uint8Array,
  format: DataFormat,
  delimiter = ",",
): XLSX.WorkBook {
  if (format === "json") {
    const text = typeof input === "string" ? input : new TextDecoder().decode(input);
    let rows: unknown;
    try {
      rows = JSON.parse(text);
    } catch {
      throw new Error("That is not valid JSON.");
    }
    if (!Array.isArray(rows)) {
      throw new Error("The JSON must be an array of rows, like [{...}, {...}].");
    }
    const flattened = rows.map(flattenRow);
    const sheet = XLSX.utils.json_to_sheet(flattened);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
    return wb;
  }

  if (format === "csv") {
    const text = typeof input === "string" ? input : new TextDecoder().decode(input);
    return XLSX.read(text, { type: "string", FS: delimiter, raw: false });
  }

  // xlsx
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return XLSX.read(bytes, { type: "array" });
}

/** The sheet names in a workbook, for the picker. */
export function sheetNames(wb: XLSX.WorkBook): string[] {
  return wb.SheetNames;
}

export type Output = {
  /** Set for text formats (CSV, JSON). */
  text?: string;
  /** Set for binary formats (XLSX). */
  bytes?: Uint8Array;
  mime: string;
  extension: string;
};

/** Write one sheet of the workbook out in the requested format. */
export function toOutput(
  wb: XLSX.WorkBook,
  sheetName: string,
  format: DataFormat,
  delimiter = ",",
): Output {
  const sheet = wb.Sheets[sheetName] ?? wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("There is no sheet to convert.");

  if (format === "csv") {
    return {
      text: XLSX.utils.sheet_to_csv(sheet, { FS: delimiter }),
      mime: "text/csv",
      extension: "csv",
    };
  }

  if (format === "json") {
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    return {
      text: JSON.stringify(rows, null, 2),
      mime: "application/json",
      extension: "json",
    };
  }

  // xlsx: a fresh workbook holding just this sheet.
  const out = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(out, sheet, sheetName.slice(0, 31) || "Sheet1");
  const bytes = XLSX.write(out, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return {
    bytes: new Uint8Array(bytes),
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
  };
}

/**
 * Flatten one JSON row to a single level. A nested object or array is written
 * as its JSON text, so the cell keeps the information without pretending to be
 * a set of columns the data never promised.
 */
function flattenRow(row: unknown): Record<string, unknown> {
  if (row === null || typeof row !== "object") return { value: row };
  if (Array.isArray(row)) {
    // An array row becomes numbered columns, which is what a table of arrays is.
    const out: Record<string, unknown> = {};
    row.forEach((cell, i) => {
      out[String(i + 1)] = scalarOrJson(cell);
    });
    return out;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    out[key] = scalarOrJson(value);
  }
  return out;
}

function scalarOrJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}
