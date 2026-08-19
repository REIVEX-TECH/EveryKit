import {
  addressing,
  clean,
  compact,
  formatDate,
  has,
  nightsBetween,
  paragraph,
  plural,
  sentence,
  type LetterType,
} from "@/lib/letter/types";

/**
 * The visa letters. These carry the most weight of anything in this kit —
 * a refused application costs money and months — so each one covers the points
 * its FAQ promises and nothing is padded to look longer.
 */

export const visaInvitation: LetterType = {
  slug: "visa-invitation",
  title: "Visa invitation letter",
  whoItsFor: "You live abroad and want a friend or relative to visit you",
  seoNotes: [
    "An invitation letter is written by the person already living in the country, not by the visitor. Consulates read it to see who is inviting whom, how you know each other, where the visitor will sleep, and who is paying.",
    "It is a supporting document. It does not replace the visitor's own application, and no invitation obliges an embassy to grant a visa.",
  ],
  fields: [
    { id: "hostName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "hostAddress", label: "Your address", type: "textarea", required: true, rows: 3, group: "About you", help: "The address the visitor will be staying at, if that is where you live." },
    { id: "hostStatus", label: "Your status in the country", type: "select", required: true, group: "About you", options: [
      { value: "citizen", label: "Citizen" },
      { value: "permanent", label: "Permanent resident" },
      { value: "work", label: "Resident on a work permit" },
      { value: "study", label: "Resident on a student permit" },
    ], help: "Consulates want to know the invitation comes from someone lawfully present." },
    { id: "hostOccupation", label: "Your job and employer", type: "text", group: "About you", help: "Optional. Worth adding when you are covering the costs." },
    { id: "guestName", label: "Visitor's full name, as printed in their passport", type: "text", required: true, group: "About the visitor" },
    { id: "guestPassport", label: "Visitor's passport number", type: "text", group: "About the visitor" },
    { id: "guestNationality", label: "Visitor's nationality", type: "text", group: "About the visitor" },
    { id: "relationship", label: "How you know each other", type: "text", required: true, group: "About the visitor", placeholder: "my younger sister", help: "Write it as you would say it: \"my mother\", \"my colleague of six years\"." },
    { id: "arrival", label: "Arrival date", type: "date", required: true, group: "The visit" },
    { id: "departure", label: "Departure date", type: "date", required: true, group: "The visit" },
    { id: "purpose", label: "Reason for the visit", type: "text", group: "The visit", placeholder: "to attend my graduation" },
    { id: "accommodation", label: "Where they will stay", type: "select", required: true, group: "The visit", options: [
      { value: "with-me", label: "At my home, at no cost to them" },
      { value: "hotel-me", label: "In a hotel I am paying for" },
      { value: "hotel-them", label: "In a hotel they are paying for" },
    ] },
    { id: "costs", label: "Who is covering the trip", type: "select", required: true, group: "The visit", options: [
      { value: "host", label: "I am covering their costs" },
      { value: "guest", label: "They are covering their own costs" },
      { value: "shared", label: "We are sharing the costs" },
    ] },
    { id: "consulate", label: "Which embassy or consulate", type: "text", group: "Addressing it", placeholder: "The Visa Section, Embassy of Italy, Islamabad", help: "Leave this blank if you do not know, and it will open \"Dear Sir or Madam\"." },
    { id: "officerName", label: "Named officer, if you have one", type: "text", group: "Addressing it" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.officerName);
    const arrival = formatDate(v.arrival, ctx.dateFormat);
    const departure = formatDate(v.departure, ctx.dateFormat);
    const nights = nightsBetween(v.arrival, v.departure);

    const status = {
      citizen: "a citizen of this country",
      permanent: "a permanent resident of this country",
      work: "resident here on a work permit",
      study: "resident here on a student permit",
    }[clean(v.hostStatus)] ?? "resident here";

    const stay = {
      "with-me": `${clean(v.guestName)} will stay at my home for the whole of the visit, at no cost to ${pronounObject()}`,
      "hotel-me": `${clean(v.guestName)} will stay in a hotel, which I have arranged and will pay for`,
      "hotel-them": `${clean(v.guestName)} has arranged and paid for hotel accommodation`,
    }[clean(v.accommodation)] ?? "";

    const money = {
      host: "I will be responsible for the costs of this visit, including travel, accommodation, medical insurance and day-to-day expenses.",
      guest: `${clean(v.guestName)} is funding the trip and will meet ${pronounPossessive()} own costs while here.`,
      shared: `We have agreed to share the cost of the visit between us; I will cover accommodation and living expenses while ${clean(v.guestName)} pays for travel and insurance.`,
    }[clean(v.costs)] ?? "";

    return {
      sender: compact([clean(v.hostName), ...clean(v.hostAddress).split("\n")]),
      recipient: compact(clean(v.consulate).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Invitation to visit, for ${clean(v.guestName)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `I am ${clean(v.hostName)},`,
            `${status},`,
            `and I would like to invite ${clean(v.relationship)}, ${clean(v.guestName)}, to visit me`,
          ),
          has(v.hostOccupation) && sentence(`I work as ${clean(v.hostOccupation)}`),
        ),
        paragraph(
          sentence(
            `${clean(v.guestName)}`,
            has(v.guestNationality) && `holds ${clean(v.guestNationality)} nationality`,
            has(v.guestPassport) && has(v.guestNationality)
              ? `and travels on passport number ${clean(v.guestPassport)}`
              : has(v.guestPassport) && `travels on passport number ${clean(v.guestPassport)}`,
          ),
          sentence(
            nights
              ? `The visit is planned from ${arrival} to ${departure}, ${plural(nights, "night")} in total`
              : `The visit is planned from ${arrival} to ${departure}`,
            has(v.purpose) && `, ${clean(v.purpose)}`,
          ),
        ),
        paragraph(sentence(stay), sentence(money)),
        sentence(
          `${clean(v.guestName)} will return home at the end of the visit, and I understand that this invitation does not commit your office to granting a visa`,
        ),
        sentence("I am happy to provide any further documents your office needs"),
      ]),
      valediction,
      signOff: compact([clean(v.hostName)]),
    };
  },
  faq: [
    { q: "Who writes the invitation letter, the host or the visitor?", a: "The host. It is written by the person already living in the country being visited, and addressed to the embassy or consulate handling the application. The visitor submits it with their own paperwork." },
    { q: "Does the letter need to say who is paying?", a: "Yes. It is one of the first things a visa officer looks for. Say plainly whether you are covering the trip, whether your visitor is, or whether you are splitting it, and be consistent with the bank statements you attach." },
    { q: "Does an invitation letter guarantee a visa?", a: "No, and it should not claim to. It is a supporting document that answers who, when, where and at whose expense. The decision rests with the consulate." },
    { q: "Should the letter be notarised?", a: "Usually not for a short visit. A few consulates ask for it, so check the requirements for the specific post before paying for notarisation." },
    { q: "What should I attach to it?", a: "Typically proof of your own status, proof of address, and recent bank statements if you are funding the trip. The consulate's document list is the one that matters." },
  ],
  example: {
    hostName: "Sana Iqbal",
    hostAddress: "48 Bramley Court\nManchester M14 6FT\nUnited Kingdom",
    hostStatus: "permanent",
    hostOccupation: "a staff nurse at Whitfield General Hospital",
    guestName: "Nadia Iqbal",
    guestPassport: "AB1234567",
    guestNationality: "Pakistani",
    relationship: "my mother",
    arrival: "2026-11-04",
    departure: "2026-11-25",
    purpose: "to be with me for the birth of my first child",
    accommodation: "with-me",
    costs: "host",
    consulate: "The Visa Section\nBritish High Commission\nIslamabad",
    officerName: "",
  },
};

