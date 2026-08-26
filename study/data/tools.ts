/**
 * The six tools. One entry per route, and the single source for the
 * launcher on the home page, the tool switcher and every SEO page.
 */

export type ToolSlug =
  | "gpa"
  | "final-grade"
  | "citation"
  | "reading-time"
  | "timer"
  | "exam-countdown"
  | "flashcards"
  | "timetable"
  | "note-cleaner"
  | "scientific-calculator"
  | "essay-length"
  | "molar-mass"
  | "periodic-table"
  | "roman-numerals";

export type Faq = { q: string; a: string };

/**
 * The shelf a tool sits on. The landing groups by these so eleven tools read as
 * four short, labelled sets rather than one wall, which keeps the kit feeling
 * simple. Each tool's own page stays one job with minimal controls.
 */
export type Category = "grades" | "writing" | "revision" | "planning";

export const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: "grades", label: "Grades and numbers" },
  { id: "writing", label: "Writing" },
  { id: "revision", label: "Revision" },
  { id: "planning", label: "Planning your time" },
];

export type Tool = {
  slug: ToolSlug;
  title: string;
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  faq: Faq[];
  category: Category;
};

const PRIVACY: Faq = {
  q: "Is anything I type sent anywhere?",
  a: "No. Every tool here runs in the page itself. There is no server that receives your grades, your essay or your sources, and you can check it in your browser's network tab: using a tool produces no request carrying what you typed.",
};

