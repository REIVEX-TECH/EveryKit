/**
 * Everything a student needs to hit an assignment length: the counts, the pages
 * at the formats a rubric names, and how long it reads and speaks.
 *
 * The page counts share the reading tool's assumptions rather than inventing new
 * ones, so the two tools never disagree, and the assumptions (12pt, one inch
 * margins) are named on the page because they are what decide the number.
 */

import {
  DEFAULT_SPEAKING_WPM,
  DEFAULT_WPM,
  countWords,
} from "./reading";

/** Words per page at each common submission format, at 12pt with 1in margins. */
export const PAGE_FORMATS: Array<{ label: string; wordsPerPage: number }> = [
  { label: "Double-spaced", wordsPerPage: 250 },
  { label: "1.5 spacing", wordsPerPage: 375 },
  { label: "Single-spaced", wordsPerPage: 500 },
];

export type EssayStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  readingMinutes: number;
  speakingMinutes: number;
  pages: Array<{ label: string; pages: number }>;
};

function countSentences(text: string): number {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  if (matches) return matches.length;
  return text.trim() === "" ? 0 : 1;
}

export function analyseEssay(text: string): EssayStats {
  const words = countWords(text);
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    words,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    sentences: countSentences(text),
    readingMinutes: words / DEFAULT_WPM,
    speakingMinutes: words / DEFAULT_SPEAKING_WPM,
    pages: PAGE_FORMATS.map((format) => ({
      label: format.label,
      pages: round(words / format.wordsPerPage),
    })),
  };
}