export const visaCoverLetter: LetterType = {
  slug: "visa-cover-letter",
  title: "Visa cover letter",
  whoItsFor: "You are applying for a visa and need the letter that explains your file",
  seoNotes: [
    "A cover letter sits on top of a visa application and tells the officer, in one page, why you are travelling, how long for, who is paying, and what will bring you home.",
    "It is the only part of the file where you speak in your own voice. Everything else is forms and statements.",
  ],
  fields: [
    { id: "applicantName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "applicantAddress", label: "Your address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "passportNumber", label: "Passport number", type: "text", group: "About you" },
    { id: "occupation", label: "What you do", type: "text", required: true, group: "About you", placeholder: "a civil engineer at Meridian Construction", help: "Your job, or your course if you are studying." },
    { id: "country", label: "Country you are applying to visit", type: "text", required: true, group: "The trip" },
    { id: "visaType", label: "Visa type", type: "text", required: true, group: "The trip", placeholder: "short-stay visitor visa" },
    { id: "purpose", label: "Why you are going", type: "textarea", required: true, rows: 3, group: "The trip", help: "One or two sentences. Tourism, a conference, seeing family. Be specific about what you will actually do." },
    { id: "arrival", label: "Arrival date", type: "date", required: true, group: "The trip" },
    { id: "departure", label: "Departure date", type: "date", required: true, group: "The trip" },
    { id: "itinerary", label: "Where you will be", type: "textarea", rows: 3, group: "The trip", help: "Optional. Cities and rough dates. Skip it if your plans are simple." },
    { id: "accommodation", label: "Where you will stay", type: "text", group: "The trip", placeholder: "Hotel Alba, Rome (booking attached)" },
    { id: "funding", label: "Who is paying", type: "select", required: true, group: "Money and ties", options: [
      { value: "self", label: "I am funding the trip myself" },
      { value: "sponsor", label: "Someone is sponsoring me" },
      { value: "employer", label: "My employer is paying" },
    ] },
    { id: "sponsorName", label: "Sponsor's name and relationship", type: "text", group: "Money and ties", help: "Only if someone else is paying." },
    { id: "ties", label: "What brings you home", type: "textarea", required: true, rows: 3, group: "Money and ties", help: "The reason an officer believes you will leave: a job to return to, family, studies, property. This is the part most applications are weakest on." },
    { id: "previousTravel", label: "Previous travel", type: "textarea", rows: 2, group: "Money and ties", help: "Optional. Visas you have held and complied with." },
    { id: "consulate", label: "Which embassy or consulate", type: "text", group: "Addressing it" },
    { id: "officerName", label: "Named officer, if you have one", type: "text", group: "Addressing it" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.officerName);
    const arrival = formatDate(v.arrival, ctx.dateFormat);
    const departure = formatDate(v.departure, ctx.dateFormat);
    const nights = nightsBetween(v.arrival, v.departure);

    const funding = {
      self: `The trip is funded from my own savings, and my bank statements for the last six months are enclosed.`,
      sponsor: has(v.sponsorName)
        ? `${clean(v.sponsorName)} is sponsoring the trip, and the supporting financial documents are enclosed.`
        : `The trip is being sponsored, and the supporting financial documents are enclosed.`,
      employer: `My employer is covering the cost of the trip, and their letter confirming this is enclosed.`,
    }[clean(v.funding)] ?? "";

    return {
      sender: compact([clean(v.applicantName), ...clean(v.applicantAddress).split("\n")]),
      recipient: compact(clean(v.consulate).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Application for a ${clean(v.visaType)}, for ${clean(v.applicantName)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `Please find enclosed my application for a ${clean(v.visaType)} to ${clean(v.country)}`,
          ),
          sentence(
            `I am ${clean(v.occupation)}`,
            has(v.passportNumber) && `and I hold passport number ${clean(v.passportNumber)}`,
          ),
        ),
        paragraph(
          sentence(clean(v.purpose)),
          sentence(
            nights
              ? `I intend to arrive on ${arrival} and leave on ${departure}, a stay of ${plural(nights, "night")}`
              : `I intend to arrive on ${arrival} and leave on ${departure}`,
          ),
          has(v.itinerary) && sentence(clean(v.itinerary)),
          has(v.accommodation) && sentence(`I will be staying at ${clean(v.accommodation)}`),
        ),
        paragraph(sentence(funding)),
        paragraph(
          sentence(clean(v.ties)),
          has(v.previousTravel) && sentence(clean(v.previousTravel)),
          sentence(`I will leave ${clean(v.country)} before my visa expires`),
        ),
        sentence(
          "The documents listed in your checklist are enclosed, and I can supply anything further on request",
        ),
      ]),
      valediction,
      signOff: compact([clean(v.applicantName)]),
    };
  },
  faq: [
    { q: "Is a cover letter required for a visa application?", a: "Rarely required, often decisive. Most consulates do not list it, but it is the one document where you can connect the rest of the file together and answer the officer's questions before they ask them." },
    { q: "How long should it be?", a: "One page. An officer may spend a couple of minutes on your file, and a letter that runs to three pages gets skimmed rather than read." },
    { q: "What are 'ties to my home country' and why do they matter?", a: "They are the reasons you would come back: a job held open, dependants, a course to finish, a business, property. Most refusals under the visitor rules come down to the officer not being satisfied you would leave, so this is the paragraph worth spending time on." },
    { q: "Should I mention a previous refusal?", a: "If you have one, address it briefly and factually rather than hoping it goes unnoticed, because it will not. Say what has changed since." },
    { q: "Do I sign it?", a: "Yes. Print it, sign above your typed name, and put it at the front of the file." },
  ],
  example: {
    applicantName: "Tarek Haddad",
    applicantAddress: "12 Rue des Oliviers\nTunis 1002\nTunisia",
    passportNumber: "TN4471908",
    occupation: "a structural engineer at Beyond Build, where I have worked for seven years",
    country: "Germany",
    visaType: "Schengen short-stay visa",
    purpose: "I have been invited to present a paper at the European Bridge Engineering Congress in Munich, and will spend three days at the conference and two visiting the Deutsches Museum's engineering collection.",
    arrival: "2026-09-14",
    departure: "2026-09-20",
    itinerary: "I will be in Munich for the whole trip, at the congress venue in Riem from 15 to 17 September.",
    accommodation: "Hotel Königshof, Munich (booking confirmation enclosed)",
    funding: "employer",
    sponsorName: "",
    ties: "I return to a permanent post at Beyond Build, where I lead a team of four on a bridge project running until 2028. My wife and two children live in Tunis, and I am halfway through a part-time master's at the University of Carthage.",
    previousTravel: "I have held Schengen visas in 2022 and 2024 and returned within their validity on both occasions.",
    consulate: "The Visa Section\nEmbassy of the Federal Republic of Germany\nTunis",
    officerName: "",
  },
};

