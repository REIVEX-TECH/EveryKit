import {
  addDays,
  addressing,
  clean,
  compact,
  formatDate,
  has,
  paragraph,
  sentence,
  type LetterType,
} from "@/lib/letter/types";

/**
 * The three letters where tone matters most.
 *
 * "Firm" is not "polite with sharper adjectives" — it is a different letter.
 * The polite version asks and leaves the next step open; the firm version
 * states what is wrong, sets a date, and names what happens after it. Neither
 * insults anyone, because a letter that does stops being useful evidence.
 */

const RESOLUTIONS = [
  { value: "refund", label: "A full refund" },
  { value: "replacement", label: "A replacement" },
  { value: "repair", label: "A repair" },
  { value: "partial", label: "A partial refund" },
  { value: "redo", label: "The service done properly" },
];

export const complaintProductService: LetterType = {
  slug: "complaint-product-service",
  title: "Complaint letter",
  whoItsFor: "Something you bought is faulty, or the service was not what you paid for",
  seoNotes: [
    "A complaint that gets resolved has four things in it: what you bought and when, what went wrong, what you want done, and by when. Anger is optional and usually counterproductive; the reference number is not.",
    "Keep a copy. If the complaint goes to a regulator, an ombudsman or a card issuer later, this letter is the evidence that you raised it first.",
  ],
  fields: [
    { id: "customerName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "customerAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "accountRef", label: "Account or customer number", type: "text", group: "About you" },
    { id: "companyBlock", label: "Who you are complaining to", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "contactName", label: "Named person, if you have one", type: "text", group: "About you" },
    { id: "item", label: "What you bought", type: "text", required: true, group: "What happened", placeholder: "a Corsair dishwasher, model CDW-400" },
    { id: "purchaseDate", label: "Date of purchase", type: "date", required: true, group: "What happened" },
    { id: "orderRef", label: "Order or invoice number", type: "text", group: "What happened" },
    { id: "amount", label: "What you paid", type: "text", group: "What happened", placeholder: "£429.00" },
    { id: "problem", label: "What went wrong", type: "textarea", required: true, rows: 4, group: "What happened", help: "Facts and dates. What it does, when it started, what you have tried." },
    { id: "contactedBefore", label: "I have already contacted them about this", type: "checkbox", group: "What happened" },
    { id: "previousContact", label: "What happened when you did", type: "textarea", rows: 2, group: "What happened", help: "Dates, who you spoke to, what you were told." },
    { id: "resolution", label: "What you want", type: "select", required: true, group: "What you want", options: RESOLUTIONS },
    { id: "deadlineDays", label: "Days you are giving them", type: "number", group: "What you want", placeholder: "14", help: "Fourteen days is the usual expectation before escalating." },
    { id: "escalation", label: "What you will do if it is not resolved", type: "text", group: "What you want", placeholder: "refer the matter to the Financial Ombudsman Service", help: "Only used in the firm version. Name a real next step or leave it out." },
  ],
  toneVariants: ["polite", "firm"],
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.contactName);
    const purchased = formatDate(v.purchaseDate, ctx.dateFormat);
    const firm = ctx.tone === "firm";
    const days = Number(clean(v.deadlineDays));
    const deadline =
      Number.isFinite(days) && days > 0 ? addDays(ctx.today, days) : "";

    const wanted = {
      refund: "a full refund",
      replacement: "a replacement",
      repair: "a repair at no cost to me",
      partial: "a partial refund",
      redo: "the work done properly at no further cost",
    }[clean(v.resolution)] ?? "";

    const opening = firm
      ? paragraph(
          sentence(
            `On ${purchased} I bought ${clean(v.item)} from you`,
            has(v.amount) && `for ${clean(v.amount)}`,
            has(v.orderRef) && `, order ${clean(v.orderRef)}`,
          ),
          sentence("It has not done what it was sold to do, and I would like that put right"),
        )
      : paragraph(
          sentence(
            `On ${purchased} I bought ${clean(v.item)} from you`,
            has(v.amount) && `for ${clean(v.amount)}`,
            has(v.orderRef) && `, order ${clean(v.orderRef)}`,
          ),
          sentence("Unfortunately it has not worked as I expected, and I am hoping you can help"),
        );

    const history =
      clean(v.contactedBefore) === "true"
        ? firm
          ? paragraph(
              sentence("This is not the first time I have raised it"),
              has(v.previousContact) && sentence(clean(v.previousContact)),
              sentence("Nothing has changed since, which is why I am putting it in writing"),
            )
          : paragraph(
              sentence("I have already been in touch about this once"),
              has(v.previousContact) && sentence(clean(v.previousContact)),
            )
        : "";

    const ask = firm
      ? paragraph(
          sentence(`I am asking for ${wanted}`),
          deadline !== ""
            ? sentence(
                `Please confirm by ${formatDate(deadline, ctx.dateFormat)} that this will happen`,
              )
            : sentence("Please confirm in writing that this will happen"),
          has(v.escalation) &&
            sentence(
              `If I have not heard from you by then I will ${clean(v.escalation)}`,
            ),
        )
      : paragraph(
          sentence(`What I would like is ${wanted}`),
          deadline !== ""
            ? sentence(
                `If you could let me know by ${formatDate(deadline, ctx.dateFormat)}, that would help me plan around it`,
              )
            : sentence("Please let me know what you can do"),
        );

    return {
      sender: compact([clean(v.customerName), ...clean(v.customerAddress).split("\n")]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: has(v.orderRef)
        ? `Complaint regarding ${clean(v.item)}, order ${clean(v.orderRef)}`
        : `Complaint regarding ${clean(v.item)}`,
      salutation,
      body: compact([
        opening,
        paragraph(sentence(clean(v.problem))),
        history,
        ask,
        firm
          ? sentence("I have kept a copy of this letter and of my receipts")
          : sentence("Thank you for looking into it"),
      ]),
      valediction,
      signOff: compact([
        clean(v.customerName),
        has(v.accountRef) && `Customer reference ${clean(v.accountRef)}`,
      ]),
    };
  },
  faq: [
    { q: "What should a complaint letter include?", a: "What you bought and when, the order or account reference, what went wrong in plain facts, what you want done about it, and a date by which you want an answer. Everything else is padding." },
    { q: "Should I be angry in the letter?", a: "No. The person reading it did not build the product, and a letter that insults them gets handled slowly and grudgingly. Firm and specific gets better results than furious." },
    { q: "How long should I give them to respond?", a: "Fourteen days is the common expectation and is long enough to be reasonable. Say the date rather than the number of days, so there is nothing to argue about." },
    { q: "What if they ignore it?", a: "Escalate to whatever body covers the trade, such as an ombudsman, a regulator, or your card issuer for a chargeback. Having written first, with a date, is usually a precondition for any of those." },
    { q: "Email or letter?", a: "Either, but keep proof. Email gives you a timestamp; a posted letter sent with proof of delivery is stronger if the matter is likely to escalate." },
  ],
  example: {
    customerName: "Helen Mbeki",
    customerAddress: "31 Alder Grove\nBristol BS6 7QT",
    accountRef: "CU-884213",
    companyBlock: "Customer Relations\nCorsair Appliances Ltd\nUnit 4, Ashton Trade Park, Bristol",
    contactName: "",
    item: "a Corsair dishwasher, model CDW-400",
    purchaseDate: "2026-05-09",
    orderRef: "ORD-77120",
    amount: "£429.00",
    problem: "The machine stops mid-cycle and shows error code E4, leaving standing water in the drum. It first did this on 2 June, three weeks after delivery, and now does it on roughly every second wash. I have cleaned the filter and checked the drain hose as your support line suggested, and neither made any difference.",
    contactedBefore: "true",
    previousContact: "I called your support line on 4 June and again on 19 June. On the second call I was told an engineer would be booked within five working days, and I have heard nothing since.",
    resolution: "replacement",
    deadlineDays: "14",
    escalation: "refer the matter to my card issuer as a chargeback",
  },
};

