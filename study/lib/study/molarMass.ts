/**
 * Parse a chemical formula and work out its molar mass from the vendored atomic
 * weights. Handles brackets, nested groups and hydrates written with a dot, like
 * CuSO4.5H2O or Ca(OH)2. Element symbols are case-sensitive, so Co is cobalt and
 * CO is carbon plus oxygen, which is a real source of wrong answers elsewhere.
 */

import { elementBySymbol, elements, type Element } from "@/data/elements";

export type Counts = Map<string, number>;

export type ParseResult =
  | { counts: Counts }
  | { error: string };

function addInto(target: Counts, source: Counts, factor: number) {
  for (const [symbol, count] of source) {
    target.set(symbol, (target.get(symbol) ?? 0) + count * factor);
  }
}

/** Parse one segment (no hydrate dots) into element counts, or an error. */
function parseSegment(segment: string): ParseResult {
  const stack: Counts[] = [new Map()];
  let i = 0;

  const readNumber = (): number => {
    let n = "";
    while (i < segment.length && /[0-9]/.test(segment[i])) n += segment[i++];
    return n === "" ? 1 : Number(n);
  };

  while (i < segment.length) {
    const char = segment[i];
    if (char === "(" || char === "[") {
      stack.push(new Map());
      i += 1;
    } else if (char === ")" || char === "]") {
      i += 1;
      const multiplier = readNumber();
      const group = stack.pop();
      if (!group || stack.length === 0) return { error: "A closing bracket has no matching open bracket." };
      addInto(stack[stack.length - 1], group, multiplier);
    } else if (/[A-Z]/.test(char)) {
      let symbol = char;
      i += 1;
      while (i < segment.length && /[a-z]/.test(segment[i])) symbol += segment[i++];
      if (!elementBySymbol(symbol)) return { error: `"${symbol}" is not an element symbol.` };
      const count = readNumber();
      const top = stack[stack.length - 1];
      top.set(symbol, (top.get(symbol) ?? 0) + count);
    } else if (/\s/.test(char)) {
      i += 1;
    } else {
      return { error: `"${char}" does not belong in a formula.` };
    }
  }

  if (stack.length !== 1) return { error: "An open bracket is never closed." };
  return { counts: stack[0] };
}

/** Parse a full formula, hydrate dots and leading coefficients included. */
export function parseFormula(formula: string): ParseResult {
  const trimmed = formula.trim();
  if (trimmed === "") return { error: "" };
  // Normalise the several characters people use for a hydrate dot.
  const segments = trimmed.replace(/[·•*.]/g, ".").split(".");
  const total: Counts = new Map();

  for (const raw of segments) {
    const segment = raw.trim();
    if (segment === "") return { error: "There is an empty part around a dot." };
    const coefficient = segment.match(/^([0-9]+)/);
    const factor = coefficient ? Number(coefficient[1]) : 1;
    const body = coefficient ? segment.slice(coefficient[1].length) : segment;
    const result = parseSegment(body);
    if ("error" in result) return result;
    addInto(total, result.counts, factor);
  }

  if (total.size === 0) return { error: "No elements were found in that formula." };
  return { counts: total };
}

export type Breakdown = { element: Element; count: number; subtotal: number };

/** The per-element breakdown, heaviest contribution first. */
export function breakdown(counts: Counts): Breakdown[] {
  const rows: Breakdown[] = [];
  for (const [symbol, count] of counts) {
    const element = elementBySymbol(symbol);
    if (!element) continue;
    rows.push({ element, count, subtotal: element.mass * count });
  }
  return rows.sort((a, b) => b.subtotal - a.subtotal);
}

/** The molar mass in grams per mole. */
export function molarMass(counts: Counts): number {
  let total = 0;
  for (const [symbol, count] of counts) {
    const element = elementBySymbol(symbol);
    if (element) total += element.mass * count;
  }
  return total;
}

/** True if any element in the formula has an estimated (no stable isotope) mass. */
export function hasEstimated(counts: Counts): boolean {
  for (const symbol of counts.keys()) {
    if (elementBySymbol(symbol)?.estimated) return true;
  }
  return false;
}

// Referenced by the periodic-table search so both tools share one dataset.
export { elements };
