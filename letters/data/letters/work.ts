import {
  addDays,
  addMonths,
  addressing,
  clean,
  compact,
  formatDate,
  has,
  list,
  paragraph,
  sentence,
  type LetterType,
  type Values,
} from "@/lib/letter/types";

/**
 * Lower the first letter of a fragment being dropped mid-sentence, so a field
 * answered with a capitalised line does not read as "state My job title".
 * Left alone when the word looks like a name or an acronym.
 */
function lowerFirst(text: string): string {
  if (text === "") return "";
  const firstWord = text.split(/\s/)[0];
  if (firstWord.length > 1 && firstWord === firstWord.toUpperCase()) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export const employmentVerificationRequest: LetterType = {
  slug: "employment-verification-request",
  title: "Employment verification letter request",
  whoItsFor: "You need HR to confirm your job in writing",
  seoNotes: [
    "Banks, landlords and consulates ask for proof of employment on company letterhead. This is the letter you send to HR to get one, and being specific about what the letter must contain saves a second round of emails.",
    "Ask for what the recipient needs, not for a generic reference. A mortgage lender and a visa office want different facts.",
  ],
  fields: [
    { id: "employeeName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "employeeAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "jobTitle", label: "Your job title", type: "text", required: true, group: "About you" },
    { id: "employeeId", label: "Employee or payroll number", type: "text", group: "About you" },
    { id: "startDate", label: "The date you started", type: "date", group: "About you" },
    { id: "hrName", label: "Who you are asking", type: "text", group: "The request", placeholder: "Ms Farida Khan", help: "A name if you have one. Leave blank and it opens \"Dear Sir or Madam\"." },
    { id: "companyBlock", label: "Company name and address", type: "textarea", required: true, rows: 3, group: "The request" },
    { id: "neededFor", label: "What you need it for", type: "text", required: true, group: "The request", placeholder: "a rental application", help: "HR writes a better letter when they know who is reading it." },
    { id: "mustInclude", label: "What the letter must state", type: "textarea", required: true, rows: 4, group: "The request", help: "One item per line. Salary, start date, contract type, or whatever the recipient asked for." },
    { id: "deadline", label: "When you need it by", type: "date", group: "The request" },
    { id: "addressedTo", label: "Who it should be addressed to", type: "text", group: "The request", placeholder: "Brightwater Lettings" },
    { id: "collection", label: "How you would like it", type: "select", group: "The request", options: [
      { value: "email", label: "By email" },
      { value: "collect", label: "On letterhead, to collect" },
      { value: "post", label: "On letterhead, posted to me" },
    ] },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.hrName);
    const items = compact(clean(v.mustInclude).split("\n"));
    const delivery = {
      email: "A PDF by email is fine.",
      collect: "If it can be printed on company letterhead, I will collect it from the office.",
      post: "If it can be printed on company letterhead, I would be grateful if it could be posted to my address above.",
    }[clean(v.collection)] ?? "";

    return {
      sender: compact([clean(v.employeeName), ...clean(v.employeeAddress).split("\n")]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Request for an employment verification letter, for ${clean(v.employeeName)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `Would it be possible to have a letter confirming my employment, for ${clean(v.neededFor)}`,
          ),
          sentence(
            `I work as ${clean(v.jobTitle)}`,
            has(v.employeeId) && `, employee number ${clean(v.employeeId)}`,
            has(v.startDate) && `, and joined on ${formatDate(v.startDate, ctx.dateFormat)}`,
          ),
        ),
        items.length > 0 &&
          paragraph(
            sentence(
              has(v.addressedTo)
                ? `It needs to be addressed to ${clean(v.addressedTo)} and to state ${lowerFirst(list(items))}`
                : `It needs to state ${lowerFirst(list(items))}`,
            ),
          ),
        has(v.deadline) &&
          sentence(`I need it by ${formatDate(v.deadline, ctx.dateFormat)}`),
        sentence(delivery),
        sentence("Thank you for arranging this"),
      ]),
      valediction,
      signOff: compact([clean(v.employeeName), clean(v.jobTitle)]),
    };
  },
  faq: [
    { q: "What should an employment verification letter contain?", a: "Whatever the party asking for it needs. Commonly your job title, start date, contract type and salary, on company letterhead with a signature and a contact number. Ask for those specifics rather than for a letter in general." },
    { q: "Can HR refuse to state my salary?", a: "Some employers have a policy of confirming only dates and job title. If salary is required, say so in the request so HR can escalate it rather than sending a letter that gets rejected." },
    { q: "How long does it usually take?", a: "A few working days at most companies. Give a date you need it by, and ask early if it is for a visa appointment." },
    { q: "Should the letter be addressed to a specific organisation?", a: "Yes where you know it. A letter addressed to the lender or consulate reads as genuine; \"To whom it may concern\" is accepted but weaker." },
  ],
  example: {
    employeeName: "Daniel Osei",
    employeeAddress: "14 Ridge Road\nAccra\nGhana",
    jobTitle: "Logistics Coordinator",
    employeeId: "GH-2291",
    startDate: "2021-03-15",
    hrName: "Ms Adjoa Mensah",
    companyBlock: "Human Resources\nTrans-Sahel Freight Ltd\n5 Harbour Way, Tema",
    neededFor: "a mortgage application",
    mustInclude: "My job title and department\nMy start date and that my contract is permanent\nMy gross annual salary\nA contact number for verification",
    deadline: "2026-09-08",
    addressedTo: "Kestrel Building Society",
    collection: "email",
  },
};

