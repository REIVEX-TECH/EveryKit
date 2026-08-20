/**
 * Loan instalments, and the schedule behind them.
 *
 * The formula is the standard annuity one: with a monthly rate r over n months
 * on a principal P, the payment is P·r·(1+r)^n / ((1+r)^n − 1). At a rate of
 * zero that expression divides by zero, so the flat case is handled separately
 * rather than by nudging the rate to 0.0001, which is what a surprising number
 * of calculators do.
 *
 * Money is kept in whole minor units, the way the Invoice kit does it. Not
 * because a tenth of a cent matters on one payment, but because it matters
 * across three hundred of them: a schedule built from floating point drifts,
 * and the last row ends up owing 0.03 or being paid 0.02 too much. The final
 * instalment absorbs the rounding instead, which is what a bank does.
 */

export type Instalment = {
  number: number;
  /** All amounts in minor units, so cents or paise. */
  payment: number;
  interest: number;
  principal: number;
  balance: number;
};

export type LoanResult = {
  monthly: number;
  totalPaid: number;
  totalInterest: number;
  schedule: Instalment[];
};

export const MAX_MONTHS = 600;

/** A typed amount, as whole minor units. String-based, so 19.99 does not become 1998.9999. */
export function parseAmount(raw: string): number | null {
  const text = raw.trim().replace(/[,\s_]/g, "");
  if (text === "") return null;
  if (!/^\d*\.?\d{0,2}$/.test(text)) return null;

  const [whole, fraction = ""] = text.split(".");
  const major = whole === "" ? 0 : Number(whole);
  if (!Number.isFinite(major)) return null;
  const minor = Number(fraction.padEnd(2, "0").slice(0, 2));
  return major * 100 + minor;
}

export function parseRate(raw: string): number | null {
  const text = raw.trim().replace(/[,\s%]/g, "");
  if (text === "") return null;
  if (!/^\d*\.?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 && value <= 200 ? value : null;
}

export function parseMonths(raw: string): number | null {
  const text = raw.trim().replace(/[,\s_]/g, "");
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= MAX_MONTHS ? value : null;
}

/**
 * The instalment and the whole schedule.
 *
 * `principalMinor` is the loan in minor units, `annualRate` a percentage, and
 * `months` the term.
 */
export function calculateLoan(
  principalMinor: number,
  annualRate: number,
  months: number,
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;

  // Worked out in major units and rounded once to minor, which keeps the
  // payment the amount a bank would quote.
  const payment =
    monthlyRate === 0
      ? Math.round(principalMinor / months)
      : Math.round(
          (principalMinor * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1),
        );

  const schedule: Instalment[] = [];
  let balance = principalMinor;
  let totalPaid = 0;
  let totalInterest = 0;

  for (let index = 1; index <= months; index++) {
    const interest = Math.round(balance * monthlyRate);
    let principalPart = payment - interest;
    let actualPayment = payment;

    // The last instalment settles whatever is left, so the schedule ends at
    // exactly zero rather than at a few cents either side of it.
    if (index === months || principalPart >= balance) {
      principalPart = balance;
      actualPayment = balance + interest;
    }

    balance -= principalPart;
    totalPaid += actualPayment;
    totalInterest += interest;

    schedule.push({
      number: index,
      payment: actualPayment,
      interest,
      principal: principalPart,
      balance,
    });

    if (balance <= 0) break;
  }

  return { monthly: payment, totalPaid, totalInterest, schedule };
}

/**
 * Minor units as money, grouped the way the chosen locale groups.
 *
 * An Indian loan reads 1,00,000 rather than 100,000, which is the difference
 * between a number somebody recognises and one they have to re-read.
 */
export function formatMoney(minor: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return (minor / 100).toFixed(2);
  }
}

export const CURRENCIES = [
  { code: "USD", label: "US dollar", locale: "en-US" },
  { code: "PKR", label: "Pakistani rupee", locale: "en-PK" },
  { code: "INR", label: "Indian rupee", locale: "en-IN" },
  { code: "GBP", label: "Pound sterling", locale: "en-GB" },
  { code: "EUR", label: "Euro", locale: "de-DE" },
  { code: "AED", label: "UAE dirham", locale: "ar-AE" },
] as const;
