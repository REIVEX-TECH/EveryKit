/**
 * Lorem ipsum, generated deterministically.
 *
 * The same seed always gives the same text. That is what lets the tests assert
 * on exact output rather than on shapes, and it also means someone who
 * regenerates after a reload gets what they had rather than a surprise.
 */

/** The opening everybody recognises. Real lorem always starts here. */
export const CLASSIC_OPENING =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et",
  "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis",
  "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex",
  "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur",
  "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt",
  "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est",
  "laborum", "perspiciatis", "unde", "omnis", "iste", "natus", "error",
  "voluptatem", "accusantium", "doloremque", "laudantium", "totam", "rem",
  "aperiam", "eaque", "quae", "ab", "illo", "inventore", "veritatis", "quasi",
  "architecto", "beatae", "vitae", "dicta", "explicabo", "nemo", "ipsam",
];

/**
 * A small deterministic generator (mulberry32).
 *
 * Math.random would make the output different on every render, which would
 * mean the tests could only check the shape and the user would lose their text
 * on any re-render.
 */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_SEED = 1;

function sentence(random: () => number, minWords = 6, maxWords = 16): string {
  const length = minWords + Math.floor(random() * (maxWords - minWords + 1));
  const words: string[] = [];
  for (let i = 0; i < length; i++) {
    words.push(WORDS[Math.floor(random() * WORDS.length)]);
  }
  const text = words.join(" ");
  // A comma somewhere in the middle on longer sentences, which is what makes
  // filler text look like prose rather than a word list.
  const withComma =
    length > 10
      ? text.replace(new RegExp(`^((?:\\S+\\s+){${Math.floor(length / 2)}}\\S+)`, "u"), "$1,")
      : text;
  return withComma.charAt(0).toUpperCase() + withComma.slice(1) + ".";
}

export type LoremOptions = {
  /** "paragraphs" or "words". */
  unit: "paragraphs" | "words";
  count: number;
  /** Begin with the classic opening, as real lorem does. */
  startWithClassic: boolean;
  seed?: number;
};

const MAX_PARAGRAPHS = 50;
const MAX_WORDS = 2000;

export function generateLorem(options: LoremOptions): string {
  const seed = options.seed ?? DEFAULT_SEED;
  const random = makeRandom(seed);

  if (options.unit === "words") {
    const wanted = Math.max(1, Math.min(MAX_WORDS, Math.floor(options.count)));
    const words: string[] = [];
    if (options.startWithClassic) {
      words.push(...CLASSIC_OPENING.replace(/[.,]/g, "").split(" "));
    }
    while (words.length < wanted) {
      words.push(WORDS[Math.floor(random() * WORDS.length)]);
    }
    const text = words.slice(0, wanted).join(" ");
    return text.charAt(0).toUpperCase() + text.slice(1) + ".";
  }

  const wanted = Math.max(1, Math.min(MAX_PARAGRAPHS, Math.floor(options.count)));
  const paragraphs: string[] = [];
  for (let index = 0; index < wanted; index++) {
    const sentences: string[] = [];
    if (index === 0 && options.startWithClassic) sentences.push(CLASSIC_OPENING);
    const howMany = 3 + Math.floor(random() * 3);
    for (let s = sentences.length; s < howMany; s++) sentences.push(sentence(random));
    paragraphs.push(sentences.join(" "));
  }
  return paragraphs.join("\n\n");
}
