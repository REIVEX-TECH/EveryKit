/**
 * The character sets a password is drawn from, and the entropy that follows.
 *
 * The generation itself lives in the component, because it needs the browser's
 * crypto.getRandomValues; this is the pure part, so the entropy maths can be
 * pinned by tests rather than eyeballed on a coloured bar.
 */

export type SetId = "lower" | "upper" | "digits" | "symbols";

export const CHAR_SETS: Record<SetId, string> = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};

/** Characters that read alike in many fonts, dropped on request. */
const AMBIGUOUS = new Set("Il1O0o|`".split(""));

/** The pool of characters for the chosen sets, minus look-alikes if asked. */
export function buildPool(sets: SetId[], excludeAmbiguous: boolean): string {
  let pool = sets.map((s) => CHAR_SETS[s]).join("");
  if (excludeAmbiguous) pool = [...pool].filter((c) => !AMBIGUOUS.has(c)).join("");
  return pool;
}

/**
 * Entropy in bits: log2(poolSize) per character, times the length.
 *
 * This is the honest measure of a randomly generated password: the base-2 log
 * of how many equally likely passwords could have come out. It is only valid
 * because each character is drawn uniformly and independently, which the
 * generator guarantees; it says nothing about a password a human chose.
 */
export function entropyBits(poolSize: number, length: number): number {
  if (poolSize <= 1 || length <= 0) return 0;
  return Math.log2(poolSize) * length;
}

/** A plain label for a bit count, with the boundary reasoning in the tool's copy. */
export function strengthLabel(bits: number): "weak" | "fair" | "strong" | "very strong" {
  if (bits < 40) return "weak";
  if (bits < 60) return "fair";
  if (bits < 80) return "strong";
  return "very strong";
}
