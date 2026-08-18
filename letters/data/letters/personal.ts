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

export const schoolAbsence: LetterType = {
  slug: "school-absence",
  title: "School absence letter",
  whoItsFor: "You need to explain why your child was, or will be, off school",
  seoNotes: [
    "Schools need a written reason for an absence, kept on file. Short is fine — the date, the child, the class and the reason are the whole of it.",
    "Say whether the absence has already happened or is coming up, because the two are handled differently and a request for leave in term time usually needs approval.",
  ],
  fields: [
    { id: "parentName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "relationship", label: "You are the child's", type: "select", required: true, group: "About you", options: [
      { value: "parent", label: "Parent" },
      { value: "guardian", label: "Guardian" },
      { value: "carer", label: "Carer" },
    ] },
    { id: "contactNumber", label: "A number the school can reach you on", type: "text", group: "About you" },
    { id: "childName", label: "Your child's full name", type: "text", required: true, group: "About the absence" },
    { id: "className", label: "Class or year group", type: "text", required: true, group: "About the absence", placeholder: "Year 4, Willow class" },
    { id: "timing", label: "Has it happened yet", type: "select", required: true, group: "About the absence", options: [
      { value: "past", label: "It has already happened" },
      { value: "future", label: "It is coming up" },
    ] },
    { id: "fromDate", label: "First day absent", type: "date", required: true, group: "About the absence" },
    { id: "toDate", label: "Last day absent", type: "date", group: "About the absence", help: "Leave blank for a single day." },
    { id: "reason", label: "Reason", type: "select", required: true, group: "About the absence", options: [
      { value: "illness", label: "Illness" },
      { value: "medical", label: "A medical or dental appointment" },
      { value: "bereavement", label: "A death in the family" },
      { value: "religious", label: "A religious observance" },
      { value: "family", label: "An unavoidable family commitment" },
    ] },
    { id: "detail", label: "Anything the school should know", type: "textarea", rows: 3, group: "About the absence", help: "Optional. Schools rarely need medical detail — enough to record it is plenty." },
    { id: "catchUp", label: "How they will catch up", type: "text", group: "About the absence", placeholder: "we will collect the week's work on Friday", help: "Optional, and it helps for a planned absence." },
    { id: "teacherName", label: "Who you are writing to", type: "text", group: "Addressing it", placeholder: "Mrs Okafor" },
    { id: "schoolBlock", label: "School name and address", type: "textarea", required: true, rows: 3, group: "Addressing it" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.teacherName);
    const from = formatDate(v.fromDate, ctx.dateFormat);
    const to = has(v.toDate) ? formatDate(v.toDate, ctx.dateFormat) : "";
    const nights = has(v.toDate) ? nightsBetween(v.fromDate, v.toDate) : null;
    const future = clean(v.timing) === "future";
    const role = clean(v.relationship) || "parent";

    const span =
      to !== "" && to !== from
        ? future
          ? `will be absent from ${from} to ${to}`
          : `was absent from ${from} to ${to}`
        : future
          ? `will be absent on ${from}`
          : `was absent on ${from}`;

    const because = {
      illness: future ? "because of illness" : "because they were unwell",
      medical: "for a medical appointment that could not be arranged outside school hours",
      bereavement: "following a death in the family",
      religious: "for a religious observance",
      family: "for an unavoidable family commitment",
    }[clean(v.reason)] ?? "";

    return {
      sender: compact([clean(v.parentName), has(v.contactNumber) && clean(v.contactNumber)]),
      recipient: compact(clean(v.schoolBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Absence — ${clean(v.childName)}, ${clean(v.className)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `${clean(v.childName)} of ${clean(v.className)} ${span}`,
            because !== "" && because,
          ),
          nights !== null && nights > 0
            ? sentence(`That is ${plural(nights + 1, "school day")} in total`)
            : "",
        ),
        has(v.detail) && paragraph(sentence(clean(v.detail))),
        future
          ? paragraph(
              sentence("I am letting you know in advance so it can be recorded"),
              has(v.catchUp) && sentence(capitaliseFirst(clean(v.catchUp))),
            )
          : has(v.catchUp)
            ? paragraph(sentence(capitaliseFirst(clean(v.catchUp))))
            : "",
        sentence(
          has(v.contactNumber)
            ? `Please call me on ${clean(v.contactNumber)} if you need anything further`
            : "Please let me know if you need anything further",
        ),
      ]),
      valediction,
      signOff: compact([
        clean(v.parentName),
        `${capitaliseFirst(role)} of ${clean(v.childName)}`,
      ]),
    };
  },
  faq: [
    { q: "How much detail does a school need about an illness?", a: "Very little. That the child was unwell, and the dates, is normally the whole record. Schools do not need a diagnosis and you are not obliged to give one." },
    { q: "Do I need a doctor's note?", a: "Usually only for a long absence or where the school's policy says so. For a day or two, a letter from a parent is what the attendance record expects." },
    { q: "Can I take my child out of school for a holiday?", a: "In many places term-time leave needs the head teacher's approval and is often refused, sometimes with a fine. Ask in advance rather than explaining afterwards." },
    { q: "Should I write in advance or afterwards?", a: "In advance whenever you know, which is what turns an unexplained absence into an authorised one. This letter handles both." },
  ],
  example: {
    parentName: "Chinelo Abara",
    relationship: "parent",
    contactNumber: "07700 900412",
    childName: "Amara Abara",
    className: "Year 4, Willow class",
    timing: "past",
    fromDate: "2026-08-10",
    toDate: "2026-08-12",
    reason: "illness",
    detail: "She had a high temperature and a persistent cough, and we kept her home until she was clear for twenty-four hours.",
    catchUp: "we have gone through the reading and the spellings she missed at home",
    teacherName: "Mrs Okafor",
    schoolBlock: "Brookfield Primary School\nBrookfield Lane\nBirmingham B13 9QT",
  },
};