export const nocRequest: LetterType = {
  slug: "noc-request",
  title: "No-objection certificate request",
  whoItsFor: "You need your employer to say they do not object, for a visa, travel or outside work",
  seoNotes: [
    "A no-objection certificate is a short letter from your employer confirming they know what you are doing and have no objection to it. Visa offices across South Asia and the Gulf ask for one, and so do many employers before approving outside work.",
    "This is the request you send to get it. The certificate itself is written by your employer, on their letterhead.",
  ],
  fields: [
    { id: "employeeName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "jobTitle", label: "Your job title", type: "text", required: true, group: "About you" },
    { id: "employeeId", label: "Employee number", type: "text", group: "About you" },
    { id: "department", label: "Your department", type: "text", group: "About you" },
    { id: "managerName", label: "Who you are asking", type: "text", group: "The request", help: "Your manager or HR contact, if you have a name." },
    { id: "companyBlock", label: "Company name and address", type: "textarea", required: true, rows: 3, group: "The request" },
    { id: "reason", label: "What the certificate is for", type: "select", required: true, group: "The request", options: [
      { value: "visa", label: "A visa application" },
      { value: "travel", label: "Travel during my leave" },
      { value: "outside-work", label: "Work outside the company" },
      { value: "study", label: "A course or qualification" },
    ] },
    { id: "detail", label: "The specifics", type: "textarea", required: true, rows: 3, group: "The request", placeholder: "A ten-day trip to Türkiye with my family", help: "Where, when, and anything the certificate should name." },
    { id: "leaveFrom", label: "Leave starts", type: "date", group: "The request" },
    { id: "leaveTo", label: "Leave ends", type: "date", group: "The request" },
    { id: "leaveApproved", label: "My leave is already approved", type: "checkbox", group: "The request" },
    { id: "addressedTo", label: "Who the certificate should be addressed to", type: "text", group: "The request", placeholder: "The Consulate General of Türkiye, Karachi" },
    { id: "deadline", label: "When you need it by", type: "date", group: "The request" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.managerName);
    const purpose = {
      visa: "a visa application",
      travel: "travel during my approved leave",
      "outside-work": "work I would like to take on outside the company",
      study: "a course I would like to enrol on",
    }[clean(v.reason)] ?? "";

    const leave =
      has(v.leaveFrom) && has(v.leaveTo)
        ? `${formatDate(v.leaveFrom, ctx.dateFormat)} to ${formatDate(v.leaveTo, ctx.dateFormat)}`
        : "";

    return {
      sender: compact([clean(v.employeeName), clean(v.jobTitle), clean(v.department)]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Request for a no-objection certificate, for ${clean(v.employeeName)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(`I would like to request a no-objection certificate for ${purpose}`),
          sentence(clean(v.detail)),
        ),
        paragraph(
          leave !== "" &&
            sentence(
              `The dates concerned are ${leave}`,
              clean(v.leaveApproved) === "true"
                ? ", and my leave for that period has already been approved"
                : "",
            ),
          leave === "" && clean(v.leaveApproved) === "true"
            ? sentence("My leave for this has already been approved")
            : "",
        ),
        paragraph(
          sentence(
            has(v.addressedTo)
              ? `The certificate should be addressed to ${clean(v.addressedTo)} and confirm my position, my length of service, and that the company has no objection`
              : `The certificate should confirm my position, my length of service, and that the company has no objection`,
          ),
          sentence("On company letterhead, signed and stamped, is what is usually expected"),
        ),
        has(v.deadline) &&
          sentence(`I need it by ${formatDate(v.deadline, ctx.dateFormat)} if that is workable`),
        sentence(
          "My duties will be covered as normal and I am happy to answer anything before you issue it",
        ),
      ]),
      valediction,
      signOff: compact([
        clean(v.employeeName),
        clean(v.jobTitle),
        has(v.employeeId) && `Employee number ${clean(v.employeeId)}`,
      ]),
    };
  },
  faq: [
    { q: "What is a no-objection certificate?", a: "A short letter from your employer stating that they are aware of what you are doing, whether travelling, applying for a visa or taking outside work, and do not object. It is not a legal document, but many consulates and employers treat it as required." },
    { q: "Who writes it, me or my employer?", a: "Your employer writes and signs it on their letterhead. You write the request, which is what this generates." },
    { q: "Does it need a company stamp?", a: "Most consulates that ask for one expect letterhead, a signature and a company stamp. Ask for all three so it does not come back." },
    { q: "Will an NOC guarantee my visa?", a: "No. It answers one question, whether your employer knows and objects, and nothing more." },
    { q: "Do I need one if I am self-employed?", a: "No. You would instead provide your business registration and tax filings, since there is no employer to object." },
  ],
  example: {
    employeeName: "Farhan Siddiqui",
    jobTitle: "Quality Assurance Engineer",
    employeeId: "PK-4417",
    department: "Manufacturing",
    managerName: "Mr Imran Baig",
    companyBlock: "Human Resources\nIndus Precision Industries\nKorangi Industrial Area, Karachi",
    reason: "visa",
    detail: "I am applying for a short-stay visa to Türkiye for a ten-day holiday with my wife and daughter, and the consulate requires a no-objection certificate from my employer.",
    leaveFrom: "2026-10-12",
    leaveTo: "2026-10-22",
    leaveApproved: "true",
    addressedTo: "The Consulate General of Türkiye, Karachi",
    deadline: "2026-09-20",
  },
};