export const refundRequest: LetterType = {
  slug: "refund-request",
  title: "Refund request letter",
  whoItsFor: "You are owed money back and it has not arrived",
  seoNotes: [
    "A refund request works when it is specific: the amount, the order, the date you returned or cancelled, and the date you expect the money by. Vagueness is what lets a refund sit in someone's queue.",
    "If you paid by card and the seller does not respond, your card issuer is usually the next step. Write first, keep the letter.",
  ],
  fields: [
    { id: "customerName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "customerAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "companyBlock", label: "Who owes you the money", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "contactName", label: "Named person, if you have one", type: "text", group: "About you" },
    { id: "item", label: "What it was for", type: "text", required: true, group: "The refund", placeholder: "two tickets to the Harbourside Festival" },
    { id: "amount", label: "Amount owed", type: "text", required: true, group: "The refund", placeholder: "£164.00" },
    { id: "orderRef", label: "Order or booking reference", type: "text", group: "The refund" },
    { id: "purchaseDate", label: "Date you paid", type: "date", group: "The refund" },
    { id: "trigger", label: "Why you are owed it", type: "select", required: true, group: "The refund", options: [
      { value: "cancelled-them", label: "They cancelled" },
      { value: "cancelled-me", label: "I cancelled within the allowed window" },
      { value: "returned", label: "I returned the item" },
      { value: "not-delivered", label: "It never arrived" },
      { value: "not-as-described", label: "It was not as described" },
    ] },
    { id: "triggerDate", label: "Date that happened", type: "date", required: true, group: "The refund" },
    { id: "promised", label: "What you were told about timing", type: "text", group: "The refund", placeholder: "that it would be back within 10 working days" },
    { id: "paymentMethod", label: "How you paid", type: "text", group: "The refund", placeholder: "Visa card ending 4417" },
    { id: "deadlineDays", label: "Days you are giving them", type: "number", group: "What you want", placeholder: "14" },
    { id: "escalation", label: "What you will do if it does not arrive", type: "text", group: "What you want", placeholder: "raise a chargeback with my card issuer", help: "Only used in the firm version." },
  ],
  toneVariants: ["polite", "firm"],
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.contactName);
    const firm = ctx.tone === "firm";
    const when = formatDate(v.triggerDate, ctx.dateFormat);
    const days = Number(clean(v.deadlineDays));
    const deadline = Number.isFinite(days) && days > 0 ? addDays(ctx.today, days) : "";

    const because = {
      "cancelled-them": `you cancelled ${clean(v.item)} on ${when}`,
      "cancelled-me": `I cancelled ${clean(v.item)} on ${when}, within the window you allow`,
      returned: `I returned ${clean(v.item)} on ${when}`,
      "not-delivered": `${clean(v.item)} never arrived, and was due on ${when}`,
      "not-as-described": `${clean(v.item)} arrived on ${when} and was not what was described`,
    }[clean(v.trigger)] ?? "";

    return {
      sender: compact([clean(v.customerName), ...clean(v.customerAddress).split("\n")]),
      recipient: compact(clean(v.companyBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: has(v.orderRef)
        ? `Refund of ${clean(v.amount)}, order ${clean(v.orderRef)}`
        : `Refund of ${clean(v.amount)}`,
      salutation,
      body: compact([
        paragraph(
          sentence(`I am owed ${clean(v.amount)} because ${because}`),
          has(v.purchaseDate) &&
            sentence(
              `The original payment was made on ${formatDate(v.purchaseDate, ctx.dateFormat)}`,
              has(v.paymentMethod) && `by ${clean(v.paymentMethod)}`,
            ),
        ),
        has(v.promised)
          ? firm
            ? paragraph(
                sentence(`I was told ${clean(v.promised)}`),
                sentence("That has not happened and no one has explained why"),
              )
            : paragraph(
                sentence(`I was told ${clean(v.promised)}`),
                sentence("The money has not reached me yet, so I wanted to check where it is"),
              )
          : firm
            ? sentence("The money has not been returned and I have had no explanation")
            : sentence("The money has not reached me yet"),
        firm
          ? paragraph(
              deadline !== ""
                ? sentence(
                    `Please return ${clean(v.amount)} to the original payment method by ${formatDate(deadline, ctx.dateFormat)}`,
                  )
                : sentence(
                    `Please return ${clean(v.amount)} to the original payment method`,
                  ),
              has(v.escalation) &&
                sentence(`If it has not arrived by then I will ${clean(v.escalation)}`),
            )
          : paragraph(
              deadline !== ""
                ? sentence(
                    `Could the ${clean(v.amount)} be returned to the original payment method by ${formatDate(deadline, ctx.dateFormat)}`,
                  )
                : sentence(
                    `Could the ${clean(v.amount)} be returned to the original payment method`,
                  ),
              sentence("Do let me know if you need anything from me to release it"),
            ),
        firm
          ? sentence("A written confirmation that the refund has been issued would be helpful")
          : sentence("Thank you for sorting this out"),
      ]),
      valediction,
      signOff: compact([clean(v.customerName)]),
    };
  },
  faq: [
    { q: "How long does a company have to refund me?", a: "It depends where you are and what you bought. In much of Europe a trader has 14 days from accepting a cancellation. Rather than argue the law in the letter, name a date and say what you will do after it." },
    { q: "What if they keep saying it is processing?", a: "Ask for the date it was issued and the reference. A refund that has genuinely been sent has both, and your bank can trace it. One that has neither has not been sent." },
    { q: "Can my bank get the money back?", a: "Often, yes. Card payments can be disputed through chargeback, and in some countries larger purchases carry additional protection. Card issuers usually expect you to have asked the seller first." },
    { q: "Should I threaten legal action?", a: "Only if you mean it. Name a concrete next step you will actually take, such as a chargeback or an ombudsman, because an empty threat weakens everything else in the letter." },
  ],
  example: {
    customerName: "Owen Pritchard",
    customerAddress: "9 St Mary's Lane\nCardiff CF10 3RS",
    companyBlock: "Customer Services\nHarbourside Events Ltd\nPO Box 812, Cardiff",
    contactName: "",
    item: "two tickets to the Harbourside Festival",
    amount: "£164.00",
    orderRef: "HS-2026-44190",
    purchaseDate: "2026-04-02",
    trigger: "cancelled-them",
    triggerDate: "2026-06-18",
    promised: "in your cancellation email that refunds would be processed within 10 working days",
    paymentMethod: "Visa card ending 4417",
    deadlineDays: "14",
    escalation: "raise a chargeback with my card issuer",
  },
};

