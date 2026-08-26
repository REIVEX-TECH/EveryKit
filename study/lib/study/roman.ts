/**
 * Roman numerals, both directions, over the range the system actually covers.
 *
 * The classic numerals run 1 to 3999: there is no zero and no standard single
 * character for 5000, so anything outside that range is refused rather than
 * faked with a bar-over-letter notation nobody agrees on.
 */

const PAIRS: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export const ROMAN_MIN = 1;
export const ROMAN_MAX = 3999;

export function toRoman(value: number): { roman: string } | { error: string } {
  if (!Number.isInteger(value)) return { error: "Roman numerals are for whole numbers only." };
  if (value < ROMAN_MIN || value > ROMAN_MAX) return { error: "Roman numerals cover 1 to 3999." };
  let remaining = value;
  let out = "";
  for (const [amount, symbol] of PAIRS) {
    while (remaining >= amount) {
      out += symbol;
      remaining -= amount;
    }
  }
  return { roman: out };
}

// A strict pattern for a well-formed numeral, so IIII or VX is rejected rather
// than half-read. It is the canonical subtractive form and nothing else.
const VALID = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function fromRoman(input: string): { value: number } | { error: string } {
  const text = input.trim().toUpperCase();
  if (text === "") return { error: "" };
  if (/[^MDCLXVI]/.test(text)) return { error: "That has a letter which is not a Roman numeral." };
  if (!VALID.test(text)) return { error: "That is not a well-formed Roman numeral." };

  // The regex already guarantees the form, so the value is a plain left-to-right
  // scan: subtract when a smaller numeral sits before a larger one (IV, IX).
  const single: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let value = 0;
  for (let i = 0; i < text.length; i += 1) {
    const here = single[text[i]];
    const next = single[text[i + 1]] ?? 0;
    value += here < next ? -here : here;
  }
  return { value };
}
