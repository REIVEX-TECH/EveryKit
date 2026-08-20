/**
 * How long a piece of text takes to read, to say out loud, and how many pages
 * it fills.
 *
 * Two of those three are honest arithmetic and one is an estimate dressed up as
 * a fact everywhere else on the internet. Words to pages depends on the font,
 * the size, the spacing and the margins, and a tool that says "3.2 pages"
 * without naming those is inventing precision. The assumptions are named here
 * and printed on the page, and the answer is given as a range.
 */

/** A comfortable adult reading pace for something they are not studying. */
export const DEFAULT_WPM = 200;

/** Speaking is much slower than reading, and presentations are paced slower still. */
export const DEFAULT_SPEAKING_WPM = 130;

export const MIN_WPM = 50;
export const MAX_WPM = 1000;

/**
 * The page assumptions, said out loud.
 *
 * These are the common ones for a school or university submission. Change any
 * of them and the page count changes, which is exactly why they are named.
 */
export const PAGE_ASSUMPTIONS = {
  font: "Times New Roman or Arial at 12 point",
  margins: "one inch margins",
  singleSpaced: 500,
  doubleSpaced: 250,
} as const;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  // Whitespace-separated runs. Right for English and every language that puts
  // spaces between words, wrong for Chinese and Japanese, which is said on the
  // page rather than left as a surprise.
  return trimmed.split(/\s+/).length;
}

export function clampWpm(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(MIN_WPM, Math.min(MAX_WPM, Math.round(value)));
}

/**
 * Minutes and seconds, phrased the way a person would say it.
 *
 * Under a minute is said in seconds, because "0.4 minutes" is not something
 * anybody says. Over an hour picks up hours, because "94 minutes" makes the
 * reader do the division.
 */
export function duration(minutes: number): string {
  if (minutes <= 0) return "no time at all";

  const totalSeconds = Math.round(minutes * 60);
  if (totalSeconds < 60) return `${totalSeconds} second${totalSeconds === 1 ? "" : "s"}`;

  const wholeMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (wholeMinutes < 60) {
    const base = `${wholeMinutes} minute${wholeMinutes === 1 ? "" : "s"}`;
    return seconds === 0 ? base : `${base} ${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(wholeMinutes / 60);
  const rest = wholeMinutes % 60;
  const base = `${hours} hour${hours === 1 ? "" : "s"}`;
  return rest === 0 ? base : `${base} ${rest} minute${rest === 1 ? "" : "s"}`;
}

export type ReadingResult = {
  words: number;
  readingMinutes: number;
  speakingMinutes: number;
  /** Pages at the two spacings, rounded to one decimal. */
  singleSpacedPages: number;
  doubleSpacedPages: number;
};

export function analyse(words: number, wpm: number, speakingWpm: number): ReadingResult {
  const safeWpm = clampWpm(wpm, DEFAULT_WPM);
  const safeSpeaking = clampWpm(speakingWpm, DEFAULT_SPEAKING_WPM);

  const round = (value: number) => Math.round(value * 10) / 10;

  return {
    words,
    readingMinutes: words / safeWpm,
    speakingMinutes: words / safeSpeaking,
    singleSpacedPages: round(words / PAGE_ASSUMPTIONS.singleSpaced),
    doubleSpacedPages: round(words / PAGE_ASSUMPTIONS.doubleSpaced),
  };
}

/** The pages line, phrased as the estimate it is. */
export function pagesSentence(result: ReadingResult): string {
  if (result.words === 0) return "";
  return (
    `Roughly ${result.doubleSpacedPages} page${result.doubleSpacedPages === 1 ? "" : "s"} double spaced, ` +
    `or ${result.singleSpacedPages} single spaced, in ${PAGE_ASSUMPTIONS.font} with ${PAGE_ASSUMPTIONS.margins}. ` +
    "Change any of those and the count changes, so treat it as a guide rather than a measurement."
  );
}
