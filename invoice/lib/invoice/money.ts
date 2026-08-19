/**
 * Money, in integer minor units.
 *
 * Every amount here is a whole number of the currency's smallest unit: cents,
 * pence, paisa. Nothing is ever a floating point number of major units,
 * because 0.1 + 0.2 is 0.30000000000000004 and an invoice that is a hundredth
 * of a penny out is an invoice somebody has to argue about.
 *
 * The rounding rule, stated plainly because it is a real choice and different
 * software makes it differently:
 *
 *   Each line is rounded to whole minor units on its own, and the subtotal is
 *   the sum of those rounded lines. Discount and tax are then each computed on
 *   that subtotal and rounded once.
 *
 * The alternative, keeping full precision per line and rounding only the total,
 * gives a total that does not equal the visible lines added up. On an invoice
 * the lines are printed, so somebody will add them, and being unable to
 * reproduce the total from the page is worse than being a minor unit away from
 * the theoretical answer.
 */

export type Currency = {
  code: string;
  label: string;
  symbol: string;
  /** How many minor units make one major unit, as a power of ten. */
  decimals: number;
  /** Where the symbol goes. */
  position: "before" | "after";
  /** A space between symbol and number. */
  space: boolean;
  /** The locale used to group digits. */
  locale: string;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", label: "US dollar", symbol: "$", decimals: 2, position: "before", space: false, locale: "en-US" },
  { code: "EUR", label: "Euro", symbol: "€", decimals: 2, position: "before", space: false, locale: "en-IE" },
  { code: "GBP", label: "Pound sterling", symbol: "£", decimals: 2, position: "before", space: false, locale: "en-GB" },
  { code: "PKR", label: "Pakistani rupee", symbol: "Rs", decimals: 2, position: "before", space: true, locale: "en-PK" },
  { code: "INR", label: "Indian rupee", symbol: "₹", decimals: 2, position: "before", space: false, locale: "en-IN" },
  { code: "AED", label: "UAE dirham", symbol: "AED", decimals: 2, position: "before", space: true, locale: "en-AE" },
  { code: "SAR", label: "Saudi riyal", symbol: "SAR", decimals: 2, position: "before", space: true, locale: "en-SA" },
  { code: "CAD", label: "Canadian dollar", symbol: "CA$", decimals: 2, position: "before", space: false, locale: "en-CA" },
  { code: "AUD", label: "Australian dollar", symbol: "A$", decimals: 2, position: "before", space: false, locale: "en-AU" },
  { code: "JPY", label: "Japanese yen", symbol: "¥", decimals: 0, position: "before", space: false, locale: "ja-JP" },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0];
}

/** Ten to the power of the currency's decimal places. */
export function unitScale(currency: Currency): number {
  return 10 ** currency.decimals;
}

/**
 * Parse what someone typed into whole minor units.
 *
 * Deliberately string-based down to the last step. Multiplying a parsed float
 * by 100 reintroduces exactly the drift this module exists to avoid: 19.99
 * times 100 is 1998.9999999999998, and truncating that loses a penny.
 */
export function parseAmount(input: string, currency: Currency): number | null {
  const cleaned = input.trim().replace(/[\s,]/g, "");
  if (cleaned === "") return 0;
  if (!/^-?\d*(\.\d*)?$/.test(cleaned)) return null;
  if (cleaned === "." || cleaned === "-" || cleaned === "-.") return null;

  const negative = cleaned.startsWith("-");
  const body = negative ? cleaned.slice(1) : cleaned;
  const [whole = "0", fraction = ""] = body.split(".");

  const decimals = currency.decimals;
  // Pad or trim the fractional part to the currency's precision, then read the
  // whole thing as one integer. No float is involved at any point.
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const minor = Number(whole || "0") * unitScale(currency) + Number(padded || "0");
  if (!Number.isFinite(minor)) return null;
  return negative ? -minor : minor;
}

/** Round half away from zero, which is what people expect on an invoice. */
export function roundHalfUp(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * A quantity times a unit price, rounded to whole minor units.
 *
 * Quantity may be fractional (2.5 hours), so this is where a fraction of a
 * minor unit can appear and has to be resolved.
 */
export function lineTotal(quantity: number, unitPriceMinor: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPriceMinor)) return 0;
  return roundHalfUp(quantity * unitPriceMinor);
}

/** A percentage of an amount, rounded once, in minor units. */
export function percentOf(amountMinor: number, percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return roundHalfUp((amountMinor * percent) / 100);
}

export type Line = {
  description: string;
  quantity: number;
  /** Unit price in minor units. */
  unitPriceMinor: number;
};

export type Discount =
  | { kind: "none" }
  | { kind: "percent"; percent: number }
  | { kind: "amount"; amountMinor: number };

export type Totals = {
  /** Per line, rounded, in the order given. */
  lineTotals: number[];
  subtotalMinor: number;
  discountMinor: number;
  /** Subtotal minus discount: what tax is charged on. */
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
};

/**
 * Work out every figure on the invoice.
 *
 * Discount comes off before tax, which is how VAT and GST both work: tax is
 * charged on what is actually paid, not on the list price.
 */
export function computeTotals(
  lines: Line[],
  discount: Discount,
  taxPercent: number,
): Totals {
  const lineTotals = lines.map((line) => lineTotal(line.quantity, line.unitPriceMinor));
  const subtotalMinor = lineTotals.reduce((sum, value) => sum + value, 0);

  let discountMinor = 0;
  if (discount.kind === "percent") discountMinor = percentOf(subtotalMinor, discount.percent);
  if (discount.kind === "amount") discountMinor = discount.amountMinor;
  // A discount larger than the invoice would make the total negative, which is
  // a credit note, not an invoice.
  discountMinor = Math.min(Math.max(discountMinor, 0), subtotalMinor);

  const taxableMinor = subtotalMinor - discountMinor;
  const taxMinor = percentOf(taxableMinor, taxPercent);

  return {
    lineTotals,
    subtotalMinor,
    discountMinor,
    taxableMinor,
    taxMinor,
    totalMinor: taxableMinor + taxMinor,
  };
}

/**
 * Format minor units for display, with the currency's symbol in its usual place.
 *
 * Intl does the digit grouping, which differs by more than a separator: Indian
 * numbering groups as 1,00,000 rather than 100,000, and getting that wrong on
 * a rupee invoice looks immediately foreign to the person reading it.
 */
export function formatMoney(minor: number, currency: Currency): string {
  const scale = unitScale(currency);
  const negative = minor < 0;
  const absolute = Math.abs(minor);
  const major = Math.floor(absolute / scale);
  const fraction = absolute % scale;

  const groupedMajor = new Intl.NumberFormat(currency.locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(major);

  const number =
    currency.decimals === 0
      ? groupedMajor
      : `${groupedMajor}.${String(fraction).padStart(currency.decimals, "0")}`;

  const gap = currency.space ? " " : "";
  const body =
    currency.position === "before"
      ? `${currency.symbol}${gap}${number}`
      : `${number}${gap}${currency.symbol}`;

  return negative ? `-${body}` : body;
}

/** The number alone, for places where the currency is already stated. */
export function formatAmount(minor: number, currency: Currency): string {
  const scale = unitScale(currency);
  const absolute = Math.abs(minor);
  const major = Math.floor(absolute / scale);
  const fraction = absolute % scale;
  const grouped = new Intl.NumberFormat(currency.locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(major);
  const number =
    currency.decimals === 0
      ? grouped
      : `${grouped}.${String(fraction).padStart(currency.decimals, "0")}`;
  return minor < 0 ? `-${number}` : number;
}
