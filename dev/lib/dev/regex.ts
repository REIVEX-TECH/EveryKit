/**
 * Running a JavaScript regular expression against a test string, and reporting
 * what matched where.
 *
 * The dangerous part of this tool is not the regex, it is the page. A pattern
 * like `(a+)+b` against forty a's takes longer than the universe has left, and
 * JavaScript's regex engine has no timeout: once `exec` starts, the thread is
 * gone and the tab is a spinning beachball with no cancel button. So the real
 * work runs in a worker that gets killed after two seconds, and this file is
 * the pure part both sides share.
 */

export type Group = { name: string | null; value: string | undefined; index: number };

export type Match = {
  /** Offset in the test string, so the UI can highlight without searching again. */
  start: number;
  end: number;
  value: string;
  groups: Group[];
};

export type RegexOutcome =
  | { ok: true; matches: Match[]; truncated: boolean }
  | { ok: false; message: string };

/** Past this the list stops being a list and starts being a memory problem. */
export const MAX_MATCHES = 1000;

export const FLAGS = [
  { flag: "g", label: "global", note: "Find every match rather than stopping at the first." },
  { flag: "i", label: "ignore case", note: "Treat A and a as the same character." },
  { flag: "m", label: "multiline", note: "^ and $ match at every line break, not only the ends." },
  { flag: "s", label: "dotall", note: "Let . match a line break too." },
  { flag: "u", label: "unicode", note: "Read the pattern as Unicode code points, needed for \\p{...}." },
  { flag: "y", label: "sticky", note: "Match only at the position the last match ended." },
] as const;

/** Build the expression, or say why it will not build. */
export function compile(pattern: string, flags: string): { ok: true; regex: RegExp } | { ok: false; message: string } {
  if (pattern === "") return { ok: false, message: "Enter a pattern to test." };
  try {
    return { ok: true, regex: new RegExp(pattern, flags) };
  } catch (thrown) {
    const raw = thrown instanceof Error ? thrown.message : String(thrown);
    // V8 prefixes with the whole pattern, which is already on screen above.
    return { ok: false, message: raw.replace(/^Invalid regular expression:.*?:\s*/, "").trim() || raw };
  }
}

/**
 * Every match, with its groups.
 *
 * Without the `g` flag a regex matches once, and this returns that one match
 * rather than looping: `exec` on a non-global regex always restarts at zero, so
 * looping would never end. A zero-length match also has to be stepped past by
 * hand for the same reason.
 */
export function runRegex(pattern: string, flags: string, text: string): RegexOutcome {
  const built = compile(pattern, flags);
  if (!built.ok) return { ok: false, message: built.message };

  const { regex } = built;
  const matches: Match[] = [];
  let truncated = false;

  const collect = (found: RegExpExecArray): Match => {
    const groups: Group[] = [];
    const names = found.groups ? Object.keys(found.groups) : [];
    for (let i = 1; i < found.length; i++) {
      // A named group is also a numbered one, so the name is looked up by the
      // value's position rather than listed twice.
      const name = names.find((key) => found.groups?.[key] === found[i]) ?? null;
      groups.push({ name, value: found[i], index: i });
    }
    return { start: found.index, end: found.index + found[0].length, value: found[0], groups };
  };

  if (!regex.global && !regex.sticky) {
    const found = regex.exec(text);
    return { ok: true, matches: found ? [collect(found)] : [], truncated: false };
  }

  regex.lastIndex = 0;
  let found: RegExpExecArray | null;
  while ((found = regex.exec(text)) !== null) {
    matches.push(collect(found));
    if (found[0] === "") regex.lastIndex++;
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
      break;
    }
  }

  return { ok: true, matches, truncated };
}

/**
 * The test string split into runs, so the UI can paint the matched parts
 * without doing the matching a second time.
 */
export function highlight(text: string, matches: Match[]): Array<{ text: string; matched: boolean }> {
  if (matches.length === 0) return [{ text, matched: false }];

  const out: Array<{ text: string; matched: boolean }> = [];
  let at = 0;
  for (const match of matches) {
    // Overlaps cannot happen with exec, but a zero-length match can repeat a
    // position, and slicing backwards would duplicate text on screen.
    if (match.start < at) continue;
    if (match.start > at) out.push({ text: text.slice(at, match.start), matched: false });
    if (match.end > match.start) out.push({ text: text.slice(match.start, match.end), matched: true });
    at = Math.max(at, match.end);
  }
  if (at < text.length) out.push({ text: text.slice(at), matched: false });
  return out;
}