const REFUSAL_GROUNDS = [
  { value: "purpose", label: "Purpose of the trip not established" },
  { value: "funds", label: "Insufficient or unclear funds" },
  { value: "ties", label: "Intention to return not established" },
  { value: "documents", label: "Documents missing or inconsistent" },
  { value: "accommodation", label: "Accommodation not confirmed" },
  { value: "insurance", label: "Travel insurance not adequate" },
  { value: "history", label: "Immigration history" },
  { value: "other", label: "Something else" },
];

export const visaAppeal: LetterType = {
  slug: "visa-appeal",
  title: "Visa refusal appeal letter",
  whoItsFor: "Your visa was refused and you want to challenge or reapply",
  seoNotes: [
    "An appeal answers the refusal notice point by point. It works when the officer misread the file or when a document was missing, and it does not work as a plea for sympathy.",
    "Check the notice for the deadline and the address before writing. Some posts take appeals by email, some by post, and some require a fresh application instead.",
  ],
  fields: [
    { id: "applicantName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "applicantAddress", label: "Your address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "referenceNumber", label: "Application or reference number", type: "text", required: true, group: "The refusal", help: "Printed on the refusal notice. Put it in even if you are unsure it is the right one." },
    { id: "refusalDate", label: "Date on the refusal notice", type: "date", required: true, group: "The refusal" },
    { id: "visaType", label: "Visa you applied for", type: "text", required: true, group: "The refusal" },
    { id: "ground", label: "Main reason given for the refusal", type: "select", required: true, group: "The refusal", options: REFUSAL_GROUNDS },
    { id: "groundDetail", label: "What the notice actually said", type: "textarea", rows: 3, group: "The refusal", help: "Quote it if you can. Answering the exact wording is what makes an appeal work." },
    { id: "response", label: "Your answer to that reason", type: "textarea", required: true, rows: 4, group: "Your response", help: "Address the reason directly. What did the officer not have, or read the wrong way?" },
    { id: "newEvidence", label: "New documents you are enclosing", type: "textarea", rows: 3, group: "Your response", help: "One per line. Leave blank if you are not adding anything." },
    { id: "consulate", label: "Where you are sending it", type: "textarea", rows: 3, group: "Addressing it" },
    { id: "officerName", label: "Named officer, if the notice gives one", type: "text", group: "Addressing it" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.officerName);
    const refusalDate = formatDate(v.refusalDate, ctx.dateFormat);
    const enclosures = compact(clean(v.newEvidence).split("\n"));

    const groundText = {
      purpose: "that the purpose of my trip had not been established",
      funds: "that I had not shown sufficient funds for the trip",
      ties: "that I had not shown I would leave at the end of my stay",
      documents: "that my supporting documents were incomplete or inconsistent",
      accommodation: "that my accommodation had not been confirmed",
      insurance: "that my travel insurance was not adequate",
      history: "concerns arising from my immigration history",
      other: "the reason set out in the notice",
    }[clean(v.ground)] ?? "the reason set out in the notice";

    return {
      sender: compact([clean(v.applicantName), ...clean(v.applicantAddress).split("\n")]),
      recipient: compact(clean(v.consulate).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Appeal against refusal of a ${clean(v.visaType)}, reference ${clean(v.referenceNumber)}`,
      salutation,
      body: compact([
        sentence(
          `My application for a ${clean(v.visaType)}, reference ${clean(v.referenceNumber)}, was refused on ${refusalDate}`,
          `and I would like to ask your office to review that decision`,
        ),
        paragraph(
          sentence(`The notice gave as its reason ${groundText}`),
          has(v.groundDetail) && sentence(clean(v.groundDetail)),
        ),
        paragraph(sentence(clean(v.response))),
        enclosures.length > 0 &&
          sentence(
            enclosures.length === 1
              ? `I enclose ${enclosures[0]} in support of this`
              : `I enclose the documents listed below in support of this`,
          ),
        sentence(
          "I would be grateful if the file could be looked at again in light of the above",
        ),
        sentence("Please tell me if anything further would help, and I will send it"),
      ]),
      valediction,
      signOff: compact([clean(v.applicantName)]),
      enclosures: enclosures.length > 1 ? enclosures : undefined,
    };
  },
  faq: [
    { q: "Can I appeal a visa refusal?", a: "It depends on the country and the visa. Some refusals carry a formal right of appeal with a deadline, some allow only an administrative review, and for many visitor visas the practical route is a fresh application that fixes the problem. The refusal notice says which applies to you." },
    { q: "What actually changes a refusal decision?", a: "New evidence, or showing the officer misread what was already there. Repeating the original application in stronger language changes nothing." },
    { q: "How long do I have?", a: "The deadline is on the notice and is often short, sometimes 14 or 28 days. Send it well inside the window and keep proof of when you sent it." },
    { q: "Should I be apologetic?", a: "No, and you should not be indignant either. State the reason given, answer it, and enclose what supports your answer." },
    { q: "Is reapplying better than appealing?", a: "Often, when the refusal was about a missing document or a weak part of the file that you can now put right. An appeal is the better route when the decision was wrong on the evidence already submitted." },
  ],
  example: {
    applicantName: "Grace Okonjo",
    applicantAddress: "7 Adeyemi Close\nLekki, Lagos\nNigeria",
    referenceNumber: "GWF-2026-0044182",
    refusalDate: "2026-07-22",
    visaType: "standard visitor visa",
    ground: "ties",
    groundDetail: "The notice said it was not satisfied that I am genuinely seeking entry as a visitor and would leave the UK at the end of my visit.",
    response: "I am the registered owner of Okonjo Fabrics, which employs eleven people in Lagos and which I have run since 2017. My business registration, three years of tax filings and payroll records are enclosed; none of these were submitted with the original application, which is my error. My two children are in school in Lagos and my mother, whom I care for, lives with me.",
    newEvidence: "Certificate of business registration\nTax filings for 2023, 2024 and 2025\nPayroll summary for the last six months\nSchool enrolment letters for both children",
    consulate: "Visa Section\nBritish Deputy High Commission\nLagos",
    officerName: "",
  },
};

export const financialSponsorship: LetterType = {
  slug: "financial-sponsorship",
  title: "Financial sponsorship letter",
  whoItsFor: "You are paying for someone's studies or trip and need to declare it",
  seoNotes: [
    "A sponsorship letter is a written undertaking that you will cover someone's costs. Universities and consulates read it alongside your bank statements, so the figure in the letter and the money in the account need to agree.",
    "It is normally written by a parent, sibling or employer, and signed by the sponsor rather than the person being sponsored.",
  ],
  fields: [
    { id: "sponsorName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "sponsorAddress", label: "Your address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "sponsorOccupation", label: "Your job and employer", type: "text", required: true, group: "About you", help: "Where the money comes from matters as much as how much there is." },
    { id: "annualIncome", label: "Your annual income", type: "text", group: "About you", placeholder: "PKR 4,800,000", help: "Optional, but it makes the undertaking credible. Include the currency." },
    { id: "beneficiaryName", label: "Who you are sponsoring", type: "text", required: true, group: "Who you are sponsoring" },
    { id: "relationship", label: "Your relationship to them", type: "text", required: true, group: "Who you are sponsoring", placeholder: "my son" },
    { id: "reason", label: "What the money is for", type: "text", required: true, group: "Who you are sponsoring", placeholder: "his master's degree in computer science at the University of Leeds" },
    { id: "amount", label: "Amount you are committing", type: "text", required: true, group: "The commitment", placeholder: "GBP 24,000", help: "Include the currency, and match it to the figure the institution asks for." },
    { id: "period", label: "Over what period", type: "text", required: true, group: "The commitment", placeholder: "the two years of the course" },
    { id: "covers", label: "What it covers", type: "text", group: "The commitment", placeholder: "tuition fees, accommodation and living expenses" },
    { id: "bankName", label: "Bank holding the funds", type: "text", group: "The commitment" },
    { id: "recipientBlock", label: "Who it is addressed to", type: "textarea", rows: 3, group: "Addressing it", placeholder: "The Admissions Office\nUniversity of Leeds" },
    { id: "officerName", label: "Named person, if you have one", type: "text", group: "Addressing it" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.officerName);

    return {
      sender: compact([clean(v.sponsorName), ...clean(v.sponsorAddress).split("\n")]),
      recipient: compact(clean(v.recipientBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Financial sponsorship of ${clean(v.beneficiaryName)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `This letter confirms that I will be financially responsible for ${clean(v.relationship)}, ${clean(v.beneficiaryName)}, for ${clean(v.reason)}`,
          ),
          sentence(
            `I am ${clean(v.sponsorOccupation)}`,
            has(v.annualIncome) && `with an annual income of ${clean(v.annualIncome)}`,
          ),
        ),
        paragraph(
          sentence(
            `I undertake to provide ${clean(v.amount)} over ${clean(v.period)}`,
            has(v.covers) && `, covering ${clean(v.covers)}`,
          ),
          has(v.bankName)
            ? sentence(
                `These funds are held at ${clean(v.bankName)} and statements are enclosed`,
              )
            : sentence("Statements evidencing these funds are enclosed"),
        ),
        sentence(
          `${clean(v.beneficiaryName)} will not need to seek public funds or employment to meet these costs`,
        ),
        sentence(
          "I am content to provide any further evidence of my means that you require",
        ),
      ]),
      valediction,
      signOff: compact([clean(v.sponsorName)]),
    };
  },
  faq: [
    { q: "Who signs a sponsorship letter?", a: "The sponsor, meaning the person putting up the money. It is not signed by the student or traveller being sponsored." },
    { q: "How much detail about my income is needed?", a: "Enough for the reader to believe the commitment. Your job, your income and the bank holding the funds, with statements attached. A large figure with no visible source raises more questions than it answers." },
    { q: "Does the amount have to match my bank statements?", a: "It has to be supported by them. If you commit to a figure your account has never held, the letter works against the application." },
    { q: "Is a sponsorship letter legally binding?", a: "It is an undertaking, and some countries treat it as enforceable against the sponsor. Do not commit to more than you can actually pay." },
    { q: "Does it need to be notarised?", a: "Universities usually accept a signed letter with statements. Some consulates want it notarised or on a stamped affidavit, so check the specific requirement before you pay for one." },
  ],
  example: {
    sponsorName: "Rajesh Menon",
    sponsorAddress: "22 Nandi Durga Road\nBengaluru 560046\nIndia",
    sponsorOccupation: "a senior partner at Menon & Rao Chartered Accountants",
    annualIncome: "INR 6,200,000",
    beneficiaryName: "Ananya Menon",
    relationship: "my daughter",
    reason: "her MSc in Environmental Policy at the University of Edinburgh",
    amount: "GBP 38,000",
    period: "the twelve months of the programme",
    covers: "tuition fees, accommodation and living costs",
    bankName: "State Bank of India, Bengaluru main branch",
    recipientBlock: "The Admissions Office\nUniversity of Edinburgh\nEdinburgh EH8 9YL",
    officerName: "",
  },
};

/**
 * Relationship fields are free text ("my mother", "my colleague"), so there is
 * no reliable gender to read from them. These keep the sentences grammatical
 * without guessing: "them" and "their" are correct for anyone.
 */
function pronounObject(): string {
  return "them";
}

function pronounPossessive(): string {
  return "their";
}

export const visaLetters = [
  visaInvitation,
  visaCoverLetter,
  visaAppeal,
  financialSponsorship,
];