export const tools: Tool[] = [
  {
    slug: "gpa",
    category: "grades",
    title: "GPA calculator",
    blurb: "Weighted by credits, letters or percentages",
    seoTitle: "GPA calculator, weighted by credits, 4.0 scale or percentages",
    description:
      "Work out your weighted GPA from course credits and grades, on the 4.0 scale or from percentages. Runs in your browser, nothing is stored.",
    intro: [
      "Add your courses with their credits and grades. The GPA updates as you type.",
      "Weighted by credits, which is what a transcript does: a four credit course moves your GPA four times as much as a one credit one.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Why is my GPA not the average of my grades?",
        a: "Because credits weight it. A one credit A and a four credit C average to a B if you ignore the credits, and that is not what a registrar calculates. Every course contributes its grade points multiplied by its credits, and the total is divided by the credits rather than by the number of courses.",
      },
      {
        q: "Which grade scale is this?",
        a: "The common United States four point scale, where an A and an A plus are both 4.0, an A minus is 3.7, a B plus is 3.3 and so on down to F at zero. The full mapping is in the grade menu. Institutions differ, some run to 4.3 for an A plus, so check yours against the list before trusting the number.",
      },
      {
        q: "Why will it not accept zero credits?",
        a: "Because a course worth zero credits contributes nothing to the total and nothing to the divisor, so it would silently vanish from the answer. Rather than drop the row quietly, the tool says the credits have to be more than zero and carries on with the rest.",
      },
      {
        q: "Can I use percentages instead of letters?",
        a: "Yes. Switch the scale and type percentages, and each one is converted on the usual bands: 93 and above is a 4.0, 90 is an A minus at 3.7, and so on. Those bands are common but not universal, so if your syllabus prints its own table, use that.",
      },
    ],
  },
  {
    slug: "final-grade",
    category: "grades",
    title: "Final grade calculator",
    blurb: "What you need on the final exam",
    seoTitle: "Final grade calculator, what you need on the exam, honest about 100",
    description:
      "Work out the mark you need on your final exam to finish at the grade you want. Says plainly when the target is not reachable rather than printing a number above 100.",
    intro: [
      "Your grade so far, what the final is worth, and the mark you want. The answer is one sentence.",
      "When the target cannot be reached, the tool says so rather than telling you to score 137 percent.",
    ],
    faq: [
      PRIVACY,
      {
        q: "How is it worked out?",
        a: "If the final is worth w of the course and everything else so far is c, the course ends at c times one minus w, plus your exam mark times w. Solving that for the exam mark is the whole calculation. It assumes everything except the final is already settled, which it is once the exam is all that is left.",
      },
      {
        q: "Why does it say a target is not reachable?",
        a: "Because sometimes it is not. If you are carrying 60 percent into a final worth 20 percent of the course, the highest you can finish is 68, and no mark on the exam changes that. Most calculators print the required 150 percent as though it were an answer. This one says what the ceiling actually is.",
      },
      {
        q: "What is the grade so far?",
        a: "Your current mark for everything except the final, as a percentage. If your syllabus lists assignments at 40 percent and a midterm at 30, that 70 percent of the course is what this number is out of, not the whole thing.",
      },
    ],
  },
  {
    slug: "citation",
    category: "writing",
    title: "Citation generator",
    blurb: "APA 7 and MLA 9, web, video, podcast, newspaper",
    seoTitle: "APA 7 and MLA 9 citation generator, web, video, podcast and newspaper",
    description:
      "Build a citation in APA 7 or MLA 9 for a web page, video, podcast or newspaper, with correct italics and punctuation. Copy as plain text or with the italics kept.",
    intro: [
      "Fill in what you have and the citation builds itself in both styles.",
      "Two copy buttons: plain text for anywhere, and one that keeps the italics for a word processor.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Does it look up my source?",
        a: "No, and that is deliberate. It formats what you type. It does not resolve a DOI, fetch a page or check that the source exists, so the spelling and the details are yours to get right. A tool that looked things up would need to send your source list to a server, and this one does not have one.",
      },
      {
        q: "Why are there two copy buttons?",
        a: "Because italics are part of being correct, and plain text cannot carry them. The second button puts real formatting on the clipboard, so pasting into a word processor keeps the journal title italic. Copying asterisks around it would be a markdown convention rather than a citation style.",
      },
      {
        q: "Which parts are italic?",
        a: "The larger work. An article inside a journal is upright and the journal is italic; a standalone book or report is italic itself. Both styles agree on that, and the tool switches based on whether you filled in a source.",
      },
      {
        q: "Which kinds of source does it handle?",
        a: "A web page or article, a video, a podcast episode and a newspaper article, each with the fields and the exact format that style uses for it: a video takes an uploader and a site and is tagged [Video] in APA; a podcast italicises the show; a newspaper italicises the paper. Pick the type at the top and the fields change to match.",
      },
      {
        q: "What about a chapter in an edited book, or a film?",
        a: "Those are not among the types here yet. Both styles have rules for cases these fields cannot express, and your department may have house variations on top. For those, check your style guide rather than assuming this covers it.",
      },
    ],
  },
  {
    slug: "reading-time",
    category: "revision",
    title: "Reading time calculator",
    blurb: "Reading, speaking and pages",
    seoTitle: "Reading time calculator, speaking time and page estimate",
    description:
      "How long a text takes to read and to say out loud, at a pace you set, plus a page estimate with its assumptions stated. Runs in your browser.",
    intro: [
      "Paste the text or type a word count. Both are how the question arrives.",
      "The page estimate names the font, size, spacing and margins it assumes, because those are what decide it.",
    ],
    faq: [
      PRIVACY,
      {
        q: "What reading speed should I use?",
        a: "200 words a minute is an ordinary adult pace for something you are not studying. Drop to around 100 for a dense textbook and raise it towards 300 for something familiar. The slider is there because there is no single right number.",
      },
      {
        q: "Why is speaking so much slower than reading?",
        a: "Because your mouth is slower than your eyes. A comfortable presenting pace is about 130 words a minute, and under 120 if you are being interpreted or recorded. A five minute talk is therefore around 650 words, not the 1000 a reading pace would suggest.",
      },
      {
        q: "How reliable is the page count?",
        a: "It is an estimate and the page says so. Roughly 250 words fill a double spaced page and 500 a single spaced one, in a 12 point serif with one inch margins. Change the font, the size, the spacing or the margins and the count changes with it, which is why those assumptions are printed rather than hidden.",
      },
      {
        q: "Does it count words in any language?",
        a: "It counts runs of characters with spaces around them, which is right for English, Urdu, Arabic and the European languages. Chinese and Japanese do not put spaces between words, so a count of those comes out far too low and the times with it.",
      },
    ],
  },
  {
    slug: "timer",
    category: "planning",
    title: "Pomodoro timer",
    blurb: "25 and 5, editable, with a gentle chime",
    seoTitle: "Pomodoro timer, 25 and 5 by default, no account and nothing stored",
    description:
      "A clean pomodoro timer with 25 minute focus and 5 minute breaks, both editable. Countdown in the tab title, a gentle chime, no account and nothing stored.",
    intro: [
      "Start it and work. It switches to a break on its own and chimes when it does.",
      "The countdown is in the tab title too, so it is readable from whatever you are actually working in.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Does it keep a history of my sessions?",
        a: "No. It counts the sessions finished in this tab and forgets them when you close it. Keeping a history would need somewhere to keep it, and the only thing this site stores is an email address.",
      },
      {
        q: "Will it keep time if I switch tabs?",
        a: "Yes. Browsers throttle timers in background tabs to around once a minute, so a timer that counted down by one each second would be minutes wrong when you came back. This one works out the time left from the clock, so it is right whatever the browser did while it was hidden.",
      },
      {
        q: "Where does the chime come from?",
        a: "It is generated in the page: two sine tones a fifth apart with a soft envelope. No sound file is downloaded, which means nothing to host and nothing to load. Browsers only allow audio after you have interacted with the page, so the first chime works because you pressed start.",
      },
      {
        q: "Why 25 and 5?",
        a: "That is the pomodoro convention, and it is only a convention. Both are editable up to two hours, so if you work in 50 minute blocks or 15 minute ones, set them and ignore the name.",
      },
    ],
  },
  {
    slug: "exam-countdown",
    category: "planning",
    title: "Exam countdown",
    blurb: "A shareable countdown, saved in the link",
    seoTitle: "Exam countdown timer, shareable by link, nothing stored",
    description:
      "Count down the days to an exam, and share it as a link. The name and date live in the URL, so nothing is stored anywhere.",
    intro: [
      "Type the exam name and date and watch the days count down. Copy the link to keep it or send it to a friend.",
      "Nothing is saved. The details ride in the link itself, so opening it later rebuilds the same countdown with no account and no record kept here.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Where is my countdown saved?",
        a: "In the link, and nowhere else. The exam name and date are encoded into the URL, so there is no account and no stored list. Bookmark the link or send it on, and it rebuilds the countdown from what the link carries.",
      },
      {
        q: "Can I share it?",
        a: "Yes, that is the point of it. Copy the link and send it; whoever opens it sees the same countdown, because everything it needs is in the link. The line under the button says as much, so nobody assumes their exam dates were uploaded somewhere.",
      },
      {
        q: "What time of day does it count to?",
        a: "The end of the exam day, local time. So on the morning of the exam it still reads as today rather than having ticked over to passed the night before.",
      },
      {
        q: "Does the countdown keep running if I close the tab?",
        a: "It picks up wherever it should be whenever you open the link, because it is worked out from the date each time rather than counted in the background. There is nothing running while the tab is closed, and nothing to run.",
      },
    ],
  },
  {
    slug: "flashcards",
    category: "revision",
    title: "Flashcards",
    blurb: "Make a deck, study it, share it by link",
    seoTitle: "Flashcards online, free, shareable by link with nothing stored",
    description:
      "Make a flashcard deck, study it one card at a time, and share the whole deck as a link. Runs in your browser, nothing is stored.",
    intro: [
      "Type your terms and definitions, then study: one card at a time, space to flip, arrow keys to move, and a button to mark each one known or still learning.",
      "The whole deck is packed into the link, so sharing a deck is sending a URL. Nothing is saved on a server, and there is no account.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Where is my deck saved?",
        a: "In the link. The terms and definitions are encoded into the URL, so copying the share link is how you keep a deck or send it to someone. There is no account and no stored list, which also means a very large deck makes a very long link." ,
      },
      {
        q: "How do I study without the mouse?",
        a: "Space flips the current card between term and definition, and the left and right arrow keys move between cards. The known and still-learning buttons are reachable by tab like any other control.",
      },
      {
        q: "Does it track what I have learned over time?",
        a: "Only within the current study session. It counts what you marked known this time through and forgets it when you leave, because remembering it would need somewhere to store it, and the only thing this site keeps is an email address.",
      },
      {
        q: "Can I shuffle the deck?",
        a: "Yes. Shuffle reorders the cards for this session and resets what you had marked, so a second pass is not always in the same order.",
      },
    ],
  },
  {
    slug: "timetable",
    category: "planning",
    title: "Class timetable",
    blurb: "Build a weekly grid, export PNG or PDF",
    seoTitle: "Weekly class timetable maker, export as PNG or PDF, nothing stored",
    description:
      "Build a weekly class schedule, see it as a clean grid, and export it as a PNG or a PDF. It lives in the link and in your browser; nothing is uploaded.",
    intro: [
      "Add each class with its day, time, name, location and a colour, and the weekly grid fills in. Weekdays always show, and a weekend column appears only if you put a class on it.",
      "Export the grid as a PNG for your phone or a PDF to print. The schedule is held in the link and in this page only, so nothing is uploaded and nothing is stored on a server.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Where is my timetable kept?",
        a: "In the link and in the page. The classes are encoded into the URL, so copying the share link is how you keep it or send it. There is no account and nothing is stored on a server.",
      },
      {
        q: "How does the export work?",
        a: "The grid is drawn onto a canvas in your browser and saved straight to your device, as a PNG image or, using the same drawing embedded into a page, a PDF. Neither leaves your device to be made." ,
      },
      {
        q: "Can I add weekend classes?",
        a: "Yes. Pick Saturday or Sunday when you add a class and that column appears. It stays hidden while there is nothing on it, to keep the weekday grid uncluttered.",
      },
      {
        q: "Why did my class not appear?",
        a: "A class needs a name and an end time later than its start time. If either is missing the tool says so rather than adding an empty or backwards block.",
      },
    ],
  },
  {
    slug: "note-cleaner",
    category: "writing",
    title: "Note cleaner",
    blurb: "Pull the key sentences, tidy the text",
    seoTitle: "Extract key points from notes, free, and it selects not rewrites",
    description:
      "Paste notes and get the most important sentences pulled out, plus a tidy-up: spacing fixed, duplicate lines dropped, bullets normalised. Runs in your browser.",
    intro: [
      "Paste lecture notes or an article and get the key sentences pulled out by sentence ranking, and a cleaned-up copy with the spacing and bullets tidied.",
      "This selects sentences, it does not rewrite them, so the key points are your own words. It is honest extractive work, not an AI summary, and it says so on the results.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Is this an AI summary?",
        a: "No, and the difference matters. It ranks the sentences by how central they are and shows you the top few, unchanged. Nothing is reworded or invented. A tool that rewrites text needs a language model and a server; this is arithmetic on the words you pasted.",
      },
      {
        q: "How does it pick the key sentences?",
        a: "With a small TextRank pass: sentences that share more words with the rest of the text score higher, the way an important idea is one the rest keeps referring back to. It is a rough guide to what is central, not a judgement of what matters to you.",
      },
      {
        q: "What does the tidy-up change?",
        a: "It collapses runs of spaces, removes a space left before a comma or full stop, drops lines that repeat, and turns assorted bullet characters into a plain dash. It does not touch your wording.",
      },
      {
        q: "It missed the point I cared about. Why?",
        a: "Because central is not the same as important to you. Sentence ranking finds what the passage keeps circling, which usually but not always includes the point you were after. Treat the key points as a starting shortlist, not the last word.",
      },
    ],
  },
  {
    slug: "scientific-calculator",
    category: "grades",
    title: "Scientific calculator",
    blurb: "Powers, roots, trig, logs, memory",
    seoTitle: "Scientific calculator online, free, with trig, logs and memory",
    description:
      "A scientific calculator: arithmetic, powers, roots, trig, logs, parentheses and memory, with keyboard input. Runs in your browser.",
    intro: [
      "Type an expression or use the pad. It handles the usual arithmetic plus powers, roots, trig, logs, factorials, parentheses and memory, and Enter works out the answer.",
      "Trig follows the degree or radian mode you pick. Everything is worked out in the page, with no server and nothing stored.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Degrees or radians?",
        a: "Your choice, with a toggle above the pad. It starts in degrees, because that is what most homework uses, and switches to radians when you need them. The mode applies to sin, cos, tan and their inverses.",
      },
      {
        q: "Can I type instead of pressing buttons?",
        a: "Yes. The screen is an ordinary text field, so you can type the whole expression, including function names like sin and sqrt, and press Enter. The buttons just save typing.",
      },
      {
        q: "What does the memory do?",
        a: "M plus adds the current value to memory, M minus subtracts it, MR puts the stored number into the expression, and MC clears it. It is the standard calculator memory, held only while the page is open.",
      },
      {
        q: "Is it safe to paste a long expression?",
        a: "Yes. The expression is parsed by a small maths evaluator, not run as code, so there is no way for what you type to do anything other than arithmetic.",
      },
    ],
  },
  {
    slug: "essay-length",
    category: "writing",
    title: "Essay length",
    blurb: "Words, pages, reading and speaking time",
    seoTitle: "Essay word count and page estimate, free, with reading time",
    description:
      "Paste an essay to see word count, character count, estimated pages at common formats, reading time and speaking time. Runs in your browser.",
    intro: [
      "Paste your writing and see the counts update live: words, characters, sentences, and how many pages it fills at the common submission formats.",
      "It also estimates reading and speaking time, so you know how a piece will sit in a talk as well as on the page. Nothing is uploaded.",
    ],
    faq: [
      PRIVACY,
      {
        q: "How can it know my page count?",
        a: "It estimates from words, at 12 point with one inch margins, double-spaced, one and a half, and single. Change the font, the size, the spacing or the margins and the real count changes, which is why the format is named next to each number rather than presented as a fact.",
      },
      {
        q: "Which word count is right, this or my word processor's?",
        a: "They will usually agree within a handful. This counts runs of characters separated by spaces, which is what most processors do, but they differ on things like hyphenated words and numbers, so treat a rubric's limit with a little slack either way.",
      },
      {
        q: "Where do the reading and speaking times come from?",
        a: "Reading at about 200 words a minute and speaking at about 130, which are comfortable averages. Your own pace will differ, so use them to plan a talk rather than to time it to the second.",
      },
    ],
  },
  {
    slug: "molar-mass",
    category: "grades",
    title: "Molar mass calculator",
    blurb: "A chemical formula to its molar mass, with the breakdown",
    seoTitle: "Molar mass calculator online, with per-element breakdown, free",
    description:
      "Type a chemical formula, including brackets and hydrates, and get its molar mass in grams per mole with a per-element breakdown. Runs in your browser.",
    intro: [
      "Type a formula, brackets and hydrate dots included, like Ca(OH)2 or CuSO4·5H2O, and the molar mass appears in grams per mole, with each element's contribution and its share of the total.",
      "The atomic weights are the standard IUPAC values, held in the page, so nothing you type is sent anywhere.",
    ],
    faq: [
      PRIVACY,
      { q: "Does it understand brackets and hydrates?", a: "Yes. Nested brackets like (NH4)2SO4 and hydrates written with a dot like CuSO4·5H2O or CuSO4.5H2O both work, with the coefficient after the dot applied to the water. It sums every element across the whole formula." },
      { q: "Why does case matter?", a: "Because a symbol is one capital letter and up to one small one. Co is cobalt; CO is carbon then oxygen. Getting the case wrong is a common way to a confidently wrong answer, so the tool reads symbols exactly and flags anything that is not a real element." },
      { q: "How accurate are the masses?", a: "They are the IUPAC standard atomic weights to four significant figures, which is plenty for school and undergraduate work. A few elements have no stable isotope, so their mass is the best-known isotope's mass number, and the tool says so when one appears in your formula." },
    ],
  },
  {
    slug: "periodic-table",
    category: "revision",
    title: "Periodic table",
    blurb: "Every element, searchable, with its details",
    seoTitle: "Interactive periodic table online, searchable, free",
    description:
      "A searchable periodic table: find any element by name, symbol or number and see its atomic number, symbol, mass, category, group and period. Runs in your browser.",
    intro: [
      "Search by name, symbol or atomic number, or pick any element from the table, and its details appear: the atomic number, symbol, standard atomic weight, category, group and period.",
      "The whole table is held in the page from standard data, so it works offline once loaded and sends nothing anywhere.",
    ],
    faq: [
      PRIVACY,
      { q: "Where does the data come from?", a: "The standard IUPAC atomic weights, vendored into the page rather than fetched, so the table loads instantly and works with no connection. The masses are to four significant figures." },
      { q: "How do I find an element quickly?", a: "Type its name, its symbol or its atomic number in the search box and the matches stay bright while the rest dim. Then click it, or any element in the grid, to read its details." },
      { q: "What do the colours mean?", a: "Each colour is a category: alkali metal, noble gas, halogen and so on, listed in the key under the table. They group elements that behave alike, which is much of what the table is for." },
    ],
  },
  {
    slug: "roman-numerals",
    category: "grades",
    title: "Roman numeral converter",
    blurb: "Numbers to Roman numerals and back, live",
    seoTitle: "Roman numeral converter online, number to Roman and back, free",
    description:
      "Convert a number to Roman numerals and a Roman numeral back to a number, live, from 1 to 3999, with the rules explained. Runs in your browser.",
    intro: [
      "Type a number and see its Roman numeral, or type a numeral and see the number. It works both ways as you type, across the range the numerals actually cover, 1 to 3999.",
      "A malformed numeral is flagged rather than half-read, so IIII does not quietly become 4. Nothing is sent anywhere.",
    ],
    faq: [
      PRIVACY,
      { q: "Why does it stop at 3999?", a: "Because the plain numerals do. There is no zero, no single letter past M for 1000, and the standard way to write larger numbers, a bar over a letter for a thousand times its value, is not agreed on or easy to type. So the tool covers 1 to 3999 rather than inventing notation." },
      { q: "What makes a numeral valid?", a: "The canonical subtractive form: a letter repeats at most three times, and only I, X and C subtract, each only before the next one or two sizes up. IIII, VX and IC are not valid, and the tool says so instead of guessing what you meant." },
      { q: "Is it case-sensitive?", a: "No. You can type mcmxciv or MCMXCIV; both read as 1994. The output is always in capitals, which is the usual way to write numerals." },
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
