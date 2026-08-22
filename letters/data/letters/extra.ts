import {
  addDays,
  addressing,
  clean,
  compact,
  formatDate,
  has,
  list,
  paragraph,
  sentence,
  type LetterType,
} from "@/lib/letter/types";

/**
 * Seven more high-demand letters on the same field-driven engine.
 *
 * Grouped here rather than scattered across the subject files only because they
 * were added together; the launcher colours them by subject all the same. Each
 * follows the house rules the tests enforce: optional clauses vanish cleanly
 * when unanswered, the salutation and valediction pair the British way, and a
 * required-fields-only build is still a whole letter.
 */

/** Lower a dropped-in fragment's first letter, unless it is a name or acronym. */
function lowerFirst(text: string): string {
  if (text === "") return "";
  const first = text.split(/\s/)[0];
  if (first.length > 1 && first === first.toUpperCase()) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

const experienceCertificate: LetterType = {
  slug: "experience-certificate",
  title: "Experience certificate request",
  whoItsFor: "You need a past employer to certify your role and dates",
  seoNotes: [
    "An experience certificate confirms what you did and for how long, on company letterhead, and is asked for by employers and consulates. This is the letter you send to a former employer to get one.",
    "Say exactly what the certificate must state and who will read it, so it comes back usable the first time.",
  ],
  fields: [
    { id: "employeeName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "employeeAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "jobTitle", label: "The role you held", type: "text", required: true, group: "About you" },
    { id: "department", label: "Department or team", type: "text", group: "About you" },
    { id: "startDate", label: "Date you started", type: "date", group: "About you" },
    { id: "endDate", label: "Date you left", type: "date", group: "About you" },
    { id: "hrName", label: "Who you are asking", type: "text", group: "The request", placeholder: "Ms Farida Khan", help: "A name if you have one. Leave blank and it opens \"Dear Sir or Madam\"." },
    { id: "companyBlock", label: "Company name and address", type: "textarea", required: true, rows: 3, group: "The request" },
    { id: "neededFor", label: "What you need it for", type: "text", required: true, group: "The request", placeholder: "a job application abroad" },
    { id: "mustInclude", label: "What it must state", type: "textarea", rows: 4, group: "The request", help: "One item per line. Your role, your dates, your main duties, your conduct." },
    { id: "deadline", label: "When you need it by", type: "date", group: "The request" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.hrName);
    const items = compact(clean(v.mustInclude).split("\n"));
    return {
      sender: compact([clean(v.employeeName), ...clean(v.employeeAddress).split("\n")]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Request for an experience certificate, for ${clean(v.employeeName)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(`I am writing to ask for an experience certificate covering my time with you, for ${clean(v.neededFor)}`),
          sentence(
            `I worked as ${clean(v.jobTitle)}`,
            has(v.department) && `in ${clean(v.department)}`,
            has(v.startDate) && has(v.endDate)
              ? `from ${formatDate(v.startDate, ctx.dateFormat)} to ${formatDate(v.endDate, ctx.dateFormat)}`
              : has(v.startDate) && `from ${formatDate(v.startDate, ctx.dateFormat)}`,
          ),
        ),
        items.length > 0 &&
          paragraph(sentence(`It would help if the certificate could state ${lowerFirst(list(items))}`)),
        has(v.deadline) && sentence(`I would be grateful to have it by ${formatDate(v.deadline, ctx.dateFormat)}`),
        sentence("Thank you for your help with this"),
      ]),
      valediction,
      signOff: compact([clean(v.employeeName), clean(v.jobTitle)]),
    };
  },
  faq: [
    { q: "What is an experience certificate?", a: "A letter from a former employer, on their letterhead, confirming the role you held, the dates you were there and often your conduct and main duties. Employers and consulates ask for it as proof of experience." },
    { q: "How is it different from a reference?", a: "A reference is usually an opinion addressed to a specific new employer. An experience certificate states plain facts, is addressed to whom it may concern, and can be reused for several applications." },
    { q: "What should I ask it to state?", a: "Your job title, your dates, and if it helps your case, your department, your main responsibilities and a line on your conduct. List what the party reading it needs." },
    { q: "What if the company has closed?", a: "A certificate needs someone able to sign it. If the company no longer exists, a manager who can confirm your role in a personal capacity, or a payslip and contract, may serve instead. Ask the recipient what they will accept." },
  ],
  example: {
    employeeName: "Priya Nair",
    employeeAddress: "22 Lake View\nKochi 682016\nIndia",
    jobTitle: "Staff Nurse",
    department: "Paediatrics",
    startDate: "2019-06-01",
    endDate: "2024-05-31",
    hrName: "Mr Thomas Varghese",
    companyBlock: "Human Resources\nMarina General Hospital\nMarine Drive, Kochi",
    neededFor: "a nursing post in the United Kingdom",
    mustInclude: "My role and department\nMy start and end dates\nThat I left in good standing\nMy main clinical duties",
    deadline: "2026-09-15",
  },
};

