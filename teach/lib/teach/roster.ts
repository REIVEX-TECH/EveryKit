/**
 * A class list, parsed and shuffled. Shared by the picker, the group maker and
 * the seating chart, so a name is trimmed and a blank line dropped the same way
 * everywhere.
 */

/** One name per line, trimmed, blanks removed. */
export function parseRoster(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/**
 * A shuffled copy, Fisher-Yates. The random source is a parameter so the
 * shuffle is deterministic under test and genuinely random in the browser.
 */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
