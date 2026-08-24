/**
 * Word recall: the share of the expected words that OCR actually found.
 *
 * OCR is never exact, so the scan and OCR tools are held to a recall threshold
 * rather than a character-perfect match. This is the metric behind that: it
 * lowercases, strips punctuation, and counts how many of the expected words
 * appear in the recognised text, respecting how many times each is expected so
 * a run that drops one of two "the"s is not scored as perfect.
 */

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** A multiset count of words. */
function counts(list: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const w of list) map.set(w, (map.get(w) ?? 0) + 1);
  return map;
}

/**
 * Fraction of expected words present in `actual`, from 0 to 1. An empty
 * expectation is defined as perfect recall, since there is nothing to miss.
 */
export function wordRecall(expected: string, actual: string): number {
  const want = counts(words(expected));
  const got = counts(words(actual));
  let total = 0;
  let found = 0;
  for (const [word, need] of want) {
    total += need;
    found += Math.min(need, got.get(word) ?? 0);
  }
  return total === 0 ? 1 : found / total;
}