const salaryCertificateRequest: LetterType = {
  slug: "salary-certificate-request",
  title: "Salary certificate request",
  whoItsFor: "A bank or embassy needs your salary confirmed in writing",
  seoNotes: [
    "A salary certificate states your pay on company letterhead, and banks, landlords and consulates ask for it. This is the request you send HR to get one.",
    "Name what the certificate must show and who is asking for it, so the figures match what the reader expects.",
  ],
  fields: [
    { id: "employeeName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "employeeAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "jobTitle", label: "Your job title", type: "text", required: true, group: "About you" },
    { id: "employeeId", label: "Employee or payroll number", type: "text", group: "About you" },
    { id: "hrName", label: "Who you are asking", type: "text", group: "The request", placeholder: "The HR Manager" },
    { id: "companyBlock", label: "Company name and address", type: "textarea", required: true, rows: 3, group: "The request" },
    { id: "neededFor", label: "What you need it for", type: "text", required: true, group: "The request", placeholder: "a car loan application" },
    { id: "addressedTo", label: "Who it should be addressed to", type: "text", group: "The request", placeholder: "Meridian Bank" },
    { id: "mustInclude", label: "What it must show", type: "textarea", rows: 4, group: "The request", help: "One item per line. Gross salary, net salary, allowances, that the job is permanent." },
    { id: "deadline", label: "When you need it by", type: "date", group: "The request" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.hrName);
    const items = compact(clean(v.mustInclude).split("\n"));
    return {
      sender: compact([clean(v.employeeName), ...clean(v.employeeAddress).split("\n")]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Request for a salary certificate, for ${clean(v.employeeName)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(`Please could I have a salary certificate, which I need for ${clean(v.neededFor)}`),
          sentence(
            `I am employed as ${clean(v.jobTitle)}`,
            has(v.employeeId) && `, employee number ${clean(v.employeeId)}`,
          ),
        ),
        items.length > 0 &&
          paragraph(
            sentence(
              has(v.addressedTo)
                ? `It should be addressed to ${clean(v.addressedTo)} and show ${lowerFirst(list(items))}`
                : `It should show ${lowerFirst(list(items))}`,
            ),
          ),
        has(v.deadline) && sentence(`I need it by ${formatDate(v.deadline, ctx.dateFormat)}`),
        sentence("Thank you for arranging this"),
      ]),
      valediction,
      signOff: compact([clean(v.employeeName), clean(v.jobTitle)]),
    };
  },
  faq: [
    { q: "What does a salary certificate show?", a: "Usually your job title, your gross and net salary, any fixed allowances, and that your employment is permanent, on company letterhead with a signature. Ask for the specific figures the reader wants." },
    { q: "Is it the same as a payslip?", a: "No. A payslip is a record of one month's pay; a salary certificate is a signed statement on letterhead confirming your standing pay, which is what a bank or embassy asks for." },
    { q: "Who should it be addressed to?", a: "The organisation asking for it, where you know the name. A certificate addressed to the bank reads as genuine; a generic one is weaker and sometimes refused." },
    { q: "How soon can HR produce it?", a: "Usually within a few working days. Give a date you need it by, especially for a loan or visa deadline." },
  ],
  example: {
    employeeName: "Omar Haddad",
    employeeAddress: "Flat 7, Cedar Tower\nAmman\nJordan",
    jobTitle: "Systems Analyst",
    employeeId: "JO-4471",
    hrName: "The HR Manager",
    companyBlock: "Human Resources\nLevant Software LLC\nKing Abdullah St, Amman",
    neededFor: "a car loan application",
    addressedTo: "Meridian Bank",
    mustInclude: "My gross monthly salary\nMy net monthly salary\nMy housing and transport allowances\nThat my contract is permanent",
    deadline: "2026-09-10",
  },
};

