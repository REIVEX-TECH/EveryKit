/**
 * The seven text tools. One entry per route, and the single source for the
 * directory on the home page, the tool switcher, the sitemap and the SEO pages.
 */

export type ToolSlug =
  | "word-counter"
  | "case-converter"
  | "clean-text"
  | "find-replace"
  | "remove-duplicate-lines"
  | "sort-lines"
  | "lorem-ipsum"
  | "read-aloud";

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
    slug: "find-replace",
    title: "Find and replace",
    blurb: "Swap text, plain or with a pattern",
    seoTitle: "Find and replace text online, plain or regex, free",
    description:
      "Find and replace across a block of text, plain or with a regular expression, with a live count of the matches. Runs in your browser.",
    intro: [
      "Type what to find and what to put in its place, and see the result and the number of matches update as you go.",
      "Plain mode treats what you type literally, so a full stop is a full stop. Switch on regular expressions when you need patterns and groups.",
    ],
    faq: [
      PRIVACY_ANSWER,
      { q: "What is the difference between plain and regex?", a: "Plain mode looks for exactly the characters you type, so \"a.b\" matches \"a.b\" and nothing else. Regex mode reads your search as a pattern, so \".\" means any character and \"(\\d+)\" captures a run of digits you can reuse in the replacement as $1." },
      { q: "How do I reuse part of a match?", a: "In regex mode, wrap the part in brackets and refer to it in the replacement as $1, $2 and so on. Turning a date around, for example: find (\\d{4})-(\\d{2})-(\\d{2}) and replace with $3/$2/$1." },
      { q: "What if my regular expression is wrong?", a: "It tells you, rather than doing nothing or breaking. An unclosed bracket or a stray quantifier produces a message under the field, and the text is left untouched until the pattern is valid." },
      { q: "Is it case-sensitive?", a: "You choose. There is a toggle; by default it ignores case, which is what most everyday replacing wants." },
    ],
  },
  {
    slug: "remove-duplicate-lines",
    title: "Remove duplicate lines",
    blurb: "Keep the first of each line, drop the rest",
    seoTitle: "Remove duplicate lines from text online, free",
    description:
      "Remove repeated lines from a list, keeping the first of each, with options to ignore case and surrounding spaces. Runs in your browser.",
    intro: [
      "Paste a list and get it back with the repeats gone and the first of each kept in place. It tells you how many it removed.",
      "Two toggles handle the awkward cases: ignore the spaces around a line, and ignore whether it is capitalised, when deciding what counts as the same.",
    ],
    faq: [
      PRIVACY_ANSWER,
      { q: "Which copy of a duplicate is kept?", a: "The first one, in the order they appear, and it is kept exactly as written. The toggles only change how two lines are compared, never how the kept line looks." },
      { q: "Does it reorder my lines?", a: "No. The lines that survive stay in their original order. If you want them sorted as well, run the result through the sort tool afterwards." },
      { q: "What do the toggles do?", a: "Ignore surrounding spaces treats \" apple \" and \"apple\" as the same line. Ignore case treats \"Apple\" and \"apple\" as the same. Both off means only exactly identical lines are treated as duplicates." },
      { q: "Does it change the last line?", a: "No. Blank lines are treated like any other line, so a run of empty lines is collapsed to one if they count as duplicates of each other." },
    ],
  },
  {
    slug: "sort-lines",
    title: "Sort lines",
    blurb: "A to Z, Z to A, numeric, or shuffle",
    seoTitle: "Sort lines of text online, alphabetical or numeric, free",
    description:
      "Sort lines alphabetically, in reverse, in natural numeric order, or shuffle them. Runs in your browser and nothing is uploaded.",
    intro: [
      "Paste a list and sort it: A to Z, Z to A, natural order that reads numbers as numbers, or a shuffle when you want them mixed.",
      "Natural order is the one people usually mean for anything with numbers in it, so \"file2\" comes before \"file10\" rather than after it.",
    ],
    faq: [
      PRIVACY_ANSWER,
      { q: "What is natural order?", a: "It reads runs of digits as numbers, so \"file2\" sorts before \"file10\". Plain alphabetical order compares character by character and puts \"file10\" first, because \"1\" comes before \"2\", which is almost never what you want for a numbered list." },
      { q: "Is the sort case-sensitive?", a: "A to Z and Z to A compare by character code, so capitals group ahead of lower case. For a list where that matters, tidy the case first with the case converter, then sort." },
      { q: "What does shuffle do?", a: "It puts the lines in a random order, which is useful for drawing names or randomising a quiz. Every line is kept; only the order changes." },
      { q: "Can I compare two lists instead?", a: "That is a different job, and the developer kit does it: its diff tool shows what changed line by line. This tool sorts a single list." },
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
  {
    slug: "read-aloud",
    title: "Read aloud",
    blurb: "Have text spoken by your device's voice",
    seoTitle: "Read text aloud in your browser, free, with no upload",
    description:
      "Paste text and have it read aloud by a voice on your device, with speed and pitch you can set. Runs in your browser; nothing is uploaded.",
    intro: [
      "Paste some text, choose a voice, set the speed and pitch, and press play. It is useful for proofreading by ear, for resting your eyes, or for hearing how a paragraph actually sounds.",
      "The voices are the ones installed on your device, and the reading happens in your browser. Your text is not uploaded, and the sound plays through your speakers rather than being saved to a file.",
    ],
    faq: [
      PRIVACY_ANSWER,
      { q: "Why can I not download the audio?", a: "Because a browser has no reliable way to record the speech it synthesizes. Rather than a download button that sometimes hands you a silent file, there is none. The reading plays through your speakers, live." },
      { q: "Where do the voices come from?", a: "From your own device. The list is whatever your operating system and browser have installed, which is why it differs between a phone and a laptop, and between one phone and another. None of them involve a server of ours." },
      { q: "Which languages are available?", a: "Whichever your device has voices for. Most devices ship with several, and you can add more in your system settings. The tool defaults to a voice in your browser's language when one is present." },
      { q: "It is silent or the voice list is empty. Why?", a: "Some browsers load their voices a moment after the page, so give it a second and reopen the list. If a browser has no speech synthesis at all the tool says so instead of pretending to work." },
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
