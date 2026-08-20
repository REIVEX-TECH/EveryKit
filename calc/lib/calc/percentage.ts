/**
 * The three percentage questions people actually type into a search box.
 *
 * They are three different sums that all get called "percentage calculator",
 * and putting them on one page with their own words is the whole idea. The
 * arithmetic is trivial; knowing which of the three you want is the part that
 * trips people up.
 *
 * The third one carries the trap. A rise from 40 to 50 is a 25 percent
 * increase, and the fall back from 50 to 40 is a 20 percent decrease, not 25.
 * Percent change is always relative to where it started, and this says so.
 */

export type Mode = "of" | "isWhatPercent" | "change";

export function parseNumber(raw: string): number | null {
  const text = raw.trim().replace(/[,\s_%]/g, "");
  if (text === "" || text === "-") return null;
  if (!/^-?\d*\.?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** Up to four decimals, without trailing zeroes. */
export function tidy(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 10_000) / 10_000;
  return String(rounded);
}

export type Answer = { value: number; sentence: string } | { error: string } | null;

/** X percent of Y. */
export function percentOf(percent: number | null, total: number | null): Answer {
  if (percent === null || total === null) return null;
  const value = (percent / 100) * total;
  return { value, sentence: `${tidy(percent)}% of ${tidy(total)} is ${tidy(value)}.` };
}

/** X is what percent of Y. */
export function isWhatPercentOf(part: number | null, total: number | null): Answer {
  if (part === null || total === null) return null;
  if (total === 0) {
    return {
      error: "Nothing can be a percentage of zero: there is no whole to compare against.",
    };
  }
  const value = (part / total) * 100;
  return { value, sentence: `${tidy(part)} is ${tidy(value)}% of ${tidy(total)}.` };
}

/** Percent change from X to Y. */
export function percentChange(from: number | null, to: number | null): Answer {
  if (from === null || to === null) return null;
  if (from === 0) {
    return {
      error:
        "A change from zero has no percentage: any increase from nothing is infinite. Give the starting number as something other than zero.",
    };
  }

  const value = ((to - from) / Math.abs(from)) * 100;
  const direction = value > 0 ? "an increase" : value < 0 ? "a decrease" : "no change";
  const magnitude = tidy(Math.abs(value));

  return {
    value,
    sentence:
      value === 0
        ? `${tidy(from)} to ${tidy(to)} is no change.`
        : `${tidy(from)} to ${tidy(to)} is ${direction} of ${magnitude}%.`,
  };
}

/**
 * The note under the third block.
 *
 * Not a footnote: this is the misunderstanding the tool exists to correct, so
 * it is shown with the answer rather than hidden behind a question mark.
 */
export function changeNote(from: number | null, to: number | null): string | null {
  if (from === null || to === null || from === 0 || to === 0 || from === to) return null;

  const forward = ((to - from) / Math.abs(from)) * 100;
  const backward = ((from - to) / Math.abs(to)) * 100;
  if (Math.abs(Math.abs(forward) - Math.abs(backward)) < 0.01) return null;

  return (
    `Going the other way is not the same number: ${tidy(to)} back to ${tidy(from)} is ` +
    `${tidy(Math.abs(backward))}%, because a change is always measured against where it started.`
  );
}
