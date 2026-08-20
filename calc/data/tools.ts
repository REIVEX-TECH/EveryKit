/**
 * The five everyday calculators. One entry per route, and the single source for
 * the launcher on the home page, the tool switcher and every SEO page.
 */

export type ToolSlug = "age" | "date-difference" | "units" | "emi" | "percentage";

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
  a: "No. Every calculator here runs in the page itself. There is no server that receives your date of birth, your loan or anything else, and you can check it in your browser's network tab: using a tool produces no request carrying what you typed.",
};

export const tools: Tool[] = [
  {
    slug: "age",
    title: "Age calculator",
    blurb: "Years, months and days, exactly",
    seoTitle: "Age calculator, exact years months and days, with the next birthday",
    description:
      "Work out an exact age in years, months and days from a date of birth, plus the countdown to the next birthday. Computed in your browser, the date is never stored.",
    intro: [
      "A date of birth in, an exact age out, plus how long until the next birthday.",
      "The date is worked with in this page and is not sent anywhere or stored.",
    ],
    faq: [
      PRIVACY,
      {
        q: "How is the age counted?",
        a: "By walking the calendar rather than dividing by 365.25. Whole months are counted from the last monthly anniversary that has actually passed, and the days from there. That is what makes the number agree with a birthday rather than with a spreadsheet.",
      },
      {
        q: "What happens with a 29 February birthday?",
        a: "In a year that does not have one, the birthday is counted on 1 March. That is the convention most places use and it is a choice rather than a fact: some count 28 February instead. The tool says which it is doing whenever it applies.",
      },
      {
        q: "Why does it say the age turns over on the day itself?",
        a: "Because it does. Somebody born on 21 August is 25 up to and including 20 August, and 26 on the 21st. Any tool that turns the age over a day early or late is dividing rather than counting.",
      },
    ],
  },
  {
    slug: "date-difference",
    title: "Date difference",
    blurb: "Days, weeks and months between two dates",
    seoTitle: "Date difference calculator, days weeks and months, with an end date switch",
    description:
      "Count the days, weeks and months between two dates, with a visible choice of whether the end date counts. Runs in your browser.",
    intro: [
      "Two dates, and the gap between them in days, weeks and whole months.",
      "Whether the end date counts is a switch you can see, because it is two different questions and each answer is wrong for the other.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Should I count the end date?",
        a: "It depends which question you are asking. The 1st to the 5th is four days apart, and it is five days if you are counting the days you have, including both ends. Holiday allowance and notice periods usually mean the second; a gap between two events usually means the first.",
      },
      {
        q: "How are whole months counted?",
        a: "As months that have completed. 15 January to 14 August is six months, and one day later it is seven. Months are not all the same length, so counting completed ones is the only way the answer stays true across a year.",
      },
      {
        q: "Does the time of day matter?",
        a: "No. Everything here is whole calendar days, so a date is a date regardless of the hour, and a daylight saving change cannot knock the count off by one.",
      },
    ],
  },
  {
    slug: "units",
    title: "Unit converter",
    blurb: "Length, weight, temperature and area",
    seoTitle: "Unit converter, length weight temperature and area, exact factors",
    description:
      "Convert length, weight, temperature and area in your browser, using the exact international definitions and a precision that does not invent digits.",
    intro: [
      "Four categories, kept separate so the tool never offers to convert kilograms into miles.",
      "The factors are the exact definitions rather than rounded measurements.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Why is temperature handled differently?",
        a: "Because it is not a ratio. Celsius, Fahrenheit and Kelvin start in different places, so 20 degrees is not twice 10 in any of them. Converting temperature by multiplying is the single most common bug in a converter, and it gets a separate path here.",
      },
      {
        q: "How exact are the factors?",
        a: "Exact. An inch is defined as 25.4 mm and a pound as 0.45359237 kg by international agreement, so those digits are definitions rather than measurements. Answers are capped at six significant figures, because printing 2.5400000000000005 says something true about floating point and nothing about your measurement.",
      },
      {
        q: "Why are marla and kanal in the area list?",
        a: "Because property in Pakistan and northern India is measured in them and most converters leave them out. The values used are the standard ones: a marla is about 25.29 square metres and a kanal is twenty marla. Regional variants exist, so check against a local deed if it matters.",
      },
    ],
  },
  {
    slug: "emi",
    title: "Loan calculator",
    blurb: "Monthly payment, interest and schedule",
    seoTitle: "Loan and EMI calculator, monthly payment with a full schedule",
    description:
      "Work out a monthly loan instalment, the total interest, and the full repayment schedule. Runs in your browser. Estimates for planning, not financial advice.",
    intro: [
      "An amount, a rate and a term. The monthly payment, the total interest, and where each payment goes.",
      "The schedule is the useful part: it shows how little of an early payment touches what you borrowed.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Which formula is this?",
        a: "The standard annuity one, the same as a bank's EMI: the payment that clears the loan in equal instalments over the term. At a rate of zero the formula divides by zero, so that case is handled separately rather than by nudging the rate slightly above zero, which some calculators do.",
      },
      {
        q: "Why does the last payment differ slightly?",
        a: "Because the monthly payment is rounded to whole cents and 240 rounded payments do not add up to the loan exactly. The final instalment settles whatever is actually left, which is what a bank does, and it is why the schedule here ends at zero rather than at a few cents either way.",
      },
      {
        q: "Will my bank quote this number?",
        a: "Close, and not exactly. Fees, insurance, a different day count convention and any rate that is not fixed will all move it. Treat this as a planning figure and the offer document as the real one.",
      },
      {
        q: "Is this financial advice?",
        a: "No. It is arithmetic. Whether a loan is a good idea is a question about your circumstances, and nothing here knows any of them.",
      },
    ],
  },
  {
    slug: "percentage",
    title: "Percentage calculator",
    blurb: "The three questions people actually ask",
    seoTitle: "Percentage calculator, percent of, what percent, and percent change",
    description:
      "Three percentage calculations in one page: X percent of Y, X is what percent of Y, and percent change from X to Y. Runs in your browser.",
    intro: [
      "Three different sums that all get searched for as one thing, each with its own words.",
      "Knowing which of the three you want is the hard part; the arithmetic is not.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Why is a rise of 25 percent not cancelled by a fall of 25 percent?",
        a: "Because a change is always measured against where it started. 40 rising to 50 is a 25 percent increase, and 50 falling back to 40 is a 20 percent decrease, not 25. The tool says so whenever the two directions disagree, because it is the most common percentage mistake there is.",
      },
      {
        q: "Which block do I want?",
        a: "The first for a discount or a tip: 15 percent of 200. The second for a score or a share: 30 out of 200 is what percent. The third for a rise or a fall over time: from 40 to 50.",
      },
      {
        q: "Why does a change from zero not work?",
        a: "Because there is no percentage that describes it. Any increase from nothing is infinite in percentage terms, so rather than print something meaningless the tool says the starting number has to be something other than zero.",
      },
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
