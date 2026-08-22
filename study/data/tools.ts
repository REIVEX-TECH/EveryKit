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
  | "exam-countdown";

export type Faq = { q: string; a: string };

export type Tool = {
  slug: ToolSlug;
  title: string;
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  faq: Faq[];
};

const PRIVACY: Faq = {
  q: "Is anything I type sent anywhere?",
  a: "No. Every tool here runs in the page itself. There is no server that receives your grades, your essay or your sources, and you can check it in your browser's network tab: using a tool produces no request carrying what you typed.",
};

export const tools: Tool[] = [
  {
    slug: "gpa",
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
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
