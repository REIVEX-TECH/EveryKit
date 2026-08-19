/**
 * The four text tools. One entry per route, and the single source for the
 * directory on the home page, the tool switcher and the SEO pages.
 */

export type ToolSlug = "word-counter" | "case-converter" | "clean-text" | "lorem-ipsum";

export type Faq = { q: string; a: string };

export type Tool = {
  slug: ToolSlug;
  title: string;
  /** One line, on the tile and in the switcher. */
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  faq: Faq[];
};

/** First on every page. Short, because on this kit it is genuinely simple. */
const PRIVACY_ANSWER: Faq = {
  q: "Is my text sent anywhere?",
  a: "No. Every count and every conversion happens in this page as you type. There is no server here that could receive what you paste, and you can check it in your browser's network tab: typing produces no requests at all.",
};

export const tools: Tool[] = [
  {
    slug: "word-counter",
    title: "Word counter",
    blurb: "Words, characters, sentences and reading time",
    seoTitle: "Word counter, free and instant, nothing uploaded",
    description:
      "Count words, characters with and without spaces, sentences and reading time. Updates as you type, entirely in your browser.",
    intro: [
      "Paste or type, and the counts update on every keystroke. Nothing is sent anywhere.",
      "Reading time is at 200 words a minute, which is an ordinary adult reading pace for something they are not studying.",
    ],
    faq: [
      PRIVACY_ANSWER,
      {
        q: "How is a word counted?",
        a: "As a run of characters with whitespace on either side. That is the right model for English, Urdu, Arabic and every European language. It is not right for Chinese or Japanese, which do not put spaces between words: those come out as very few very long words, and the character count is the number to use there instead.",
      },
      {
        q: "How is a sentence counted?",
        a: "By counting the pieces between sentence-ending punctuation. That includes the Urdu full stop and question mark, the Devanagari danda and the ideographic full stop, not only the Latin three. Without those, a paragraph of Urdu would count as one sentence.",
      },
      {
        q: "Why does an emoji count as one character?",
        a: "Because that is what it looks like. Internally a thumbs-up is two units and a family emoji is several, so a naive count reports more characters than you can see. The count here groups by what renders as a single character.",
      },
    ],
  },
  {
    slug: "case-converter",
    title: "Case converter",
    blurb: "UPPER, lower, Title and Sentence case",
    seoTitle: "Case converter, upper, lower, title and sentence case",
    description:
      "Convert text between UPPER CASE, lower case, Title Case and Sentence case. Keeps acronyms intact. Runs in your browser.",
    intro: [
      "Paste text and pick a case. The result appears straight away and the spacing you typed is preserved exactly.",
      "Acronyms are left alone, so NASA stays NASA rather than becoming Nasa or nasa.",
    ],
    faq: [
      PRIVACY_ANSWER,
      {
        q: "What counts as an acronym?",
        a: "A word of two or more characters that is entirely capitals, allowing digits, dots, hyphens and a possessive ending. So NASA, PDF, U.K., R2D2 and USA's are all left exactly as they are, in every mode.",
      },
      {
        q: "Why did text I typed in capitals come back unchanged?",
        a: "Because the acronym rule read the whole thing as one long acronym. That is the trade for protecting NASA and PDF, and the page warns you when it spots it rather than leaving it as a surprise. Convert to lower case first, then to the case you actually wanted.",
      },
      {
        q: "Which small words stay lower case in Title Case?",
        a: "A short, uncontroversial set: a, an, and, as, at, but, by, for, from, if, in, into, nor, of, on, onto, or, over, per, so, the, to, up, via, vs, with, yet. They are still capitalised when they are the first or last word. Longer lists start disagreeing with each other and with the person using them.",
      },
    ],
  },
  {
    slug: "clean-text",
    title: "Clean text",
    blurb: "Fix spacing, line breaks and duplicate lines",
    seoTitle: "Clean up messy text, spacing, line breaks and duplicates",
    description:
      "Trim extra spaces, remove line breaks and drop duplicate lines. Each one a separate switch, applied as you type.",
    intro: [
      "Text pasted out of a PDF or an email arrives full of broken lines and doubled spaces. Turn on the fixes you want and the cleaned version appears beside it.",
      "Each switch is separate, so you can take the one thing you need and leave the rest alone.",
    ],
    faq: [
      PRIVACY_ANSWER,
      {
        q: "In what order are the fixes applied?",
        a: "Spaces are collapsed first, so two lines that differ only by trailing whitespace count as the same line. Duplicates are removed next, while there are still lines to compare. Line breaks are removed last, because afterwards there are no lines left. That order is what makes the switches compose sensibly in any combination.",
      },
      {
        q: "Are blank lines treated as duplicates?",
        a: "No. Blank lines are structure rather than content, so they survive even with duplicate removal switched on. Otherwise every paragraph break after the first would disappear.",
      },
      {
        q: "Does it change anything I have not asked it to?",
        a: "No. With every switch off the text comes out byte for byte as it went in, which is worth knowing before you paste something you care about.",
      },
    ],
  },
  {
    slug: "lorem-ipsum",
    title: "Lorem ipsum",
    blurb: "Placeholder text, by paragraphs or words",
    seoTitle: "Lorem ipsum generator, by paragraph or word count",
    description:
      "Generate placeholder text by paragraphs or by an exact word count, starting with the classic opening.",
    intro: [
      "Pick paragraphs or an exact number of words. The classic opening is on by default, because that is what people recognise as filler.",
      "The same settings always produce the same text, so a reload does not shuffle what you had.",
    ],
    faq: [
      PRIVACY_ANSWER,
      {
        q: "Why is the text the same every time?",
        a: "It is generated from a seed rather than at random. That means regenerating gives you back what you had instead of something new, and it also lets the tests assert on exact output rather than on vague shapes.",
      },
      {
        q: "Can I get an exact word count?",
        a: "Yes. Switch the unit to words and ask for a number, and you get precisely that many, which is the usual reason anyone needs filler in the first place: to see how a real length sits in a layout.",
      },
      {
        q: "Is there a limit?",
        a: "Two thousand words or fifty paragraphs. Past that the page is slower to update than the text is useful, so the request is clamped rather than left to grind.",
      },
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