export const authorizationLetter: LetterType = {
  slug: "authorization-letter",
  title: "Authorization letter",
  whoItsFor: "You need someone else to collect something or act for you",
  seoNotes: [
    "An authorization letter lets a named person do one specific thing on your behalf: collect a document, sign for a delivery, deal with an office you cannot get to. It is not a power of attorney and does not replace one.",
    "Name the person, name the task, and put an end date on it. An open-ended authorization is one you cannot easily withdraw.",
  ],
  fields: [
    { id: "principalName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "principalId", label: "Your ID or reference number", type: "text", group: "About you", placeholder: "passport AB1234567", help: "Whatever number the office holds you under." },
    { id: "principalAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "principalContact", label: "A number they can reach you on", type: "text", group: "About you", help: "Offices often ring to confirm. Worth including." },
    { id: "agentName", label: "Who you are authorising", type: "text", required: true, group: "Who you are authorising" },
    { id: "agentRelationship", label: "Their relationship to you", type: "text", required: true, group: "Who you are authorising", placeholder: "my brother" },
    { id: "agentId", label: "Their ID number", type: "text", group: "Who you are authorising", help: "Include it where the office will check identity, which is most of the time." },
    { id: "task", label: "Exactly what they may do", type: "textarea", required: true, rows: 3, group: "What they may do", placeholder: "collect my degree certificate and academic transcript", help: "Be specific. Anything not written here is not authorised." },
    { id: "validFrom", label: "Valid from", type: "date", group: "What they may do" },
    { id: "validUntil", label: "Valid until", type: "date", group: "What they may do", help: "Strongly recommended. An authorization with no end date never expires." },
    { id: "limits", label: "What they may not do", type: "text", group: "What they may do", placeholder: "make any changes to the record or request additional documents" },
    { id: "recipientBlock", label: "Who it is addressed to", type: "textarea", required: true, rows: 3, group: "Addressing it" },
    { id: "officerName", label: "Named person, if you have one", type: "text", group: "Addressing it" },
  ],
  toneVariants: null,
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.officerName);
    const from = has(v.validFrom) ? formatDate(v.validFrom, ctx.dateFormat) : "";
    const until = has(v.validUntil) ? formatDate(v.validUntil, ctx.dateFormat) : "";

    const window =
      from !== "" && until !== ""
        ? `This authorization is valid from ${from} until ${until}.`
        : until !== ""
          ? `This authorization is valid until ${until}.`
          : from !== ""
            ? `This authorization takes effect on ${from}.`
            : "";

    return {
      sender: compact([
        clean(v.principalName),
        ...clean(v.principalAddress).split("\n"),
        has(v.principalContact) && clean(v.principalContact),
      ]),
      recipient: compact(clean(v.recipientBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Authorization for ${clean(v.agentName)} to act on my behalf`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `I, ${clean(v.principalName)}`,
            has(v.principalId) && `, ${clean(v.principalId)}`,
            `, authorise ${clean(v.agentRelationship)}, ${clean(v.agentName)}`,
            has(v.agentId) && `, ${clean(v.agentId)}`,
            `, to act on my behalf in the matter below`,
          ),
        ),
        paragraph(sentence(capitaliseFirst(clean(v.task)))),
        paragraph(
          has(v.limits) &&
            sentence(
              `This authorization does not extend to ${lowerFirst(clean(v.limits))}`,
            ),
          window !== "" && sentence(window),
        ),
        paragraph(
          sentence(
            has(v.principalContact)
              ? `Please contact me on ${clean(v.principalContact)} if you need to confirm any of this`
              : "Please contact me if you need to confirm any of this",
          ),
          sentence(
            `${clean(v.agentName)} will bring identification, and I have signed below`,
          ),
        ),
      ]),
      valediction,
      signOff: compact([
        clean(v.principalName),
        has(v.principalId) && clean(v.principalId),
      ]),
    };
  },
  faq: [
    { q: "Is an authorization letter the same as a power of attorney?", a: "No. This covers one named task and carries no legal authority over your affairs. A power of attorney is a formal instrument, usually witnessed or notarised, and is what you need for anything financial or medical." },
    { q: "Does it need to be notarised?", a: "For collecting documents, usually not. Banks, land registries and government offices often do require notarisation — check before you send someone across a city." },
    { q: "What should the person bring with them?", a: "This letter, their own identification, and often a copy of yours. Say in the letter which identification they will carry so the office knows what to expect." },
    { q: "Should I put an expiry date on it?", a: "Yes. An authorization with no end date stays valid indefinitely and is awkward to withdraw. Give it a window that covers the task and no more." },
    { q: "Can one letter authorise several things?", a: "It can, but each one has to be written out. Anything not named in the letter is not authorised, which is the point of writing it down." },
  ],
  example: {
    principalName: "Yusuf Demir",
    principalId: "passport U11223344",
    principalAddress: "Bahçelievler Mah. 12/4\n06490 Ankara\nTürkiye",
    principalContact: "+90 532 000 0000",
    agentName: "Elif Demir",
    agentRelationship: "my sister",
    agentId: "national ID 12345678901",
    task: "collect my degree certificate and academic transcript from the student records office, and sign the collection register on my behalf",
    validFrom: "2026-09-01",
    validUntil: "2026-09-30",
    limits: "make any changes to my student record or request any further documents",
    recipientBlock: "Student Records Office\nMiddle East Technical University\nAnkara",
    officerName: "",
  },
};

function capitaliseFirst(text: string): string {
  return text === "" ? "" : text.charAt(0).toUpperCase() + text.slice(1);
}

function lowerFirst(text: string): string {
  if (text === "") return "";
  const firstWord = text.split(/\s/)[0];
  if (firstWord.length > 1 && firstWord === firstWord.toUpperCase()) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export const personalLetters = [schoolAbsence, authorizationLetter];