const internshipApplication: LetterType = {
  slug: "internship-application",
  title: "Internship application letter",
  whoItsFor: "You are applying for an internship and need a cover letter",
  seoNotes: [
    "An internship cover letter says which internship you want, why you, and when you are free. It sits on top of a CV and does the job the CV cannot: making the case in your own words.",
    "Be specific about the role and what you would bring. A letter that could be sent to any company reads as one that was.",
  ],
  fields: [
    { id: "applicantName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "applicantAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "study", label: "What you study, and where", type: "text", group: "About you", placeholder: "Second-year Economics, University of Nairobi" },
    { id: "managerName", label: "Who you are writing to", type: "text", group: "The role", placeholder: "Ms Chen" },
    { id: "companyBlock", label: "Company name and address", type: "textarea", required: true, rows: 3, group: "The role" },
    { id: "role", label: "The internship you want", type: "text", required: true, group: "The role", placeholder: "the summer marketing internship" },
    { id: "source", label: "Where you saw it", type: "text", group: "The role", placeholder: "on your careers page" },
    { id: "why", label: "Why this internship, and this company", type: "textarea", required: true, rows: 4, group: "Your case" },
    { id: "bring", label: "What you would bring", type: "textarea", rows: 4, group: "Your case", help: "One point per line. A skill, a project, a relevant course." },
    { id: "availability", label: "When you are available", type: "text", group: "Your case", placeholder: "June to August, full time" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.managerName);
    const strengths = compact(clean(v.bring).split("\n"));
    return {
      sender: compact([clean(v.applicantName), ...clean(v.applicantAddress).split("\n")]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Application for ${clean(v.role)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `I am writing to apply for ${clean(v.role)}`,
            has(v.source) && `, which I saw ${clean(v.source)}`,
          ),
          has(v.study) && sentence(`I am ${lowerFirst(clean(v.study))}`),
        ),
        paragraph(sentence(clean(v.why))),
        strengths.length > 0 &&
          paragraph(sentence(`I would bring ${lowerFirst(list(strengths))}`)),
        has(v.availability) && sentence(`I am available ${lowerFirst(clean(v.availability))}`),
        sentence("I have attached my CV, and I would welcome the chance to talk"),
      ]),
      valediction,
      signOff: compact([clean(v.applicantName)]),
      enclosures: compact(["CV"]),
    };
  },
  faq: [
    { q: "How long should an internship cover letter be?", a: "One page, three or four short paragraphs: the role you want, why you and why them, what you bring, and when you are free. The CV carries the detail." },
    { q: "What if I have no work experience?", a: "Lead with coursework, projects, societies and anything you have organised. An internship is where experience starts; what a reader wants is evidence you will be useful and keen." },
    { q: "Should I name the person?", a: "Where you can find it, yes. A named letter reads as one written for this company. If you cannot, the letter opens \"Dear Sir or Madam\" and closes accordingly." },
    { q: "Do I still send a CV?", a: "Yes. The letter makes the case; the CV lists the facts. This letter says a CV is attached, so attach it." },
  ],
  example: {
    applicantName: "Grace Wanjiru",
    applicantAddress: "48 Ngong Road\nNairobi\nKenya",
    study: "second-year Economics at the University of Nairobi",
    managerName: "Ms Chen",
    companyBlock: "Recruitment\nKestrel Analytics\nWestlands, Nairobi",
    role: "the summer data internship",
    source: "on your careers page",
    why: "Your work using mobile-money data to model small-business credit is exactly the kind of applied economics I want to learn, and I have followed your published case studies through my coursework.",
    bring: "A statistics course with a project in R\nTreasurer of the university economics society\nA data-cleaning project on Nairobi matatu routes",
    availability: "from June to August, full time",
  },
};

