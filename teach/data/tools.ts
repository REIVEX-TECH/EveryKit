/**
 * The eleven teaching tools. One entry per route, and the single source for the
 * launcher on the home page, the tool switcher, the sitemap and every SEO page.
 */

export type ToolSlug =
  | "rubric"
  | "gradebook"
  | "worksheet"
  | "curve"
  | "random-picker"
  | "groups"
  | "seating"
  | "attendance"
  | "certificate"
  | "timetable"
  | "timer";

export type Faq = { q: string; a: string };

/**
 * The shelf a tool sits on. The landing filters by these with a chip row, so a
 * grid of eleven reads as a few labelled sets rather than a wall, which keeps
 * the kit simple to scan. The order here is the order the chips appear.
 */
export type Category = "grading" | "class" | "motivation";

export const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: "grading", label: "Grading" },
  { id: "class", label: "Class management" },
  { id: "motivation", label: "Motivation and time" },
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

/** First on every page, because it is the question a teacher should ask. */
const PRIVACY: Faq = {
  q: "Is my class data sent anywhere?",
  a: "No. Every tool here runs in the page itself. There is no server that receives your students' names or their marks, and you can check it in your browser's network tab: using a tool produces no request carrying what you typed. The one thing this site stores is an email address, given at the point you download or copy a result.",
};

