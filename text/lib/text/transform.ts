/**
 * Changing the case of text, and cleaning it up.
 *
 * The interesting decisions are all about what to leave alone. A converter that
 * blindly lower-cases turns NASA into nasa and PDF into pdf, and someone has to
 * fix every one by hand afterwards, which is worse than not having the tool.
 */

/**
 * A run of two or more letters that are all capitals, optionally with digits or
 * dots inside: NASA, PDF, USA, US-A, R2D2, U.K.
 */
const ACRONYM = /^(?=.*\p{Lu})[\p{Lu}\p{Nd}][\p{Lu}\p{Nd}.\-']*$/u;

/**
 * Words that stay lower case inside a title, unless they are first or last.
 * The short, uncontroversial set; longer lists start disagreeing with each
 * other and with the user.
 */
const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "if", "in", "into",
  "nor", "of", "on", "onto", "or", "over", "per", "so", "the", "to", "up",
  "via", "vs", "with", "yet",
]);

/**
 * Is this token an acronym worth preserving?
 *
 * The rule, stated plainly because it is a judgement call and users deserve to
 * know it: a token of two or more characters that is entirely upper case is
 * treated as an acronym and passes through every conversion untouched. So NASA
 * stays NASA in every mode. The cost is that text typed entirely in capitals is
 * read as one long acronym and comes back unchanged, which is why the tool says
 * so on the page rather than leaving it as a surprise.
 */
export function isAcronym(token: string): boolean {
  const bare = token
    .replace(/[^\p{L}\p{Nd}.'-]/gu, "")
    // A possessive suffix does not stop a word being an acronym. Without this,
    // "USA's" fails the test and comes back as "usa's".
    .replace(/['’]s$/u, "");
  return bare.length >= 2 && ACRONYM.test(bare);
}

/** True when the whole text is upper case, so the acronym rule would swallow it. */
export function looksAllCaps(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length < 8) return false;
  return letters === letters.toUpperCase();
}

function mapWords(text: string, fn: (word: string, index: number, total: number) => string): string {
  // Split on word boundaries but keep the separators, so spacing and
  // punctuation survive exactly as typed.
  const parts = text.split(/(\s+)/u);
  const wordIndexes = parts
    .map((part, index) => (/\s/u.test(part) || part === "" ? -1 : index))
    .filter((index) => index >= 0);
  const total = wordIndexes.length;

  return parts
    .map((part, index) => {
      const order = wordIndexes.indexOf(index);
      return order === -1 ? part : fn(part, order, total);
    })
    .join("");
}

function capitaliseFirstLetter(word: string): string {
  // Skip leading punctuation so ("hello) becomes ("Hello).
  const match = word.match(/\p{L}/u);
  if (!match || match.index === undefined) return word;
  const at = match.index;
  return word.slice(0, at) + word[at].toLocaleUpperCase() + word.slice(at + 1);
}

export function toUpper(text: string): string {
  return text.toLocaleUpperCase();
}

/** Lower case, but acronyms keep their capitals. */
export function toLower(text: string): string {
  return mapWords(text, (word) => (isAcronym(word) ? word : word.toLocaleLowerCase()));
}

/**
 * Title Case: every word capitalised, except small words in the middle.
 * Acronyms are left exactly as they are.
 */
export function toTitle(text: string): string {
  return mapWords(text, (word, index, total) => {
    if (isAcronym(word)) return word;
    const lower = word.toLocaleLowerCase();
    const bare = lower.replace(/[^\p{L}]/gu, "");
    const isEdge = index === 0 || index === total - 1;
    if (!isEdge && SMALL_WORDS.has(bare)) return lower;
    return capitaliseFirstLetter(lower);
  });
}

/**
 * Sentence case: lower case throughout, with the first letter of each sentence
 * capitalised. Acronyms keep their capitals here too.
 */
export function toSentence(text: string): string {
  const lowered = toLower(text);
  // Capitalise the first letter, and the first letter after a terminator.
  let out = "";
  let capitaliseNext = true;
  for (const character of lowered) {
    if (capitaliseNext && /\p{L}/u.test(character)) {
      out += character.toLocaleUpperCase();
      capitaliseNext = false;
      continue;
    }
    if (/[.!?۔؟。！？।॥]/u.test(character)) capitaliseNext = true;
    if (character === "\n") capitaliseNext = true;
    out += character;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

export type CleanOptions = {
  /** Collapse runs of spaces and tabs, and trim each line. */
  collapseSpaces: boolean;
  /** Join every line into one paragraph. */
  removeLineBreaks: boolean;
  /** Drop lines that already appeared, keeping the first. */
  removeDuplicateLines: boolean;
};

export const NO_CLEANING: CleanOptions = {
  collapseSpaces: false,
  removeLineBreaks: false,
  removeDuplicateLines: false,
};

/**
 * Apply the chosen cleanups, in the order that makes them compose sensibly.
 *
 * Duplicates are found before line breaks are removed, because afterwards there
 * are no lines left to compare. Spaces are collapsed first so that two lines
 * differing only by trailing whitespace count as duplicates.
 */
export function cleanText(text: string, options: CleanOptions): string {
  let lines = text.split(/\r\n|\r|\n/u);

  if (options.collapseSpaces) {
    lines = lines.map((line) => line.replace(/[^\S\r\n]+/gu, " ").trim());
  }

  if (options.removeDuplicateLines) {
    const seen = new Set<string>();
    lines = lines.filter((line) => {
      // Blank lines are structure, not content, so they are never treated as
      // duplicates of each other.
      if (line.trim() === "") return true;
      const key = line.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (options.removeLineBreaks) {
    return lines
      .map((line) => line.trim())
      .filter((line) => line !== "")
      .join(" ");
  }

  return lines.join("\n");
}
