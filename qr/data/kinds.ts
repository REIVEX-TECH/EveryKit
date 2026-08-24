/**
 * The eight kinds of QR code this kit makes. One entry per route, and the
 * single source for the landing tiles, the routes themselves, their sitemap
 * entries and their SEO pages.
 */

import type { QrKind } from "@/lib/qr/payloads";

export type Faq = { q: string; a: string };

export type Kind = {
  slug: QrKind;
  title: string;
  /** One line, on the tile. */
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  faq: Faq[];
};

/** The two answers every page needs, in the order people ask them. */
const SHARED_FAQ: Faq[] = [
  {
    q: "Do the codes expire?",
    a: "No. The code contains your information directly. There is no short link in the middle that could stop working, no account behind it, and nothing to renew. A code made here works in ten years exactly as it does today, because nothing has to still be running for it to.",
  },
  {
    q: "Is anything I type sent anywhere?",
    a: "No. The code is drawn in your browser as you type. Nothing is uploaded, there is no server here that could receive it, and the picture you download is generated on your own device. You can check with your browser's network tab: no request carries what you entered.",
  },
];

export const kinds: Kind[] = [
  {
    slug: "url",
    title: "Link",
    blurb: "Point a phone camera at a web address",
    seoTitle: "QR code generator for a link, with no expiry and no account",
    description:
      "Make a QR code for any web address. Free, permanent, no account, and nothing you type is uploaded.",
    intro: [
      "Paste a web address and the code appears as you type. Point a camera at it and the phone offers the link.",
      "This is a plain QR code with the address inside it. It is not a short link that points at us, so there is nothing that can expire, break, or start counting your visitors.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "Do I need to type https://?", a: "No. If you leave the scheme off, https is added for you, and the finished address is shown under the code so you can see exactly what was encoded." },
      { q: "Can I edit it later?", a: "Not this code, no. The address is inside the picture, so changing where it points means making a new one. That is the trade for a code that never expires." },
      { q: "Can one code open two links?", a: "No. A QR code holds one target, and that is the whole of it: a camera finds exactly one thing to open. Two destinations need a page in the middle that offers the choice, which means a server and a link that can stop working, the opposite of what these codes are. If the goal is to share several things at once, a contact card carries a phone number, an email and a website together, and a calendar event carries a title, a time and a place. Pick the one that holds what you actually need." },
      { q: "Which size should I download?", a: "The SVG for anything printed, because it stays sharp at any size. The PNG for anything on a screen." },
    ],
  },
  {
    slug: "text",
    title: "Text",
    blurb: "Any words, shown when scanned",
    seoTitle: "Text QR code generator, free, and it works offline once made",
    description:
      "Put plain text in a QR code: a note, a serial number, a code. Made in your browser and never uploaded.",
    intro: [
      "Anything you type here goes into the code as plain text. A scanner shows the words rather than opening anything.",
      "Useful for a serial number on a piece of equipment, an instruction on a label, or a note that has to survive without a network.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "How much text fits?", a: "Around 1,800 characters at the default settings, but long text makes a dense code that needs a better camera and a bigger print. If it is more than a couple of sentences, a link to the text usually scans more reliably than the text itself." },
      { q: "Do accents and other alphabets work?", a: "Yes. The text is encoded as UTF-8, so accents, Arabic, Chinese and emoji all survive the round trip." },
    ],
  },
  {
    slug: "wifi",
    title: "Wi-Fi",
    blurb: "Join a network without reading out the password",
    seoTitle: "Wi-Fi QR code generator, so guests join by scanning",
    description:
      "Make a QR code that connects a phone to your Wi-Fi. Handles passwords with punctuation correctly. Nothing is uploaded.",
    intro: [
      "Print this and guests join the network by pointing a camera at it, instead of you spelling out a password across a room.",
      "Your password is not sent anywhere. It goes into the picture on this device, and the picture is yours.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "Does it work on iPhone and Android?", a: "Yes. Both have read this format in the camera app for years. On iPhone the prompt appears at the top of the screen; on Android it usually appears as a notification or straight in the camera view." },
      { q: "My password has punctuation in it. Is that a problem?", a: "Not here. Semicolons, colons, commas, quotes and backslashes all have to be escaped in this format, and skipping that is the most common bug in Wi-Fi QR tools: the code scans, then the phone tries to join with only the first part of the password. This escapes all of them, and there are tests that decode the finished code to confirm the password survives." },
      { q: "Should I pick WPA or WEP?", a: "WPA, unless the network is genuinely old. WPA covers WPA, WPA2 and WPA3. WEP is only for equipment from before about 2006." },
      { q: "What does hidden mean?", a: "Tick it if the network does not appear in the list of nearby networks. Ticking it for a normal network can stop the code from working, so leave it off unless you know it applies." },
    ],
  },
  {
    slug: "email",
    title: "Email",
    blurb: "Open a new message, ready to send",
    seoTitle: "Email QR code generator, with the subject and message ready",
    description:
      "Make a QR code that opens a new email to you, with the subject and message already filled in. Nothing is uploaded.",
    intro: [
      "Scanning this opens a new email to the address you give, with the subject and body already typed. Good on a poster, a flyer, or a support sign.",
      "It is an ordinary mailto link inside the code, so it works with whatever email app the phone already uses.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "Can I set the subject and the message?", a: "Yes, and both are optional. They are encoded so that punctuation is safe: an ampersand in the subject, which would otherwise break the link, is handled correctly." },
      { q: "Does it send the email automatically?", a: "No, and it should not. It opens a new message with the fields filled in, and the person chooses to send it. A code that sent mail on its own would be a gift to spammers." },
      { q: "Which email app does it use?", a: "Whichever one the phone is set up with. The code does not choose; it hands the phone a standard mailto link and the phone opens its default." },
    ],
  },
  {
    slug: "sms",
    title: "Text message",
    blurb: "Start a text, optionally with a message ready",
    seoTitle: "SMS QR code generator, so people text you by scanning",
    description:
      "Make a QR code that opens a new text message to your number, with an optional message ready to send. Made in your browser.",
    intro: [
      "Scanning this starts a text to your number, with the message you set already typed in. Useful for a shortcode sign-up, a feedback line, or an order-by-text poster.",
      "It uses the SMSTO format, which is the one phone cameras actually recognise, rather than a link that only some of them understand.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "Can I set the message?", a: "Yes, and it is optional. The number and the message are kept apart correctly, so a colon in your message does not confuse the phone." },
      { q: "How should I write the number?", a: "However your recipients would dial it. For a code aimed at another country, use the full international number so it works from anywhere." },
      { q: "Does it send the text on its own?", a: "No. It opens the message ready to send, and the person taps send. That is deliberate." },
    ],
  },
  {
    slug: "event",
    title: "Calendar event",
    blurb: "Add an event to a phone's calendar",
    seoTitle: "Calendar event QR code generator, add to calendar by scanning",
    description:
      "Make a QR code that adds an event to a phone's calendar: the name, time, and place. Made in your browser and never uploaded.",
    intro: [
      "Scanning this offers to add the event to the calendar, with the name, time and place already set. Good on an invitation, a poster, or a save-the-date.",
      "The time is stored as a plain local time, so 3pm means 3pm wherever the person scanning is, rather than shifting for their timezone.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "Does it work with any calendar?", a: "It uses the standard iCalendar format that Apple, Google and Outlook calendars all read. On most phones, scanning offers to add the event straight away." },
      { q: "Can I make it an all-day event?", a: "Yes. Leave the start time blank and it becomes an all-day event on the date you pick. Fill the time in for an event with a start and an end." },
      { q: "Which timezone is it in?", a: "None in particular, on purpose. The time is stored as a floating local time, so an event at 3pm shows as 3pm on the calendar of whoever scans it. That is what you want for a physical event people attend in person." },
      { q: "Why is the code fairly dense?", a: "An event carries more than a link: a name, two times, and often a place and a note. Keep the description short and the code stays quick to scan." },
    ],
  },
  {
    slug: "vcard",
    title: "Contact card",
    blurb: "Save your details to someone's phone",
    seoTitle: "vCard QR code generator, so people save your details by scanning",
    description:
      "Put your name, number and email in a QR code that saves straight to a phone's contacts. Made in your browser.",
    intro: [
      "Scanning this offers to save you as a contact, with whichever fields you fill in. Good on a business card, a name badge, or an email signature.",
      "Leave anything blank and it is left out of the card entirely, rather than saved as an empty field.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "Which fields should I fill in?", a: "A name and one way to reach you is enough. Every extra field makes the code denser and harder to scan from a distance, so it is worth leaving out what you do not need." },
      { q: "My name has a comma or an apostrophe in it", a: "That is handled. Commas and semicolons separate the parts of a name in this format, so a surname like \"Smith, Jr\" has to be escaped or it arrives as two separate name parts. The tests decode a finished card to check it comes back whole." },
      { q: "Why is my code so dense?", a: "Contact cards carry more data than a link, so they produce a bigger grid. If it is hard to scan, remove a field or two, or print it larger." },
    ],
  },
  {
    slug: "whatsapp",
    title: "WhatsApp",
    blurb: "Open a chat, optionally with a message ready",
    seoTitle: "WhatsApp QR code generator, so people open a chat by scanning",
    description:
      "Make a QR code that opens a WhatsApp chat with your number, with an optional message already typed. Nothing is uploaded.",
    intro: [
      "Scanning this opens WhatsApp on your number, with the message you set already in the box, ready to send.",
      "The number has to be in full international form. That is the usual reason one of these opens WhatsApp to nothing, so it is checked before the code is drawn.",
    ],
    faq: [
      ...SHARED_FAQ,
      { q: "How do I write the number?", a: "Country code first, then the number without the leading zero. A London number written 020 7946 0000 becomes 44 20 7946 0000. Spaces, brackets, + and dashes are fine, because they are stripped for you." },
      { q: "Does the person need to have my number saved?", a: "No. That is the point of it: scanning opens a chat with you whether or not they have you in their contacts." },
      { q: "Is this the same as WhatsApp's own code?", a: "No. WhatsApp's in-app code is tied to your account and changes when you reset it. This one is an ordinary link to your number, so it keeps working and can be printed." },
    ],
  },
];

const bySlug = new Map(kinds.map((kind) => [kind.slug, kind]));

export function getKind(slug: string): Kind | undefined {
  return bySlug.get(slug as QrKind);
}
