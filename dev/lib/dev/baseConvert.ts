/**
 * Whole-number conversion between hex, binary, decimal and octal.
 *
 * BigInt throughout, so a value far past what a normal number can hold converts
 * exactly rather than rounding. Parsing is strict: an invalid digit for the base
 * is an error, not a silent zero, because a typo that becomes a wrong number is
 * worse than a typo that is flagged.
 */

export type Base = 2 | 8 | 10 | 16;

export const BASES: Array<{ base: Base; name: string; label: string }> = [
  { base: 16, name: "hex", label: "Hexadecimal" },
  { base: 10, name: "dec", label: "Decimal" },
  { base: 8, name: "oct", label: "Octal" },
  { base: 2, name: "bin", label: "Binary" },
];

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

/** Parse a string in the given base to a BigInt, or an error message. */
export function parseInBase(input: string, base: Base): { value: bigint } | { error: string } {
  let text = input.trim().toLowerCase();
  if (text === "") return { error: "" };

  let negative = false;
  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }
  // Tolerate the usual prefixes people paste in.
  if (base === 16 && text.startsWith("0x")) text = text.slice(2);
  if (base === 2 && text.startsWith("0b")) text = text.slice(2);
  if (base === 8 && text.startsWith("0o")) text = text.slice(2);
  text = text.replace(/[_\s]/g, "");
  if (text === "") return { error: "" };

  const valid = DIGITS.slice(0, base);
  let value = 0n;
  const big = BigInt(base);
  for (const char of text) {
    const digit = valid.indexOf(char);
    if (digit === -1) return { error: `"${char}" is not a valid ${baseName(base)} digit.` };
    value = value * big + BigInt(digit);
  }
  return { value: negative ? -value : value };
}

/** Render a BigInt in the given base. */
export function toBase(value: bigint, base: Base): string {
  return value.toString(base);
}

function baseName(base: Base): string {
  return base === 16 ? "hexadecimal" : base === 2 ? "binary" : base === 8 ? "octal" : "decimal";
}
