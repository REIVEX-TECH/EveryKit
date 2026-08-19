import { describe, expect, it } from "vitest";
import {
  countAll,
  countCharacters,
  countCharactersWithoutSpaces,
  countParagraphs,
  countSentences,
  countWords,
  describeReadingTime,
  READING_WPM,
} from "./count";
import {
  cleanText,
  isAcronym,
  looksAllCaps,
  NO_CLEANING,
  toLower,
  toSentence,
  toTitle,
  toUpper,
} from "./transform";
import { CLASSIC_OPENING, generateLorem } from "./lorem";

/**
 * Fixtures that are not all English. The naive version of every function here
 * passes on English and fails on something else, which is exactly the bug that
 * ships.
 */
const ENGLISH = "The quick brown fox jumps over the lazy dog. It barked twice! Then it slept.";
const URDU = "یہ ایک جملہ ہے۔ یہ دوسرا جملہ ہے۔ کیا یہ تیسرا ہے؟";
const MIXED = "NASA launched a probe. کیا آپ جانتے ہیں؟ The PDF was 3 MB.";

describe("counting words", () => {
  it("counts an English sentence", () => {
    expect(countWords(ENGLISH)).toBe(15);
  });

  it("counts Urdu, which whitespace splitting handles correctly", () => {
    // 12 whitespace-delimited tokens. Urdu puts spaces between words, so the
    // same model as English is right here.
    expect(countWords(URDU)).toBe(12);
  });

  it("ignores leading, trailing and repeated whitespace", () => {
    expect(countWords("   one    two  ")).toBe(2);
    expect(countWords("")).toBe(0);
    expect(countWords("      ")).toBe(0);
  });

  it("treats the non-breaking and ideographic spaces as separators", () => {
    // Splitting on the ASCII space alone would report one word for each.
    expect(countWords("one two")).toBe(2);
    expect(countWords("one　two")).toBe(2);
  });

  it("counts a line break as a separator", () => {
    expect(countWords("one\ntwo\r\nthree")).toBe(3);
  });
});

describe("counting characters", () => {
  it("counts what a person would call a character", () => {
    expect(countCharacters("hello")).toBe(5);
    // "👍".length is 2 in UTF-16, so .length would double-count this.
    expect(countCharacters("👍")).toBe(1);
    expect(countCharacters("a👍b")).toBe(3);
  });

  it("counts a family emoji as one character, not its component parts", () => {
    expect(countCharacters("👨‍👩‍👧")).toBe(1);
  });

  it("counts Urdu characters", () => {
    expect(countCharacters("سلام")).toBe(4);
  });

  it("excludes every kind of whitespace when asked", () => {
    expect(countCharactersWithoutSpaces("a b\tc\nd")).toBe(4);
    expect(countCharactersWithoutSpaces("a b")).toBe(2);
  });
});

describe("counting sentences", () => {
  it("counts English terminators", () => {
    expect(countSentences(ENGLISH)).toBe(3);
  });

  it("counts the Urdu full stop and question mark", () => {
    // The bug this prevents: the Urdu full stop is U+06D4, not ".", so looking
    // only for a full stop reports this whole passage as one sentence.
    expect(countSentences(URDU)).toBe(3);
  });

  it("handles a mix of scripts in one passage", () => {
    expect(countSentences(MIXED)).toBe(3);
  });

  it("treats text with no terminator as one sentence", () => {
    expect(countSentences("no terminator here")).toBe(1);
    expect(countSentences("")).toBe(0);
  });

  it("does not count a run of terminators as several sentences", () => {
    expect(countSentences("Really?! Yes...")).toBe(2);
  });
});

describe("counting paragraphs and reading time", () => {
  it("splits paragraphs on blank lines", () => {
    expect(countParagraphs("one\n\ntwo\n\n\nthree")).toBe(3);
    expect(countParagraphs("one\ntwo")).toBe(1);
    expect(countParagraphs("")).toBe(0);
  });

  it("rounds reading time up to whole minutes", () => {
    const short = countAll("one two three");
    expect(short.readingMinutes).toBe(1);
    const long = countAll(Array(READING_WPM * 3).fill("word").join(" "));
    expect(long.readingMinutes).toBe(3);
    expect(countAll("").readingMinutes).toBe(0);
  });

  it("says under a minute rather than rounding a short text up to one", () => {
    expect(describeReadingTime(0)).toBe("Nothing to read yet");
    expect(describeReadingTime(50)).toBe("Under a minute to read");
    expect(describeReadingTime(READING_WPM)).toBe("About 1 minute to read");
    expect(describeReadingTime(READING_WPM * 4)).toBe("About 4 minutes to read");
  });

  it("reports every count together", () => {
    expect(countAll(ENGLISH)).toMatchObject({ words: 15, sentences: 3, paragraphs: 1 });
  });
});