export const tools: Tool[] = [
  {
    slug: "rubric",
    category: "grading",
    title: "Rubric maker",
    blurb: "Criteria, levels and points, as a printable PDF",
    seoTitle: "Grading rubric maker, free, export a printable PDF",
    description:
      "Build a grading rubric with criteria rows and level columns, points per cell, and a live preview. Export a clean PDF. Runs in your browser.",
    intro: [
      "Add your criteria down the side and your performance levels across the top, set the points in each cell, and the rubric builds as you go.",
      "Export it as a PDF to print or attach. Nothing is uploaded; the rubric is drawn on your own device.",
    ],
    faq: [
      PRIVACY,
      { q: "How many criteria and levels can I have?", a: "As many as fit a page usefully. A rubric with four to six criteria and three to five levels prints cleanly; past that a page gets dense, so the preview shows you the shape before you export." },
      { q: "Do the points have to add up to anything?", a: "No. The tool sums each row and shows a total, but it does not force a scale. Some rubrics are out of 100, some out of 20, some are holistic; you set the numbers your marking uses." },
      { q: "Can I reuse a rubric next term?", a: "Keep the PDF, or the link if you shared one. Nothing is stored on a server, so there is no saved list here to come back to, which is also why nothing about your class is kept." },
    ],
  },
  {
    slug: "gradebook",
    category: "grading",
    title: "Gradebook",
    blurb: "Weighted totals and letter grades, export CSV",
    seoTitle: "Weighted gradebook calculator, letter grades, export CSV",
    description:
      "Enter students and scores across weighted assessments, and see each student's weighted total and letter grade, plus the class average, high and low. Export CSV.",
    intro: [
      "Add your assessments with a weight each, type the scores, and every student's weighted total and letter grade update as you go, with the class average, highest and lowest alongside.",
      "The grade-scale mapping is editable, because a 90 is not an A everywhere. Export the whole thing as CSV. It all happens in your browser.",
    ],
    faq: [
      PRIVACY,
      { q: "How is the weighted total worked out?", a: "Each assessment's score is taken as a percentage of its maximum, multiplied by its weight, and the weighted scores are summed and divided by the total weight. So a final worth 50 percent moves the total twice as much as a quiz worth 25." },
      { q: "Can I change what counts as an A?", a: "Yes. The grade scale is a table of cutoffs you can edit, so if your institution puts an A at 85 or uses a different set of letters, set it and the letters follow." },
      { q: "What happens to a blank score?", a: "A blank is left out of that student's total rather than counted as a zero, so a total reflects the work marked so far. If you want a missing piece to count as zero, type a zero." },
    ],
  },
  {
    slug: "worksheet",
    category: "grading",
    title: "Worksheet maker",
    blurb: "Title, instructions and numbered questions to print",
    seoTitle: "Printable worksheet maker, numbered questions, export PDF",
    description:
      "Make a clean printable worksheet: a title, instructions, and numbered questions with optional answer lines or space. Export a PDF. Runs in your browser.",
    intro: [
      "Give it a title and instructions, add your questions, and choose how much answer space each one gets, from a single line to a working area.",
      "Export a tidy PDF ready to print or share. Nothing is uploaded; the sheet is built on your device.",
    ],
    faq: [
      PRIVACY,
      { q: "Can I leave space for answers?", a: "Yes. Each question can have no space, a few lines, or a larger blank area, so a worksheet can be a quiz to hand in or a set of prompts to work through." },
      { q: "Does it make an answer key?", a: "No. This builds the worksheet the students see. Writing the answers is a different job, and mixing the two is how a key ends up on the printed sheet by mistake." },
      { q: "Will it fit on one page?", a: "It flows onto as many pages as the questions need, and the PDF paginates them. The preview shows you the length before you print." },
    ],
  },
  {
    slug: "curve",
    category: "grading",
    title: "Grade curve",
    blurb: "Curve marks by the class distribution, three methods",
    seoTitle: "Grade curve calculator, z-score, percentile or linear, export CSV and PDF",
    description:
      "Paste or upload a class list of raw marks, see the distribution, and curve to letter grades by z-score bands, percentile quotas or a linear scale-up. Shows the math. Export CSV and PDF.",
    intro: [
      "Paste names and marks, or upload a CSV, and the tool shows the shape of the class first: the count, mean, median, standard deviation, the range, and a histogram of the raw marks.",
      "Then curve, your way: by standard-deviation bands, by percentile quotas, or by a linear scale-up, with the cutoffs editable and the working shown. Curving is a policy choice, not a formula, so this shows the math and leaves the decision with you. Nothing is uploaded.",
    ],
    faq: [
      PRIVACY,
      { q: "Which curve is the correct one?", a: "There is no single correct curve, and any tool that says otherwise is hiding a choice. Standard-deviation bands grade by how far above or below the class mean each mark is. Percentile quotas fix in advance what share get each grade. A linear scale-up gently lifts everyone. Your institution's policy decides which is allowed; this tool shows you what each does so you can check it and defend it." },
      { q: "What do the statistics mean for my class?", a: "The mean and median tell you where the middle sits and whether it is skewed; the standard deviation tells you how spread out the marks are. The histogram shows the actual shape, which is the thing a single number hides. Look at it before you curve, because a curve that suits a bell does odd things to a lopsided class." },
      { q: "Can I adjust the cutoffs?", a: "Yes, and that is the point. The z-score band edges and the percentile shares are editable, and the results table and the count in each grade recompute as you change them, so you can see exactly who moves and settle on cutoffs you can stand behind." },
      { q: "Where does the uploaded list go?", a: "Nowhere. The CSV is read in your browser and the marks are curved on your own device. No student name or mark is sent to a server of ours, which you can confirm in the network tab." },
    ],
  },
  {
    slug: "random-picker",
    category: "class",
    title: "Random student picker",
    blurb: "Pick a name at random, no repeats until all are picked",
    seoTitle: "Random student name picker, no-repeat mode, free",
    description:
      "Paste a class list and pick a student at random, with a mode that does not repeat anyone until everyone has been picked. Runs in your browser.",
    intro: [
      "Paste your class list, one name a line, and pick. Turn on the no-repeat mode and the picker works through the whole class before anyone comes up twice, which keeps it fair over a lesson.",
      "The list stays in your browser and is not uploaded.",
    ],
    faq: [
      PRIVACY,
      { q: "How does no-repeat mode work?", a: "It remembers who has been picked this round and draws only from those left, so everyone is called once before the round resets. A counter shows how many are still to come." },
      { q: "Is it actually random?", a: "Yes, from your browser's random number generator, which is fine for picking a name. It is not drawing from a stored list or weighting anyone; each remaining name is equally likely." },
      { q: "Does it keep my class list?", a: "Only while the tab is open. Close it and the list is gone, because nothing is stored on a server. Paste it again next lesson, or keep it in a note of your own." },
    ],
  },
  {
    slug: "groups",
    category: "class",
    title: "Group maker",
    blurb: "Split a class into random groups, printable",
    seoTitle: "Random group generator for a class, by count or size, free",
    description:
      "Split a class list into a number of random groups, or into groups of a set size, with an even-sizes option. Print or export the result. Runs in your browser.",
    intro: [
      "Paste your class, choose how many groups you want or how big each should be, and the tool shuffles the class into them. The even-sizes option spreads any remainder rather than leaving one group short.",
      "Export or print the groups. The list is not uploaded.",
    ],
    faq: [
      PRIVACY,
      { q: "Groups of a number, or a number of groups?", a: "Either. Pick 'a number of groups' to split thirty students into six teams, or 'groups of a size' to make teams of four. The tool tells you the sizes it will produce before it makes them." },
      { q: "How is the remainder handled?", a: "With even sizes on, a class that does not divide evenly has the extra students spread one per group from the top, so sizes differ by at most one. With it off, groups fill to the size you asked and the last one takes what is left." },
      { q: "Can I reshuffle?", a: "Yes. Shuffle again for a fresh split from the same list, which is useful when the first draw put two people together you would rather separate." },
    ],
  },
  {
    slug: "seating",
    category: "class",
    title: "Seating chart",
    blurb: "A seating grid from your class list, export image or PDF",
    seoTitle: "Seating chart generator, random or alphabetical, export image or PDF",
    description:
      "Generate a seating grid from a class list, ordered at random or alphabetically, sized to your room. Export as an image or a PDF. Runs in your browser.",
    intro: [
      "Paste your class, set the rows and columns to match the room, and choose random or alphabetical order. The grid fills in, and empty seats are left blank.",
      "Export it as an image for a screen or a PDF to print. The list is not uploaded.",
    ],
    faq: [
      PRIVACY,
      { q: "How do I match it to my room?", a: "Set the number of rows and columns. The tool places students left to right, row by row, and if there are more seats than students the extra seats stay empty rather than wrapping someone around." },
      { q: "Random or alphabetical?", a: "Random for a fresh arrangement or to break up a clique; alphabetical when you want to find a name on the chart quickly. You can regenerate a random chart until one looks right." },
      { q: "Which way round is the chart?", a: "As you look at the class from the front. The export is labelled so it is clear which row is the front, because a chart that is back to front is worse than none." },
    ],
  },
  {
    slug: "attendance",
    category: "class",
    title: "Attendance sheet",
    blurb: "A printable register with a column per date",
    seoTitle: "Printable attendance sheet maker, date range, export PDF",
    description:
      "Make a printable attendance register from a class name, a student list and a date range, with a checkbox column for each date. Export a PDF. Runs in your browser.",
    intro: [
      "Type the class name, paste the students, and pick a date range. The tool lays out a register with a row per student and a column to tick for each date, skipping weekends if you ask.",
      "Export the PDF and print it for the wall or the clipboard. Nothing is uploaded.",
    ],
    faq: [
      PRIVACY,
      { q: "How many dates fit across a page?", a: "About two to three weeks of dates fit across a landscape page before the columns get too narrow to tick. For a longer range the PDF continues onto more pages, each with the student names repeated." },
      { q: "Can it skip weekends?", a: "Yes. There is an option to leave out Saturdays and Sundays, so a fortnight of school days does not waste columns on days nobody is in." },
      { q: "Is this a digital register?", a: "No, and it is not trying to be. It prints a paper sheet to mark by hand. A digital register would need to store who was in, which is exactly the kind of data this site does not keep." },
    ],
  },
  {
    slug: "certificate",
    category: "motivation",
    title: "Certificate maker",
    blurb: "An award certificate as a printable PDF",
    seoTitle: "Award certificate maker for teachers, free, export PDF",
    description:
      "Make an award certificate with the student's name, the award, the date and the teacher or school, in a few clean templates. Export a PDF. Runs in your browser.",
    intro: [
      "Fill in who it is for, what it is for, the date, and who it is from, pick a template, and the certificate is ready.",
      "Export a PDF to print on whatever paper you like. Nothing is uploaded; it is drawn on your device.",
    ],
    faq: [
      PRIVACY,
      { q: "Can I do a whole class at once?", a: "Not in a single batch here; this makes one certificate at a time, which keeps the tool simple. For a class set, change the name and export again, which is quick once the rest is filled in." },
      { q: "What size does it print at?", a: "It is laid out for a standard landscape page, so it prints on ordinary A4 or Letter without fuss. Use heavier paper if you have it, but plain paper is fine." },
      { q: "Can I add our school logo?", a: "Not yet. An image upload is a different job and a place for a file to go wrong, so for now the templates are typographic. The teacher or school line carries the attribution." },
    ],
  },
  {
    slug: "timetable",
    category: "motivation",
    title: "Teaching timetable",
    blurb: "A weekly schedule, export PNG or PDF",
    seoTitle: "Weekly teaching timetable maker, export PNG or PDF, nothing stored",
    description:
      "Build a weekly teaching schedule, see it as a clean grid, and export it as a PNG or a PDF. It lives in the link and in your browser; nothing is uploaded.",
    intro: [
      "Add each class with its day, time, name, location and a colour, and the weekly grid fills in. Weekdays always show, and a weekend column appears only if you put a class on it.",
      "Export the grid as a PNG for your phone or a PDF to print. The schedule is held in the link and in this page only, so nothing is uploaded.",
    ],
    faq: [
      PRIVACY,
      { q: "Where is my timetable kept?", a: "In the link and in the page. The classes are encoded into the URL, so copying the share link is how you keep it or send it. There is no account and nothing is stored on a server." },
      { q: "How does the export work?", a: "The grid is drawn onto a canvas in your browser and saved straight to your device, as a PNG image or, using the same drawing embedded into a page, a PDF. Neither leaves your device to be made." },
      { q: "Can I add weekend classes?", a: "Yes. Pick Saturday or Sunday when you add a class and that column appears. It stays hidden while there is nothing on it, to keep the weekday grid uncluttered." },
    ],
  },
  {
    slug: "timer",
    category: "motivation",
    title: "Classroom timer",
    blurb: "A big countdown and stopwatch with a gentle cue",
    seoTitle: "Classroom countdown timer and stopwatch, large display, free",
    description:
      "A classroom countdown and stopwatch with a large, readable display and a gentle chime at the end. Runs in your browser; nothing is stored.",
    intro: [
      "Set a countdown for an activity, or run the stopwatch, on a display big enough to read from the back of the room. A gentle chime sounds when a countdown reaches zero.",
      "The time is worked out from the clock, so it stays right even if the tab was in the background, and nothing is stored.",
    ],
    faq: [
      PRIVACY,
      { q: "Will it keep time in a background tab?", a: "Yes. Browsers slow timers in hidden tabs, so this works the remaining time out from the clock rather than counting down by one each second, and it is right whatever the browser did while it was hidden." },
      { q: "Where does the chime come from?", a: "It is generated in the page, two soft tones with a gentle envelope. No sound file is downloaded. Browsers only allow audio after you have interacted with the page, so the chime works because you pressed start." },
      { q: "Can students see it from the back?", a: "That is the point of the large display. Put the tab full screen on the board and the digits fill the space, so a countdown is readable across the room." },
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
