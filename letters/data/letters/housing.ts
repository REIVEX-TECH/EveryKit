import {
  addDays,
  addMonths,
  addressing,
  clean,
  compact,
  formatDate,
  has,
  paragraph,
  sentence,
  type LetterType,
  type Values,
} from "@/lib/letter/types";

export const landlordRepairRequest: LetterType = {
  slug: "landlord-repair-request",
  title: "Repair request to a landlord",
  whoItsFor: "Something in your rented home needs fixing and you need it in writing",
  seoNotes: [
    "Putting a repair in writing starts a clock. Verbal reports get denied later; a dated letter is the thing you point at if the matter reaches a council, a deposit scheme or a tribunal.",
    "Say what is broken, when it started, whether you have reported it before, and when you can give access. Vagueness is what lets a repair sit in someone's pile.",
  ],
  fields: [
    { id: "tenantName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "propertyAddress", label: "The rented address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "landlordName", label: "Landlord or agent's name", type: "text", group: "About you", help: "Leave blank and the letter opens with Dear Sir or Madam." },
    { id: "landlordBlock", label: "Their address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "issue", label: "What needs repairing", type: "text", required: true, group: "The problem", placeholder: "the boiler" },
    { id: "detail", label: "What exactly is wrong", type: "textarea", required: true, rows: 4, group: "The problem", help: "What it does, what you have tried, and how it affects living there." },
    { id: "since", label: "When it started", type: "date", required: true, group: "The problem" },
    { id: "severity", label: "How bad is it", type: "select", required: true, group: "The problem", options: [
      { value: "urgent", label: "Urgent: no heating, water or power, or a safety risk" },
      { value: "significant", label: "Significant: it affects daily living" },
      { value: "minor", label: "Minor: it should be fixed but can wait" },
    ] },
    { id: "reportedBefore", label: "I have reported this before", type: "checkbox", group: "The problem" },
    { id: "reportDetail", label: "When and how you reported it", type: "textarea", rows: 2, group: "The problem", help: "Dates and who you told. This is the part that matters if it escalates." },
    { id: "access", label: "When you can give access", type: "text", group: "What happens next", placeholder: "weekdays after 4pm, or any time at weekends" },
    { id: "deadlineDays", label: "Days you are giving them", type: "number", group: "What happens next", placeholder: "14" },
    { id: "escalation", label: "What you will do if nothing happens", type: "text", group: "What happens next", placeholder: "contact the council's environmental health team", help: "Only used in the firm version. Name a step you would actually take." },
  ],
  toneVariants: ["polite", "firm"],
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.landlordName);
    const firm = ctx.tone === "firm";
    const since = formatDate(v.since, ctx.dateFormat);
    const days = Number(clean(v.deadlineDays));
    const deadline = Number.isFinite(days) && days > 0 ? addDays(ctx.today, days) : "";
    const reported = clean(v.reportedBefore) === "true";
    const firstLine = clean(v.propertyAddress).split("\n")[0] ?? "";

    const urgency = {
      urgent: firm
        ? "This is not a cosmetic problem. It leaves the property without something a home is required to have."
        : "It is making the place difficult to live in properly.",
      significant: firm
        ? "It affects the use of the property every day, and has done since the date above."
        : "It is affecting day-to-day life here.",
      minor: firm
        ? "It is not an emergency, but it has been outstanding long enough to put in writing."
        : "I know it is not urgent, and I would rather raise it before it becomes so.",
    }[clean(v.severity)] ?? "";

    return {
      sender: compact([clean(v.tenantName), ...clean(v.propertyAddress).split("\n")]),
      recipient: compact(clean(v.landlordBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Repair required at ${firstLine}: ${clean(v.issue)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(`${capitalise(clean(v.issue))} at the property needs repair`),
          sentence(`The problem began on ${since}`),
          sentence(urgency),
        ),
        paragraph(sentence(clean(v.detail))),
        reported
          ? firm
            ? paragraph(
                sentence("This has already been reported"),
                has(v.reportDetail) && sentence(clean(v.reportDetail)),
                sentence("No repair has been carried out and I have had no date for one"),
              )
            : paragraph(
                sentence("I did mention this previously"),
                has(v.reportDetail) && sentence(clean(v.reportDetail)),
              )
          : "",
        firm
          ? paragraph(
              deadline !== ""
                ? sentence(
                    `Please arrange the repair, or give me a date for it, by ${formatDate(deadline, ctx.dateFormat)}`,
                  )
                : sentence("Please arrange the repair, or give me a date for it"),
              has(v.access) && sentence(`Access is available ${clean(v.access)}`),
              has(v.escalation) &&
                sentence(`If I have had no response by then I will ${clean(v.escalation)}`),
            )
          : paragraph(
              deadline !== ""
                ? sentence(
                    `Could someone look at it, or let me know a date, by ${formatDate(deadline, ctx.dateFormat)}`,
                  )
                : sentence("Could someone come and look at it"),
              has(v.access) && sentence(`I can give access ${clean(v.access)}`),
            ),
        firm
          ? sentence("I am keeping a record of this correspondence")
          : sentence("Thank you for arranging it"),
      ]),
      valediction,
      signOff: compact([clean(v.tenantName)]),
    };
  },
  faq: [
    { q: "Why put a repair request in writing?", a: "Because a verbal report leaves no trace. If the repair drags on and you end up at a council, a deposit scheme or a tribunal, the first question asked is when you reported it, and a dated letter answers it." },
    { q: "How long does a landlord have to fix something?", a: "It varies by country and by how serious the fault is. Genuine emergencies, meaning no heat, no water, no power or anything unsafe, are measured in days. Set a date in the letter rather than leaving it open." },
    { q: "Can I withhold rent until it is fixed?", a: "Usually a bad idea. In many places it puts you in breach and at risk of eviction even when the landlord is in the wrong. Take advice before withholding anything." },
    { q: "What if they still do nothing?", a: "Escalate to whoever regulates housing where you live, often a council's environmental health team. Name that step in the letter only if you intend to take it." },
    { q: "Email or post?", a: "Email is fine and timestamps itself. For anything serious, post a copy as well with proof of delivery." },
  ],
  example: {
    tenantName: "Marcus Feld",
    propertyAddress: "Flat 3, 88 Cranmer Street\nNottingham NG3 4GH",
    landlordName: "Ms Denise Hart",
    landlordBlock: "Hartwell Property Management\n12 Maid Marian Way\nNottingham NG1 6HS",
    issue: "the boiler",
    detail: "The boiler fires briefly and then cuts out, showing a lockout code. It has to be reset to get any hot water at all, and it will not hold the heating on for more than about ten minutes. There has been no hot water in the mornings for the past fortnight.",
    since: "2026-07-28",
    severity: "urgent",
    reportedBefore: "true",
    reportDetail: "I called the office on 29 July and spoke to Dan, then emailed the maintenance address on 5 August. An engineer was mentioned but no appointment was ever made.",
    access: "weekdays after 4pm, or any time at weekends",
    deadlineDays: "14",
    escalation: "contact the council's environmental health team",
  },
};

