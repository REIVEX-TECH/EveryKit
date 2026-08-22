/**
 * Discount and tax sums, done in whole minor units.
 *
 * Money in floating point is where these tools quietly go wrong: 0.1 + 0.2 is
 * not 0.3, and a percentage of a price lands on a fraction of a penny that has
 * to be rounded the same way every time or the parts stop adding up to the
 * whole. Everything here works in integer minor units (pennies, cents, paise)
 * and rounds once, at the end, to the nearest unit.
 *
 * Reuses parseAmount and parseRate from the loan tool, so "1,00,000.50" and
 * "20%" are read the same way across the kit.
 */

import { parseRate } from "./emi";

const round = (n: number) => Math.round(n);

// ---------------------------------------------------------------------------
// Discount
// ---------------------------------------------------------------------------

export type DiscountInput = {
  /** Price in minor units. */
  priceMinor: number;
  /** First percentage off, 0 to 100. */
  first: number;
  /** An optional second percentage, applied to what the first leaves. */
  second: number | null;
};

export type DiscountResult = {
  finalMinor: number;
  savedMinor: number;
  /** The price after the first discount, before the second. */
  afterFirstMinor: number;
  /** The single percentage the stacked pair is equivalent to. */
  effectivePercent: number;
};

/**
 * Two stacked discounts, applied one after another.
 *
 * Stacked, not added: 20% then 10% is not 30% off. The second comes off what
 * the first leaves, so the pair is equivalent to 28%, and the tool shows that
 * number because it is the one people get wrong.
 */
export function applyDiscount(input: DiscountInput): DiscountResult {
  const afterFirst = round(input.priceMinor * (1 - input.first / 100));
  const afterSecond =
    input.second === null ? afterFirst : round(afterFirst * (1 - input.second / 100));

  const savedMinor = input.priceMinor - afterSecond;
  const effectivePercent =
    input.priceMinor === 0 ? 0 : (savedMinor / input.priceMinor) * 100;

  return {
    finalMinor: afterSecond,
    savedMinor,
    afterFirstMinor: afterFirst,
    effectivePercent,
  };
}

// ---------------------------------------------------------------------------
// VAT / GST
// ---------------------------------------------------------------------------

export type VatDirection = "add" | "extract";

export type VatInput = {
  /** The amount in minor units: net when adding, gross when extracting. */
  amountMinor: number;
  rate: number;
};

export type VatResult = {
  netMinor: number;
  taxMinor: number;
  grossMinor: number;
};

/**
 * Add tax to a net amount, or pull the tax back out of a gross one.
 *
 * Extracting is the half people get wrong: the tax in a gross price is not the
 * rate times the gross, it is the gross divided by (1 + rate). At 20%, the tax
 * inside 120 is 20, not 24. Both directions round once and derive the third
 * figure by subtraction, so net, tax and gross always add up.
 */
export function applyVat(direction: VatDirection, input: VatInput): VatResult {
  const factor = input.rate / 100;

  if (direction === "add") {
    const net = input.amountMinor;
    const gross = round(net * (1 + factor));
    return { netMinor: net, taxMinor: gross - net, grossMinor: gross };
  }

  const gross = input.amountMinor;
  const net = round(gross / (1 + factor));
  return { netMinor: net, taxMinor: gross - net, grossMinor: gross };
}

// ---------------------------------------------------------------------------
// Shared parsing for a plain percentage 0..100
// ---------------------------------------------------------------------------

/** A percentage between 0 and 100, or null. Reuses the loan tool's rate rules. */
export function parsePercent(raw: string): number | null {
  const value = parseRate(raw);
  if (value === null) return null;
  return value <= 100 ? value : null;
}
