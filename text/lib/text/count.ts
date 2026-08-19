/**
 * Counting words, characters, sentences and reading time.
 *
 * All pure, all tested against fixtures that include text which is not
 * English. The naive versions of these functions are wrong in ways that only
 * show up on other scripts: splitting on the ASCII space misses the ideographic
 * space, and looking for a full stop misses the Urdu one, which is a different
 * character entirely and would report a whole paragraph as one sentence.
 */

/** Words per minute used for the reading estimate. */
export const READING_WPM = 200;

export type Counts = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  /** Rounded up to whole minutes, because "0.4 minutes" helps nobody. */
  readingMinutes: number;
};

/**
 * Sentence-ending punctuation.
 *
 * The Latin three, the Urdu and Arabic full stops, the Devanagari danda used
 * across Hindi and several other scripts, and the ideographic stop used in
 * Chinese and Japanese. Without these a paragraph of Urdu counts as a single
 * sentence, which is the sort of wrong that looks fine in an English test.
 */
const SENTENCE_ENDERS = /[.!?۔؟。！？।॥…]+/;

/**
 * Count words.
 *
 * Splitting on Unicode whitespace rather than the ASCII space, so the
 * non-breaking space, the ideographic space and the rest are all separators.
 * This counts whitespace-delimited runs, which is the right model for Urdu,
 * Arabic and every European language. It is not right for Chinese or Japanese,
 * which do not put spaces between words: those come out as very few, very long
 * "words", and the character count is the useful number there instead.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/u).filter((token) => token !== "").length;
}

/**
 * Count characters as a person would count them, not as UTF-16 does.
 *
 * `"👍".length` is 2, and an emoji or an astral-plane character would
 * otherwise count double. Intl.Segmenter groups by grapheme, so a family emoji
 * built from several code points counts as the one character it looks like.
 */
export function countCharacters(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    // Iterating for the count rather than materialising an array: a long
    // document would otherwise allocate one object per character.
    let count = 0;
    const iterator = segmenter.segment(text)[Symbol.iterator]();
    while (!iterator.next().done) count++;
    return count;
  }
  // Array spread splits by code point, which still beats .length for anything
  // outside the basic plane.
  return [...text].length;
}

export function countCharactersWithoutSpaces(text: string): number {
  return countCharacters(text.replace(/\s/gu, ""));
}

/** Sentences, by counting runs that end in sentence punctuation. */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  const pieces = trimmed
    .split(SENTENCE_ENDERS)
    .map((piece) => piece.trim())
    .filter((piece) => piece !== "");
  // Text with no terminator at all is still one sentence.
  return pieces.length === 0 ? 1 : pieces.length;
}

/** Paragraphs, separated by one or more blank lines. */
export function countParagraphs(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\n\s*\n/u).filter((block) => block.trim() !== "").length;
}

export function countAll(text: string): Counts {
  const words = countWords(text);
  return {
    words,
    characters: countCharacters(text),
    charactersNoSpaces: countCharactersWithoutSpaces(text),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / READING_WPM)),
  };
}

/** "About 3 minutes to read", or the honest "under a minute". */
export function describeReadingTime(words: number): string {
  if (words === 0) return "Nothing to read yet";
  const minutes = words / READING_WPM;
  if (minutes < 1) return "Under a minute to read";
  const rounded = Math.round(minutes);
  return `About ${rounded} ${rounded === 1 ? "minute" : "minutes"} to read`;
}
