/**
 * Line and search operations, kept apart from the React so the fiddly parts
 * are tested directly.
 *
 * The fiddly parts are real: a regex the user typed can be invalid and must
 * fail with a message rather than throw; a "replace all" has to report how many
 * it changed or the user cannot tell it did anything; a natural sort has to put
 * "file10" after "file2"; and de-duplicating has to agree with itself about
 * what "the same line" means once trimming and case are in play.
 */

// ---------------------------------------------------------------------------
// Find and replace
// ---------------------------------------------------------------------------

export type FindReplaceOptions = {
  find: string;
  replace: string;
  /** Treat `find` as a regular expression rather than literal text. */
  regex: boolean;
  caseSensitive: boolean;
};

export type FindReplaceResult =
  | { ok: true; output: string; count: number }
  | { ok: false; error: string };

/** Escape a literal string so it matches itself when used as a regex. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace every match, and say how many there were.
 *
 * A global regex is used for both modes so the count is exact; in plain mode
 * the needle is escaped first, which is the whole difference between the two.
 * `$` in the replacement is escaped in plain mode so a literal "$1" does not
 * silently become a back-reference to something the user never wrote.
 */
export function findReplace(text: string, options: FindReplaceOptions): FindReplaceResult {
  if (options.find === "") {
    return { ok: false, error: "Type what you want to find." };
  }

  const flags = options.caseSensitive ? "g" : "gi";
  let pattern: RegExp;
  try {
    pattern = new RegExp(
      options.regex ? options.find : escapeRegex(options.find),
      flags,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid pattern";
    return { ok: false, error: `That is not a valid regular expression: ${detail}.` };
  }

  // In plain mode the replacement is literal too, so a `$` in it is neutralised.
  // In regex mode it is passed through, so $1 and friends work as expected.
  const replacement = options.regex ? options.replace : options.replace.replace(/\$/g, "$$$$");

  // Counted with a separate pass rather than a replacer function, because a
  // function replacer would have to return the final text itself and so could
  // not let the engine expand $1-style back-references in regex mode.
  let count = 0;
  for (const _match of text.matchAll(pattern)) {
    void _match;
    count += 1;
  }
  const output = text.replace(pattern, replacement);

  return { ok: true, output, count };
}

// ---------------------------------------------------------------------------
// Remove duplicate lines
// ---------------------------------------------------------------------------

export type DedupeOptions = {
  /** Ignore leading and trailing whitespace when comparing. */
  trim: boolean;
  caseInsensitive: boolean;
};

export type DedupeResult = { output: string; removed: number };

/**
 * Keep the first appearance of each line and drop the rest.
 *
 * The line is kept exactly as written; only the comparison key is trimmed or
 * lower-cased, so "keep the first" does not quietly also mean "and rewrite it".
 * The split tolerates CRLF and lone CR so pasting from Windows or an old Mac
 * does not leave stray carriage returns changing what counts as a duplicate.
 */
export function removeDuplicateLines(text: string, options: DedupeOptions): DedupeResult {
  const lines = text.split(/\r\n|\r|\n/);
  const seen = new Set<string>();
  const kept: string[] = [];
  let removed = 0;

  for (const line of lines) {
    let key = options.trim ? line.trim() : line;
    if (options.caseInsensitive) key = key.toLowerCase();

    if (seen.has(key)) {
      removed += 1;
      continue;
    }
    seen.add(key);
    kept.push(line);
  }

  return { output: kept.join("\n"), removed };
}

// ---------------------------------------------------------------------------
// Sort lines
// ---------------------------------------------------------------------------

export type SortOrder = "az" | "za" | "natural" | "shuffle";

/**
 * A comparator that reads runs of digits as numbers, so "file2" sorts before
 * "file10". Plain alphabetical order puts "file10" first because "1" is below
 * "2" character by character, which is almost never what a person means.
 */
export function naturalCompare(a: string, b: string): number {
  const chunk = /(\d+|\D+)/g;
  const as = a.match(chunk) ?? [];
  const bs = b.match(chunk) ?? [];
  const n = Math.min(as.length, bs.length);
  for (let i = 0; i < n; i++) {
    const ai = as[i];
    const bi = bs[i];
    const bothNumbers = /^\d/.test(ai) && /^\d/.test(bi);
    if (bothNumbers) {
      const d = Number(ai) - Number(bi);
      if (d !== 0) return d;
    } else if (ai !== bi) {
      return ai < bi ? -1 : 1;
    }
  }
  return as.length - bs.length;
}

export type SortResult = { output: string };

/**
 * Sort the lines, or shuffle them.
 *
 * A trailing newline is preserved: a file that ended in one still does, so
 * sorting does not silently join the last line to whatever a later paste adds.
 * The shuffle takes a random source so it can be tested with a fixed one;
 * the component passes Math.random.
 */
export function sortLines(
  text: string,
  order: SortOrder,
  random: () => number = Math.random,
): SortResult {
  if (text === "") return { output: "" };

  const hadTrailingNewline = /\n$/.test(text);
  const normalised = text.replace(/\r\n|\r/g, "\n");
  const trailing = hadTrailingNewline ? "\n" : "";
  const body = hadTrailingNewline ? normalised.replace(/\n$/, "") : normalised;
  const lines = body.split("\n");

  let sorted: string[];
  if (order === "az") {
    sorted = [...lines].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  } else if (order === "za") {
    sorted = [...lines].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  } else if (order === "natural") {
    sorted = [...lines].sort(naturalCompare);
  } else {
    // Fisher-Yates, with the random source injected for testability.
    sorted = [...lines];
    for (let i = sorted.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
  }

  return { output: sorted.join("\n") + trailing };
}