const NOTICE_OPTIONS = [
  { value: "2w", label: "Two weeks" },
  { value: "1m", label: "One month" },
  { value: "2m", label: "Two months" },
  { value: "3m", label: "Three months" },
  { value: "custom", label: "A date I will set myself" },
];

/** The whole point of the notice field: nobody should have to count this out. */
export function lastWorkingDay(values: Values): string {
  const from = clean(values.noticeDate);
  const period = clean(values.noticePeriod);
  if (period === "custom") return clean(values.customLastDay);
  if (from === "") return "";
  switch (period) {
    case "2w":
      return addDays(from, 14);
    case "1m":
      return addMonths(from, 1);
    case "2m":
      return addMonths(from, 2);
    case "3m":
      return addMonths(from, 3);
    default:
      return "";
  }
}

export const resignation: LetterType = {
  slug: "resignation",
  title: "Resignation letter",
  whoItsFor: "You are leaving a job and need to put it in writing",
  seoNotes: [
    "A resignation letter does three things: states that you are leaving, gives the date of your last working day, and keeps the relationship intact. It is not the place to explain everything that went wrong.",
    "Your last working day is set by your notice period, counted from the day you hand the letter in. This tool works it out from the two so the date in the letter matches the date in your contract.",
  ],
  fields: [
    { id: "employeeName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "jobTitle", label: "Your job title", type: "text", required: true, group: "About you" },
    { id: "department", label: "Your team or department", type: "text", group: "About you" },
    { id: "managerName", label: "Who you are addressing it to", type: "text", group: "About you", help: "Normally your line manager." },
    { id: "companyBlock", label: "Company name and address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "noticeDate", label: "Date you are giving notice", type: "date", required: true, group: "Notice" },
    { id: "noticePeriod", label: "Your notice period", type: "select", required: true, group: "Notice", options: NOTICE_OPTIONS, help: "Taken from your contract. The last working day is worked out from this." },
    { id: "customLastDay", label: "Your last working day", type: "date", group: "Notice", help: "Only needed if you chose to set the date yourself." },
    { id: "reason", label: "Reason, if you want to give one", type: "text", group: "What to say", placeholder: "to take up a role closer to home", help: "Optional, and short is better. You are not obliged to give one." },
    { id: "thanks", label: "Something you are taking with you", type: "textarea", rows: 2, group: "What to say", help: "Optional. One specific thing beats a paragraph of general gratitude." },
    { id: "handover", label: "What you will hand over", type: "textarea", rows: 2, group: "What to say", help: "Optional. Naming it makes the letter land better." },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.managerName);
    const lastDay = lastWorkingDay(v);

    return {
      sender: compact([clean(v.employeeName), clean(v.jobTitle), clean(v.department)]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(clean(v.noticeDate) || ctx.today, ctx.dateFormat),
      subject: `Resignation: ${clean(v.employeeName)}, ${clean(v.jobTitle)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `Please accept this letter as notice of my resignation from the position of ${clean(v.jobTitle)}`,
            has(v.reason) && `, ${clean(v.reason)}`,
          ),
          lastDay !== ""
            ? sentence(`My last working day will be ${formatDate(lastDay, ctx.dateFormat)}`)
            : "",
        ),
        has(v.thanks) && paragraph(sentence(clean(v.thanks))),
        has(v.handover)
          ? paragraph(
              sentence(clean(v.handover)),
              sentence("I will make sure everything is in a state someone can pick up"),
            )
          : paragraph(
              sentence(
                "I will do what I can over the notice period to hand my work over cleanly",
              ),
            ),
        sentence("Thank you for the time here"),
      ]),
      valediction,
      signOff: compact([clean(v.employeeName)]),
    };
  },
  faq: [
    { q: "How do I work out my last working day?", a: "Count your contractual notice period from the day you hand the letter in, not from the end of the month. One month's notice given on 17 August ends on 17 September. This tool does that for you." },
    { q: "Do I have to give a reason for leaving?", a: "No. A resignation is valid without one. A short reason keeps things warm; a long one invites a conversation you may not want in writing." },
    { q: "Should I mention what went wrong?", a: "Not here. A resignation letter goes on your file and may be read by people who were not involved. Raise problems separately, in an exit interview or a written grievance." },
    { q: "Email or printed?", a: "Send it by email so the date is recorded, and offer a signed copy. Some employers require a signed original, so check your contract." },
    { q: "Can I leave sooner than my notice period?", a: "Only by agreement. Ask separately rather than announcing a shorter date in the letter, which reads as a decision rather than a request." },
  ],
  example: {
    employeeName: "Priya Raghavan",
    jobTitle: "Senior Data Analyst",
    department: "Commercial Insight",
    managerName: "Mr Tom Whitfield",
    companyBlock: "Northgate Retail Group\n1 Cathedral Square\nLeeds LS1 4DL",
    noticeDate: "2026-08-18",
    noticePeriod: "1m",
    customLastDay: "",
    reason: "to take up a role closer to my family",
    thanks: "The forecasting work we rebuilt last winter is the piece of work I am proudest of, and I learned most of it from this team.",
    handover: "I will finish the quarterly margin model and write up the pipeline so it can be run without me.",
  },
};

export const workLetters = [employmentVerificationRequest, nocRequest, resignation];