export const bankTransactionDispute: LetterType = {
  slug: "bank-transaction-dispute",
  title: "Bank transaction dispute letter",
  whoItsFor: "There is a charge on your account you did not make or recognise",
  seoNotes: [
    "Banks work from reference numbers and dates. A dispute that names the exact transaction, the amount and the date gets investigated; one that describes a strange charge last month does not.",
    "Report it as soon as you notice. Most protections depend on you raising it promptly, and some have hard deadlines.",
  ],
  fields: [
    { id: "customerName", label: "Your full name", type: "text", required: true, group: "About you" },
    { id: "customerAddress", label: "Your address", type: "textarea", rows: 3, group: "About you" },
    { id: "accountNumber", label: "Account number or last four digits", type: "text", required: true, group: "About you", help: "Never send full card numbers by email. The last four digits are enough to identify it." },
    { id: "bankBlock", label: "Your bank's address", type: "textarea", required: true, rows: 3, group: "About you" },
    { id: "contactName", label: "Named person, if you have one", type: "text", group: "About you" },
    { id: "merchant", label: "Name on the transaction", type: "text", required: true, group: "The transaction", placeholder: "NORDSTAR DIGITAL LTD" },
    { id: "amount", label: "Amount", type: "text", required: true, group: "The transaction", placeholder: "£89.99" },
    { id: "transactionDate", label: "Date it was taken", type: "date", required: true, group: "The transaction" },
    { id: "transactionRef", label: "Transaction reference", type: "text", group: "The transaction" },
    { id: "reason", label: "What is wrong with it", type: "select", required: true, group: "The transaction", options: [
      { value: "unrecognised", label: "I do not recognise it" },
      { value: "duplicate", label: "I was charged twice" },
      { value: "cancelled", label: "I cancelled this subscription" },
      { value: "wrong-amount", label: "The amount is wrong" },
      { value: "not-received", label: "I paid but never received anything" },
    ] },
    { id: "detail", label: "Anything else that matters", type: "textarea", rows: 3, group: "The transaction", help: "When you cancelled, where your card was, whether you still hold it." },
    { id: "cardStatus", label: "The card itself", type: "select", group: "The transaction", options: [
      { value: "held", label: "Still in my possession" },
      { value: "lost", label: "Lost or stolen" },
      { value: "cancelled", label: "Already cancelled by me" },
    ] },
    { id: "deadlineDays", label: "Days you are giving them", type: "number", group: "What you want", placeholder: "15" },
    { id: "escalation", label: "What you will do if unresolved", type: "text", group: "What you want", placeholder: "refer the complaint to the Financial Ombudsman Service", help: "Only used in the firm version." },
  ],
  toneVariants: ["polite", "firm"],
  build(v, ctx) {
    const { salutation, valediction } = addressing(v.contactName);
    const firm = ctx.tone === "firm";
    const when = formatDate(v.transactionDate, ctx.dateFormat);
    const days = Number(clean(v.deadlineDays));
    const deadline = Number.isFinite(days) && days > 0 ? addDays(ctx.today, days) : "";

    const problem = {
      unrecognised: "I did not authorise it and do not recognise the merchant",
      duplicate: "I was charged twice for the same purchase",
      cancelled: "I cancelled this subscription before the charge was taken",
      "wrong-amount": "the amount taken is not the amount I agreed",
      "not-received": "I paid for something that was never provided",
    }[clean(v.reason)] ?? "";

    const card = {
      held: "The card has not left my possession.",
      lost: "The card was lost or stolen, and I have reported that separately.",
      cancelled: "I have already cancelled the card.",
    }[clean(v.cardStatus)] ?? "";

    return {
      sender: compact([clean(v.customerName), ...clean(v.customerAddress).split("\n")]),
      recipient: compact(clean(v.bankBlock).split("\n")),
      date: formatDate(ctx.today, ctx.dateFormat),
      subject: `Disputed transaction of ${clean(v.amount)} on ${when}`,
      salutation,
      body: compact([
        paragraph(
          sentence(
            `A charge of ${clean(v.amount)} to ${clean(v.merchant)} was taken from my account on ${when}`,
            has(v.transactionRef) && `, reference ${clean(v.transactionRef)}`,
          ),
          sentence(`I am disputing it because ${problem}`),
        ),
        paragraph(has(v.detail) && sentence(clean(v.detail)), sentence(card)),
        firm
          ? paragraph(
              sentence(
                `Please reverse the charge and confirm in writing that you have done so`,
              ),
              deadline !== ""
                ? sentence(
                    `I expect your written response by ${formatDate(deadline, ctx.dateFormat)}`,
                  )
                : "",
              has(v.escalation) &&
                sentence(`If the matter is unresolved after that I will ${clean(v.escalation)}`),
            )
          : paragraph(
              sentence(
                "Please look into it and let me know what you find",
              ),
              deadline !== ""
                ? sentence(
                    `If you could come back to me by ${formatDate(deadline, ctx.dateFormat)} I would be grateful`,
                  )
                : "",
              sentence("I am happy to provide anything that helps the investigation"),
            ),
        firm
          ? sentence(
              "I have not authorised any further payments to this merchant and ask that they be blocked",
            )
          : "",
      ]),
      valediction,
      signOff: compact([
        clean(v.customerName),
        `Account ${clean(v.accountNumber)}`,
      ]),
    };
  },
  faq: [
    { q: "How quickly should I report an unrecognised charge?", a: "As soon as you see it. Protections for unauthorised transactions generally depend on prompt reporting, and some schemes set hard time limits measured from the statement date." },
    { q: "Is it safe to put my account number in a letter?", a: "Use the last four digits, or the account number for a current account. Never send a full card number and never send the security code. No bank needs either to investigate." },
    { q: "What is the difference between a dispute and a chargeback?", a: "A dispute is you telling the bank something is wrong. A chargeback is the mechanism the bank may use to claw the money back from the merchant's bank. You raise the first; the bank decides on the second." },
    { q: "Should I cancel the card?", a: "If the charge was unauthorised, yes, and say so in the letter. If it is a billing dispute with a merchant you do know, cancelling the card does not cancel the underlying agreement." },
    { q: "What if the bank rejects my dispute?", a: "Ask for the decision and the reason in writing, then take it to the relevant ombudsman or regulator. The written record is what makes that possible." },
  ],
  example: {
    customerName: "Ines Duarte",
    customerAddress: "Rua do Alecrim 44\n1200-018 Lisbon\nPortugal",
    accountNumber: "ending 8842",
    bankBlock: "Disputes Department\nBanco Atlântico\nAv. da Liberdade 210, Lisbon",
    contactName: "",
    merchant: "NORDSTAR DIGITAL LTD",
    amount: "EUR 89.99",
    transactionDate: "2026-08-03",
    transactionRef: "TX-99401882",
    reason: "cancelled",
    detail: "I cancelled this subscription on 11 May and received an email confirming the cancellation, which I have kept. No service has been provided since that date.",
    cardStatus: "held",
    deadlineDays: "15",
    escalation: "refer the complaint to the Banco de Portugal customer ombudsman",
  },
};

export const consumerLetters = [
  complaintProductService,
  refundRequest,
  bankTransactionDispute,
];