const characterReference: LetterType = {
  slug: "character-reference",
  title: "Character reference",
  whoItsFor: "You are vouching for someone: a tenancy, a job, a court",
  seoNotes: [
    "A character reference is your account of someone you know well, for a landlord, an employer or a court. It carries weight because it is specific and because you put your name to it.",
    "Say how you know them and for how long, then give concrete examples rather than adjectives. \"Reliable\" is worth less than an instance of them being reliable.",
  ],
  fields: [
    { id: "refereeName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "refereeAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "refereeRole", label: "Your job or standing", type: "text", group: "About you", placeholder: "Head Teacher, Oakwood School", help: "Optional. It lends weight if it is relevant." },
    { id: "recipientName", label: "Who it is addressed to", type: "text", group: "The reference", placeholder: "The Letting Manager", help: "Leave blank for \"Dear Sir or Madam\"." },
    { id: "recipientBlock", label: "Their name and address", type: "textarea", rows: 3, group: "The reference" },
    { id: "personName", label: "Who you are vouching for", type: "text", required: true, group: "The reference" },
    { id: "purpose", label: "What it is for", type: "text", required: true, group: "The reference", placeholder: "a tenancy application" },
    { id: "knownHow", label: "How you know them, and how long", type: "textarea", required: true, rows: 3, group: "The reference", placeholder: "as her manager for four years" },
    { id: "qualities", label: "What you can say for them", type: "textarea", rows: 4, group: "The reference", help: "One point per line. A concrete example beats an adjective." },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.recipientName);
    const points = compact(clean(v.qualities).split("\n"));
    const person = clean(v.personName);
    return {
      sender: compact([clean(v.refereeName), clean(v.refereeRole), ...clean(v.refereeAddress).split("\n")]),
      recipient: compact(clean(v.recipientBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Character reference for ${person}`,
      salutation,
      body: compact([
        paragraph(
          sentence(`I am writing in support of ${person}, for ${clean(v.purpose)}`),
          sentence(`I have known ${person} ${lowerFirst(clean(v.knownHow))}`),
        ),
        points.length > 0 &&
          paragraph(sentence(`In that time I have found ${person} to be ${lowerFirst(list(points))}`)),
        sentence(`I recommend ${person} without reservation, and am happy to be contacted if it would help`),
      ]),
      valediction,
      signOff: compact([clean(v.refereeName), clean(v.refereeRole)]),
    };
  },
  faq: [
    { q: "What makes a character reference convincing?", a: "Detail and honesty. Say how you know the person and for how long, then give examples rather than a list of adjectives. A specific instance of them being trustworthy is worth more than the word." },
    { q: "Should I give my contact details?", a: "Yes. A reference the reader can verify carries more weight, so the letter offers a way to be contacted and your standing where it is relevant." },
    { q: "Can I write one for a court?", a: "You can, and they are often asked for. Be truthful, do not argue the case itself, and say plainly how you know the person and what you have seen of their character. If in doubt, follow any guidance the court gave." },
    { q: "What should I not do?", a: "Do not exaggerate or vouch for things you have not seen; a reference that overreaches is quick to discount. Stick to what you know first-hand." },
  ],
  example: {
    refereeName: "Margaret Bello",
    refereeAddress: "9 Chapel Lane\nLeeds LS6 2AB",
    refereeRole: "Head Teacher, Oakwood School",
    recipientName: "The Letting Manager",
    recipientBlock: "Brightwater Lettings\n12 Kirkgate\nLeeds LS1 6BY",
    personName: "Daniel Osei",
    purpose: "a tenancy application",
    knownHow: "as a colleague at Oakwood School for six years",
    qualities: "punctual and dependable, never once late with anything entrusted to him\ncalm and considerate with parents and staff alike\ncareful with money, having run the school trip budget without a shortfall",
  },
};

const bankAccountClosure: LetterType = {
  slug: "bank-account-closure",
  title: "Bank account closure letter",
  whoItsFor: "You want to close a bank account in writing",
  seoNotes: [
    "Banks often want a closure in writing, with the balance moved somewhere and statements stopped. This is that instruction, with the details a bank needs to act without a follow-up.",
    "Give the account number, where the balance should go, and a date, so nothing is left to a phone call.",
  ],
  fields: [
    { id: "customerName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "customerAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "accountNumber", label: "The account number", type: "text", required: true, group: "The account", help: "And the sort code or branch code if your bank uses one." },
    { id: "bankBlock", label: "Bank name and branch address", type: "textarea", required: true, rows: 3, group: "The account" },
    { id: "reason", label: "Why you are closing it", type: "text", group: "The account", placeholder: "I am moving to another bank", help: "Optional. A bank does not require a reason." },
    { id: "balanceTo", label: "Where to send the balance", type: "textarea", rows: 3, group: "The account", help: "The account number and name for any remaining money." },
    { id: "closeDate", label: "When to close it", type: "date", group: "The account" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(undefined);
    return {
      sender: compact([clean(v.customerName), ...clean(v.customerAddress).split("\n")]),
      recipient: compact(clean(v.bankBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Closure of account ${clean(v.accountNumber)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `I am writing to ask you to close my account, number ${clean(v.accountNumber)}`,
            has(v.closeDate) && `, with effect from ${formatDate(v.closeDate, ctx.dateFormat)}`,
          ),
          has(v.reason) && sentence(clean(v.reason)),
        ),
        has(v.balanceTo)
          ? paragraph(
              sentence(`Please transfer any remaining balance to the following account`),
              sentence(list(compact(clean(v.balanceTo).split("\n")))),
            )
          : sentence("Please let me know how any remaining balance will be returned to me"),
        paragraph(
          sentence("Please also cancel any cards linked to the account and stop further statements"),
          sentence("I would be grateful for written confirmation once the account is closed"),
        ),
      ]),
      valediction,
      signOff: compact([clean(v.customerName)]),
    };
  },
  faq: [
    { q: "Does a bank need closure in writing?", a: "Many do, or will accept a signed letter alongside their own form. A letter also gives you a dated record that you asked, which matters if a fee or a charge appears afterwards." },
    { q: "What should I include?", a: "The account number, where to send any balance, and a request to cancel cards and stop statements. A date is useful. A reason is not required, though you can give one." },
    { q: "What about direct debits and standing orders?", a: "Move or cancel those before you close the account, or a payment can fail. The bank will not always do it for you, so check what is still set up." },
    { q: "Should I ask for confirmation?", a: "Yes. Ask for written confirmation that the account is closed and the balance settled, so there is no doubt later that it was done." },
  ],
  example: {
    customerName: "Helen Carter",
    customerAddress: "3 Elm Court\nBristol BS1 4TR",
    accountNumber: "40128866, sort code 09-01-27",
    bankBlock: "The Manager\nMeridian Bank\n50 Corn Street, Bristol",
    reason: "I am moving my banking to another provider",
    balanceTo: "Helen Carter\nKestrel Bank, account 88014422, sort code 20-45-11",
    closeDate: "2026-09-30",
  },
};

const complaintEscalation: LetterType = {
  slug: "complaint-escalation",
  title: "Complaint escalation letter",
  whoItsFor: "Your first complaint was ignored and you are taking it further",
  seoNotes: [
    "When a first complaint goes unanswered or is fobbed off, the escalation is what moves it. It references the original, states plainly that it was not resolved, and sets a deadline and a next step.",
    "Keep the facts and dates tight, and name what you will do next. A specific consequence is what gets an escalation read.",
  ],
  fields: [
    { id: "senderName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "senderAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "accountRef", label: "Your account or reference number", type: "text", group: "About you" },
    { id: "recipientName", label: "Who you are writing to", type: "text", group: "The complaint", placeholder: "The Customer Relations Manager" },
    { id: "companyBlock", label: "Company name and address", type: "textarea", required: true, rows: 3, group: "The complaint" },
    { id: "firstDate", label: "When you first complained", type: "date", required: true, group: "The complaint" },
    { id: "firstRef", label: "The first complaint's reference", type: "text", group: "The complaint" },
    { id: "problem", label: "What the complaint was about", type: "textarea", required: true, rows: 3, group: "The complaint" },
    { id: "whatHappened", label: "What happened since, or did not", type: "textarea", rows: 3, group: "The complaint", help: "No reply, a reply that did nothing, a promise not kept." },
    { id: "wanted", label: "What you want done", type: "textarea", required: true, rows: 3, group: "What now", help: "One item per line." },
    { id: "deadlineDays", label: "Days you are giving them", type: "number", group: "What now", placeholder: "14" },
    { id: "nextStep", label: "What you will do if it is not resolved", type: "text", group: "What now", placeholder: "refer it to the ombudsman" },
  ],
  toneVariants: ["polite", "firm"],
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.recipientName);
    const wants = compact(clean(v.wanted).split("\n"));
    const firm = ctx.tone === "firm";
    const days = clean(v.deadlineDays);
    const deadline = has(v.firstDate) && has(days) ? addDays(ctx.today, Number(days)) : "";
    return {
      sender: compact([clean(v.senderName), ...clean(v.senderAddress).split("\n"), has(v.accountRef) && `Ref: ${clean(v.accountRef)}`]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: has(v.firstRef)
        ? `Escalation of complaint ${clean(v.firstRef)}`
        : `Escalation of an unresolved complaint`,
      salutation,
      body: compact([
        paragraph(
          firm
            ? sentence(
                `I am writing to escalate a complaint that you have failed to resolve, which I first raised on ${formatDate(v.firstDate, ctx.dateFormat)}`,
                has(v.firstRef) && `under reference ${clean(v.firstRef)}`,
                `concerning ${lowerFirst(clean(v.problem))}`,
              )
            : sentence(
                `I am following up on a complaint I first made on ${formatDate(v.firstDate, ctx.dateFormat)}`,
                has(v.firstRef) && `, reference ${clean(v.firstRef)}`,
                `about ${lowerFirst(clean(v.problem))}`,
              ),
          has(v.whatHappened) && sentence(clean(v.whatHappened)),
          firm
            ? sentence("This has now gone on too long, and I am escalating the matter formally rather than letting it drift any further")
            : sentence("As it has not been put right yet, I wanted to raise it with you again in the hope of settling it"),
        ),
        wants.length > 0 &&
          paragraph(
            firm
              ? sentence(`To resolve this properly, I require you to ${lowerFirst(list(wants))}`)
              : sentence(`To put things right, I would be grateful if you could ${lowerFirst(list(wants))}`),
          ),
        has(deadline) &&
          sentence(
            firm
              ? `I expect a full written response by ${formatDate(deadline, ctx.dateFormat)}, failing which I will treat the complaint as deadlocked`
              : `It would help to have a response by ${formatDate(deadline, ctx.dateFormat)}, so I know where things stand`,
          ),
        has(v.nextStep) &&
          sentence(
            firm
              ? `Should the matter remain unresolved after that, I will ${lowerFirst(clean(v.nextStep))} without further notice`
              : `If we cannot resolve it between us, I may then ${lowerFirst(clean(v.nextStep))}`,
          ),
        firm
          ? sentence("I trust that will not be necessary")
          : sentence("Thank you for looking into this again"),
      ]),
      valediction,
      signOff: compact([clean(v.senderName)]),
    };
  },
  faq: [
    { q: "When should I escalate a complaint?", a: "When the first complaint got no reply within the time promised, or a reply that did not resolve it. Escalating restates the facts, references the original, and makes clear it is now a step up." },
    { q: "How long should I give them?", a: "A common window is 14 days for an escalation, on top of whatever the first complaint allowed. State a date, so there is a clear point after which you act." },
    { q: "What is a good next step to name?", a: "Whatever genuinely applies: an ombudsman or regulator for that industry, a chargeback through your card provider, or a small claim. Name it only if you mean to use it." },
    { q: "Should the tone be angry?", a: "No. Firm and factual carries further than angry. The firm setting here states things plainly and sets a deadline without insults, which is what gets an escalation taken seriously." },
  ],
  example: {
    senderName: "Ian Docherty",
    senderAddress: "77 Maple Street\nGlasgow G12 8QQ",
    accountRef: "CU-55210",
    recipientName: "The Customer Relations Manager",
    companyBlock: "Customer Relations\nNorthline Broadband\nPO Box 88, Glasgow",
    firstDate: "2026-07-20",
    firstRef: "CMP-40921",
    problem: "a broadband fault that has left me without a working connection for three weeks",
    whatHappened: "I was promised a callback within 48 hours and have heard nothing in over two weeks.",
    wanted: "Restore the connection or confirm a firm engineer date\nRefund the period I have been without service\nConfirm the compensation your policy provides for missed appointments",
    deadlineDays: "14",
    nextStep: "refer the complaint to the communications ombudsman",
  },
};

const rentIncreaseResponse: LetterType = {
  slug: "rent-increase-response",
  title: "Rent increase response",
  whoItsFor: "Your landlord has proposed a rent rise and you are replying",
  seoNotes: [
    "A landlord's proposed rent increase deserves a written reply, whether you accept it, counter it, or ask for justification. Putting it in writing keeps a record and often opens a negotiation a phone call closes.",
    "State the current rent, the proposed rent, and your position plainly. A reply that is specific about numbers is one that gets a considered answer.",
  ],
  fields: [
    { id: "tenantName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "tenantAddress", label: "The rented address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "landlordName", label: "Who you are writing to", type: "text", group: "The increase", placeholder: "Mr Adeyemi" },
    { id: "landlordBlock", label: "Landlord or agent address", type: "textarea", rows: 3, group: "The increase" },
    { id: "currentRent", label: "Your current rent", type: "text", required: true, group: "The increase", placeholder: "£1,100 a month" },
    { id: "proposedRent", label: "The proposed new rent", type: "text", required: true, group: "The increase", placeholder: "£1,300 a month" },
    { id: "proposedFrom", label: "When it would start", type: "date", group: "The increase" },
    { id: "position", label: "Your response", type: "select", required: true, group: "Your response", options: [
      { value: "accept", label: "Accept it" },
      { value: "counter", label: "Propose a smaller increase" },
      { value: "justify", label: "Ask them to justify it" },
    ] },
    { id: "counterRent", label: "The rent you propose instead", type: "text", group: "Your response", placeholder: "£1,180 a month", help: "If you are proposing a smaller increase." },
    { id: "reason", label: "Anything to add", type: "textarea", rows: 3, group: "Your response", help: "Years as a good tenant, local rents, repairs outstanding." },
  ],
  toneVariants: ["polite", "firm"],
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.landlordName);
    const firm = ctx.tone === "firm";
    const position = clean(v.position);
    const addressLines = compact(clean(v.tenantAddress).split("\n"));
    const propertyLine = addressLines[0] ?? "";
    const opening = {
      accept: sentence(`Thank you for your letter proposing to raise the rent on ${propertyLine} from ${clean(v.currentRent)} to ${clean(v.proposedRent)}`),
      counter: sentence(`Thank you for your letter proposing to raise the rent from ${clean(v.currentRent)} to ${clean(v.proposedRent)}`),
      justify: sentence(`I am writing about your proposal to raise the rent from ${clean(v.currentRent)} to ${clean(v.proposedRent)}`),
    }[position] ?? "";
    const stance = {
      accept: sentence(
        `I am happy to accept the new rent`,
        has(v.proposedFrom) && `from ${formatDate(v.proposedFrom, ctx.dateFormat)}`,
      ),
      counter: firm
        ? sentence(
            has(v.counterRent)
              ? `An increase of that size is more than I can agree to; I am willing to accept ${clean(v.counterRent)}, and no more`
              : `An increase of that size is more than I can agree to, and I would ask you to reconsider it`,
          )
        : sentence(
            has(v.counterRent)
              ? `Would you consider ${clean(v.counterRent)} instead? I would happily agree to that`
              : `Might you consider a smaller increase? I would happily agree to something more modest`,
          ),
      justify: firm
        ? sentence(`Before I agree to anything, I need you to set out how this figure was reached and how it compares with rents for similar properties nearby`)
        : sentence(`It would help me to understand how the figure was reached, and how it sits against rents for similar places nearby`),
    }[position] ?? "";
    return {
      sender: compact([clean(v.tenantName), ...addressLines]),
      recipient: compact(clean(v.landlordBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Proposed rent increase, ${propertyLine}`,
      salutation,
      body: compact([
        paragraph(opening, stance),
        has(v.reason) && sentence(clean(v.reason)),
        sentence(
          position === "accept"
            ? "Please confirm the new figure and the date it takes effect"
            : firm
              ? "I would ask for your reply in writing before the proposed date, so there is a clear record of what we settle"
              : "I hope we can find something that works for us both, and I look forward to hearing from you",
        ),
      ]),
      valediction,
      signOff: compact([clean(v.tenantName)]),
    };
  },
  faq: [
    { q: "Do I have to accept a rent increase?", a: "It depends on your tenancy and where you live. Many increases can be questioned or negotiated, and some require a set notice or a formal process. Replying in writing keeps a record and often starts a conversation, whatever the legal position." },
    { q: "Can I propose a smaller increase?", a: "Yes, and it is common. Name a figure you can live with and, if you can, a reason it is fair: a good payment record, local rents, or repairs outstanding. A specific counter is easier to accept than a flat refusal." },
    { q: "What if the increase seems unjustified?", a: "Ask for it to be justified, and compare it with rents for similar places nearby. If your tenancy has a formal route to challenge an increase, this letter is a sensible first step before using it." },
    { q: "Should I keep paying the old rent meanwhile?", a: "Keep paying what is currently agreed until a new figure is settled, so you are not in arrears. Stopping or underpaying before agreement can put your tenancy at risk. Check the rules for your tenancy if in doubt." },
  ],
  example: {
    tenantName: "Sara Ahmed",
    tenantAddress: "Flat 4, 20 Rosebery Avenue\nLondon EC1R 4SX",
    landlordName: "Mr Adeyemi",
    landlordBlock: "Brightwater Lettings\n12 Kirkgate\nLondon EC1A 2AA",
    currentRent: "£1,100 a month",
    proposedRent: "£1,300 a month",
    proposedFrom: "2026-11-01",
    position: "counter",
    counterRent: "£1,180 a month",
    reason: "I have paid on time for four years and kept the flat in good order, and comparable flats on the street are advertised at around this figure.",
  },
};

export const extraLetters: LetterType[] = [
  experienceCertificate,
  salaryCertificateRequest,
  internshipApplication,
  characterReference,
  bankAccountClosure,
  complaintEscalation,
  rentIncreaseResponse,
];