describe("case conversion", () => {
  it("recognises acronyms", () => {
    for (const yes of ["NASA", "PDF", "UK", "R2D2", "U.K.", "USA's"]) {
      expect([yes, isAcronym(yes)]).toEqual([yes, true]);
    }
    for (const no of ["Nasa", "pdf", "A", "hello", "3"]) {
      expect([no, isAcronym(no)]).toEqual([no, false]);
    }
  });

  it("upper-cases everything", () => {
    expect(toUpper("hello NASA")).toBe("HELLO NASA");
  });

  it("lower-cases everything except acronyms", () => {
    // The documented rule: a token of two or more characters that is entirely
    // upper case is treated as an acronym and left alone. Without it, NASA
    // becomes nasa and every one has to be fixed by hand.
    expect(toLower("The NASA Probe Sent A PDF")).toBe("the NASA probe sent a PDF");
  });

  it("title-cases, keeping small words down in the middle", () => {
    expect(toTitle("the lord of the rings")).toBe("The Lord of the Rings");
    expect(toTitle("a tale of two cities")).toBe("A Tale of Two Cities");
    // First and last words are capitalised even when they are small words.
    expect(toTitle("to the lighthouse and")).toBe("To the Lighthouse And");
  });

  it("title-cases without destroying acronyms", () => {
    expect(toTitle("the NASA report on PDF files")).toBe("The NASA Report on PDF Files");
  });

  it("sentence-cases, capitalising after each terminator", () => {
    expect(toSentence("hello there. how are you? fine!")).toBe(
      "Hello there. How are you? Fine!",
    );
    expect(toSentence("HELLO THERE. HOW ARE YOU?")).toBe("HELLO THERE. HOW ARE YOU?");
  });

  it("sentence-cases after an Urdu full stop", () => {
    const out = toSentence("یہ ایک جملہ ہے۔ hello there");
    expect(out).toContain("Hello there");
  });

  it("preserves the spacing and punctuation exactly", () => {
    const messy = "  hello   world  ";
    expect(toTitle(messy)).toBe("  Hello   World  ");
    expect(toLower("(HELLO) [world]")).toBe("(HELLO) [world]");
  });

  it("warns when the whole text is capitals, which the acronym rule swallows", () => {
    // Stated on the page rather than left as a surprise: text typed entirely
    // in capitals reads as one long acronym and comes back unchanged.
    expect(looksAllCaps("THIS WHOLE THING IS SHOUTING")).toBe(true);
    expect(looksAllCaps("Normal sentence here")).toBe(false);
    expect(looksAllCaps("NASA")).toBe(false);
  });
});

describe("cleaning", () => {
  it("does nothing when nothing is switched on", () => {
    const messy = "  a  b  \n\n  c  ";
    expect(cleanText(messy, NO_CLEANING)).toBe(messy);
  });

  it("collapses runs of spaces and trims each line", () => {
    expect(cleanText("  a   b  \n  c  ", { ...NO_CLEANING, collapseSpaces: true })).toBe(
      "a b\nc",
    );
  });

  it("removes line breaks, joining into one paragraph", () => {
    expect(cleanText("a\nb\n\nc", { ...NO_CLEANING, removeLineBreaks: true })).toBe("a b c");
  });

  it("removes duplicate lines, keeping the first", () => {
    expect(
      cleanText("one\ntwo\none\nthree\ntwo", { ...NO_CLEANING, removeDuplicateLines: true }),
    ).toBe("one\ntwo\nthree");
  });

  it("keeps blank lines, which are structure rather than duplicate content", () => {
    expect(
      cleanText("a\n\nb\n\nc", { ...NO_CLEANING, removeDuplicateLines: true }),
    ).toBe("a\n\nb\n\nc");
  });

  it("finds duplicates before line breaks are removed", () => {
    // Order matters: afterwards there are no lines left to compare.
    expect(
      cleanText("one\none\ntwo", {
        collapseSpaces: true,
        removeDuplicateLines: true,
        removeLineBreaks: true,
      }),
    ).toBe("one two");
  });

  it("treats lines differing only by trailing space as duplicates", () => {
    expect(
      cleanText("one\none   \ntwo", {
        collapseSpaces: true,
        removeDuplicateLines: true,
        removeLineBreaks: false,
      }),
    ).toBe("one\ntwo");
  });
});

describe("lorem ipsum", () => {
  it("is deterministic for a given seed", () => {
    const options = { unit: "paragraphs" as const, count: 3, startWithClassic: true, seed: 42 };
    expect(generateLorem(options)).toBe(generateLorem(options));
  });

  it("gives different text for a different seed", () => {
    const base = { unit: "paragraphs" as const, count: 2, startWithClassic: false };
    expect(generateLorem({ ...base, seed: 1 })).not.toBe(generateLorem({ ...base, seed: 2 }));
  });

  it("starts with the classic opening when asked", () => {
    const text = generateLorem({ unit: "paragraphs", count: 1, startWithClassic: true, seed: 7 });
    expect(text.startsWith(CLASSIC_OPENING)).toBe(true);
  });

  it("produces the number of paragraphs asked for", () => {
    const text = generateLorem({ unit: "paragraphs", count: 4, startWithClassic: true, seed: 3 });
    expect(text.split(/\n\n/).length).toBe(4);
  });

  it("produces exactly the number of words asked for", () => {
    for (const count of [5, 25, 120]) {
      const text = generateLorem({ unit: "words", count, startWithClassic: true, seed: 9 });
      expect([count, countWords(text)]).toEqual([count, count]);
    }
  });

  it("clamps absurd requests rather than hanging the tab", () => {
    expect(countWords(generateLorem({ unit: "words", count: 999999, startWithClassic: false, seed: 1 })))
      .toBe(2000);
    expect(
      generateLorem({ unit: "paragraphs", count: 0, startWithClassic: false, seed: 1 }).length,
    ).toBeGreaterThan(0);
  });
});
