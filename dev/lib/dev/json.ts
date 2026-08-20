/**
 * Formatting, minifying and validating JSON, with an error a person can act on.
 *
 * The whole value here is the error. `JSON.parse` throws a message whose wording
 * changes between browsers and whose position is a character offset, which is
 * useless to somebody looking at a 4000 line file. The offset is turned into a
 * line and a column, and the line itself is quoted back with a caret under the
 * character, so the answer is "here" rather than "somewhere".
 */

export type JsonError = {
  message: string;
  /** One-based, the way every editor counts. */
  line: number;
  column: number;
  /** The offending line, and a caret line under it. */
  excerpt: string;
};

export type JsonResult =
  | { ok: true; output: string }
  | { ok: false; error: JsonError };

/**
 * Where the parser gave up, as a character offset.
 *
 * V8 says "at position 42", newer V8 adds "(line 3 column 5)", Firefox says
 * "at line 3 column 5", Safari says something else again. Rather than parse
 * three dialects, this reads the offset when it is offered and gives up
 * gracefully when it is not: an error without a position still reports the
 * message, just without the caret.
 */
function offsetFrom(message: string): number | null {
  const position = /at position (\d+)/i.exec(message);
  if (position) return Number(position[1]);
  return null;
}

/** Turn a character offset into the line and column a person would count to. */
export function lineAndColumn(text: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lastBreak = -1;
  for (let i = 0; i < clamped; i++) {
    if (text[i] === "\n") {
      line++;
      lastBreak = i;
    }
  }
  return { line, column: clamped - lastBreak };
}

/** The offending line with a caret under the column, the way a compiler does it. */
export function excerpt(text: string, line: number, column: number): string {
  const source = text.split("\n")[line - 1] ?? "";
  // A very long line would push the caret off the end of the box, so it is
  // windowed around the column rather than shown whole.
  const WINDOW = 80;
  let start = 0;
  let shown = source;
  if (source.length > WINDOW && column > WINDOW / 2) {
    start = Math.min(column - WINDOW / 2, source.length - WINDOW);
    shown = `…${source.slice(start)}`;
    start -= 1;
  }
  if (shown.length > WINDOW + 1) shown = `${shown.slice(0, WINDOW + 1)}…`;

  const caretAt = Math.max(0, column - 1 - start);
  return `${shown}\n${" ".repeat(caretAt)}^`;
}

function toError(text: string, thrown: unknown): JsonError {
  const raw = thrown instanceof Error ? thrown.message : String(thrown);
  const offset = offsetFrom(raw);

  // Strip the engine's own position wording; the line and column replace it.
  const message = raw
    .replace(/^JSON\.parse:\s*/i, "")
    .replace(/\s*(in JSON )?at position \d+(\s*\(line \d+ column \d+\))?/i, "")
    .replace(/\s*at line \d+ column \d+.*$/i, "")
    .trim();

  if (offset === null) {
    return { message: message || "That is not valid JSON.", line: 0, column: 0, excerpt: "" };
  }

  const { line, column } = lineAndColumn(text, offset);
  return { message: message || "That is not valid JSON.", line, column, excerpt: excerpt(text, line, column) };
}

/** Parse, and hand back the value or a placed error. */
export function validateJson(text: string): { ok: true; value: unknown } | { ok: false; error: JsonError } {
  if (text.trim() === "") {
    return { ok: false, error: { message: "There is nothing to check yet.", line: 0, column: 0, excerpt: "" } };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (thrown) {
    return { ok: false, error: toError(text, thrown) };
  }
}

/** Pretty print with the given indent. Two spaces unless asked otherwise. */
export function formatJson(text: string, indent: number | "\t" = 2): JsonResult {
  const parsed = validateJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, output: JSON.stringify(parsed.value, null, indent) };
}

/** Every byte that is not structure, removed. */
export function minifyJson(text: string): JsonResult {
  const parsed = validateJson(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, output: JSON.stringify(parsed.value) };
}

/** What the input is, for the line that reports on a valid document. */
export function summarise(value: unknown): string {
  if (Array.isArray(value)) {
    return `an array of ${value.length} ${value.length === 1 ? "item" : "items"}`;
  }
  if (value === null) return "null";
  if (typeof value === "object") {
    const keys = Object.keys(value as object).length;
    return `an object with ${keys} ${keys === 1 ? "key" : "keys"}`;
  }
  return `a single ${typeof value} value`;
}

/** Bytes, as a person would say them. Used for the size line under the result. */
export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
