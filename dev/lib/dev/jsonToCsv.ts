/**
 * Turning a JSON array of objects into CSV.
 *
 * The honest scope is flat objects and one level of nesting: a nested object
 * becomes dotted columns (address.city), and anything deeper is written as its
 * JSON text in a single cell rather than pretended into columns. The copy says
 * so, because a converter that silently drops or mangles deep data is worse
 * than one that admits the limit.
 *
 * The fiddly part is quoting, and it is where CSV tools break: a value with a
 * comma, a quote, or a newline has to be wrapped in quotes with its own quotes
 * doubled, or the row splits in the wrong places when it is opened. Pure, so
 * every quoting corner is tested.
 */

export type CsvResult =
  | { ok: true; csv: string; columns: string[]; rows: number }
  | { ok: false; error: string };

type Row = Record<string, unknown>;

/** A cell value flattened to a string, one level deep. */
function flattenInto(target: Row, key: string, value: unknown): void {
  if (value === null || value === undefined) {
    target[key] = "";
    return;
  }
  if (Array.isArray(value)) {
    // An array is not a set of columns, so it is written as its JSON text.
    target[key] = JSON.stringify(value);
    return;
  }
  if (typeof value === "object") {
    // One level of nesting becomes dotted columns; deeper stays JSON text.
    for (const [k, v] of Object.entries(value as Row)) {
      if (v !== null && typeof v === "object") {
        target[`${key}.${k}`] = JSON.stringify(v);
      } else {
        target[`${key}.${k}`] = v === null || v === undefined ? "" : String(v);
      }
    }
    return;
  }
  target[key] = String(value);
}

/** Quote a field if it contains the delimiter, a quote, or a line break. */
function quoteField(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || /[\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export type CsvOptions = {
  /** One character: comma, semicolon or tab. */
  delimiter: string;
};

/**
 * Convert parsed JSON to CSV.
 *
 * Accepts an array of objects, or a single object (treated as one row). The
 * column set is the union of every row's keys, in first-seen order, so a row
 * missing a field gets an empty cell rather than a shifted row.
 */
export function jsonToCsv(parsed: unknown, options: CsvOptions): CsvResult {
  const delimiter = options.delimiter === "\\t" ? "\t" : options.delimiter;

  const array = Array.isArray(parsed) ? parsed : [parsed];
  if (array.length === 0) return { ok: false, error: "The array is empty, so there is nothing to convert." };

  const flatRows: Row[] = [];
  const columns: string[] = [];
  const seen = new Set<string>();

  for (const entry of array) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return {
        ok: false,
        error: "Every item needs to be an object. An array of plain values or arrays is not a table.",
      };
    }
    const flat: Row = {};
    for (const [key, value] of Object.entries(entry as Row)) {
      flattenInto(flat, key, value);
    }
    for (const key of Object.keys(flat)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
    flatRows.push(flat);
  }

  const header = columns.map((c) => quoteField(c, delimiter)).join(delimiter);
  const body = flatRows.map((row) =>
    columns.map((col) => quoteField(col in row ? String(row[col]) : "", delimiter)).join(delimiter),
  );

  return {
    ok: true,
    csv: [header, ...body].join("\r\n"),
    columns,
    rows: flatRows.length,
  };
}

/** Parse text as JSON, then convert. Kept together so the UI has one entry point. */
export function textToCsv(text: string, options: CsvOptions): CsvResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: false, error: "Paste some JSON to convert." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid JSON";
    return { ok: false, error: `That is not valid JSON: ${detail}.` };
  }
  return jsonToCsv(parsed, options);
}