const NOTICE_PERIODS = [
  { value: "2w", label: "Two weeks" },
  { value: "1m", label: "One month" },
  { value: "2m", label: "Two months" },
  { value: "custom", label: "A date I will set myself" },
];

/** The move-out date, worked out so it matches the tenancy agreement. */
export function tenancyEndDate(values: Values): string {
  const from = clean(values.noticeDate);
  const period = clean(values.noticePeriod);
  if (period === "custom") return clean(values.customEndDate);
  if (from === "") return "";
  if (period === "2w") return addDays(from, 14);
  if (period === "1m") return addMonths(from, 1);
  if (period === "2m") return addMonths(from, 2);
  return "";
}

export const noticeToVacate: LetterType = {
  slug: "notice-to-vacate",
  title: "Notice to vacate",
  whoItsFor: "You are a tenant ending your tenancy",
  seoNotes: [
    "Notice has to be in writing, has to name the day you are leaving, and has to give the period your agreement requires. Get any of those wrong and the notice may not count, which can leave you owing another month's rent.",
    "Work the date from your agreement rather than from the end of the calendar month, unless the agreement says otherwise.",
  ],
  fields: [
    { id: "tenantName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "propertyAddress", label: "The rented address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "landlordName", label: "Landlord or agent's name", type: "text", group: "About you" },
    { id: "landlordBlock", label: "Their address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "noticeDate", label: "Date you are giving notice", type: "date", required: true, group: "Notice" },
    { id: "noticePeriod", label: "Notice period in your agreement", type: "select", required: true, group: "Notice", options: NOTICE_PERIODS, help: "Your last day is worked out from this." },
    { id: "customEndDate", label: "Your last day in the property", type: "date", group: "Notice", help: "Only needed if you chose to set the date yourself." },
    { id: "reason", label: "Reason, if you want to give one", type: "text", group: "Notice", placeholder: "I am moving for work", help: "Optional. You do not have to give one." },
    { id: "forwardingAddress", label: "Where to send your deposit", type: "textarea", rows: 3, group: "Deposit and handover" },
    { id: "depositScheme", label: "Deposit scheme and reference", type: "text", group: "Deposit and handover", placeholder: "Deposit Protection Service, reference 44821990" },
    { id: "inspection", label: "When you can do the check-out inspection", type: "text", group: "Deposit and handover", placeholder: "the morning of the last day, or the day after" },
    { id: "deadlineDays", label: "Days for the deposit to be returned", type: "number", group: "Deposit and handover", placeholder: "14", help: "Only used in the firm version." },
  ],
  toneVariants: ["polite", "firm"],
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.landlordName);
    const firm = ctx.tone === "firm";
    const endDate = tenancyEndDate(v);
    const days = Number(clean(v.deadlineDays));
    const depositBy =
      Number.isFinite(days) && days > 0 && endDate !== "" ? addDays(endDate, days) : "";
    const addressInline = clean(v.propertyAddress).split("\n").join(", ");
    const firstLine = clean(v.propertyAddress).split("\n")[0] ?? "";

    return {
      sender: compact([clean(v.tenantName), ...clean(v.propertyAddress).split("\n")]),
      recipient: compact(clean(v.landlordBlock).split("\n")),
      date: formatDate(clean(v.noticeDate) || ctx.today, ctx.dateFormat),
      subject: `Notice to end tenancy at ${firstLine}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `This is formal notice that I will be ending my tenancy at ${addressInline}`,
            has(v.reason) && `, as ${clean(v.reason)}`,
          ),
          endDate !== ""
            ? sentence(`My last day in the property will be ${formatDate(endDate, ctx.dateFormat)}`)
            : "",
        ),
        firm
          ? paragraph(
              sentence(
                "The property will be returned cleaned and cleared, and I will take dated photographs of its condition on the day I leave",
              ),
              has(v.inspection) &&
                sentence(`I am available for the check-out inspection ${clean(v.inspection)}`),
            )
          : paragraph(
              sentence("I will leave the property clean and clear of my things"),
              has(v.inspection) &&
                sentence(`I can be there for the check-out inspection ${clean(v.inspection)}`),
            ),
        firm
          ? paragraph(
              has(v.depositScheme) &&
                sentence(`The deposit is held with ${clean(v.depositScheme)}`),
              depositBy !== ""
                ? sentence(
                    `Please return it in full by ${formatDate(depositBy, ctx.dateFormat)}, or set out in writing what you propose to deduct and why`,
                  )
                : sentence(
                    "Please return it in full, or set out in writing what you propose to deduct and why",
                  ),
              has(v.forwardingAddress) &&
                sentence(
                  `My forwarding address is ${clean(v.forwardingAddress).split("\n").join(", ")}`,
                ),
            )
          : paragraph(
              has(v.depositScheme) &&
                sentence(`The deposit is held with ${clean(v.depositScheme)}`),
              sentence("Could you let me know what you need from me to release it"),
              has(v.forwardingAddress) &&
                sentence(
                  `It can be sent to ${clean(v.forwardingAddress).split("\n").join(", ")}`,
                ),
            ),
        firm
          ? sentence("Please confirm in writing that you have received this notice")
          : sentence("Please confirm you have received this"),
      ]),
      valediction,
      signOff: compact([clean(v.tenantName)]),
    };
  },
  faq: [
    { q: "How much notice do I have to give?", a: "Whatever your tenancy agreement says, commonly one month on a rolling monthly tenancy. Some agreements require notice to line up with a rent date, so read the clause before picking a date." },
    { q: "Does notice have to be in writing?", a: "Almost always, and it is a bad idea even where it is not. A written notice naming a date is what prevents an argument about whether you gave it." },
    { q: "Do I have to say why I am leaving?", a: "No. A reason is optional and makes no difference to whether the notice is valid." },
    { q: "When should I get my deposit back?", a: "It depends where you live; ten to thirty days after the tenancy ends is typical where a scheme holds it. Ask in the letter and give a date, so silence becomes visible." },
    { q: "What if my landlord disputes the condition of the property?", a: "Dated photographs taken on the day you hand the keys back settle most of these. Take them whether or not you expect a dispute." },
  ],
  example: {
    tenantName: "Aisha Rahman",
    propertyAddress: "Flat 12, Wharf House\n4 Canal Street\nManchester M1 3HE",
    landlordName: "Mr Peter Ncube",
    landlordBlock: "Northside Lettings\n210 Deansgate\nManchester M3 3NW",
    noticeDate: "2026-08-18",
    noticePeriod: "1m",
    customEndDate: "",
    reason: "I am moving for work",
    forwardingAddress: "27 Beechwood Avenue\nLeeds LS8 2QA",
    depositScheme: "Deposit Protection Service, reference 44821990",
    inspection: "the morning of the last day, or any time the day after",
    deadlineDays: "14",
  },
};

function capitalise(text: string): string {
  return text === "" ? "" : text.charAt(0).toUpperCase() + text.slice(1);
}

export const housingLetters = [landlordRepairRequest, noticeToVacate];
