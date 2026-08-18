/**
 * The letter document model and the helpers templates are built from.
 *
 * A letter is a structure, not a string. The same document is rendered four
 * ways — the on-screen A4 preview, the plain text you copy, the PDF and the
 * DOCX — and every one of them needs the blocks kept apart. Producing a string
 * anywhere in the templates would mean re-parsing it later.
 *
 * Everything here is pure, so the conditional logic that decides whether a
 * sentence exists at all is testable without a browser.
 */

export type Tone = "polite" | "firm";

export type DateFormat = "long-day-first" | "long-month-first" | "iso";

export type LetterDoc = {
  /** Sender's name and address, one line each. Printed top right. */
  sender: string[];
  /** Recipient's name, role and address. Printed left, below the sender. */
  recipient: string[];
  date: string;
  /** Conventional on formal letters, omitted where it would look odd. */
  subject?: string;
  salutation: string;
  body: string[];
  valediction: string;
  /** Name, then anything that belongs under it: job title, membership number. */
  signOff: string[];
  enclosures?: string[];
};

export type FieldType = "text" | "textarea" | "date" | "select" | "number" | "checkbox";

export type Field = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Written for someone who has never sent a formal letter before. */
  help?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  /** Fields sharing a group are shown together under that heading. */
  group?: string;
  rows?: number;
};

export type Faq = { q: string; a: string };

export type BuildContext = {
  tone: Tone;
  dateFormat: DateFormat;
  /** ISO date the letter is dated. Passed in so builds stay deterministic. */
  today: string;
};

export type Values = Record<string, string>;

export type LetterType = {
  slug: string;
  title: string;
  /** One line: who reaches for this letter. */
  whoItsFor: string;
  /** Shown as the intro paragraph on the letter's own page. */
  seoNotes: string[];
  fields: Field[];
  /** null where a tone toggle would make no sense, such as a school absence. */
  toneVariants: Tone[] | null;
  build(values: Values, ctx: BuildContext): LetterDoc;
  faq: Faq[];
  /**
   * A complete, realistic set of answers. It fills the worked example printed
   * on the page for search engines, and doubles as the fixture every template
   * test runs against. Names are invented.
   */
  example: Values;
};

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Drop anything empty. The reason letters never show a stray comma or blank. */
export function compact(items: Array<string | false | null | undefined>): string[] {
  return items.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

/** True when a field was actually answered. */
export function has(value: string | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

export function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

/**
 * Join sentence fragments, dropping the empty ones, and close with a full stop.
 * Templates use this so an unanswered optional field removes its clause rather
 * than leaving a gap.
 */
export function sentence(...parts: Array<string | false | null | undefined>): string {
  const kept = compact(parts).map((part) => part.trim());
  if (kept.length === 0) return "";

  let text = "";
  for (const part of kept) {
    if (text === "") {
      text = part;
    } else if (/^[,;:.]/.test(part)) {
      // A fragment that opens with punctuation attaches directly. Templates
      // write optional clauses as ", covering X" so they vanish cleanly when
      // unanswered; joining on a space would leave "the programme , covering".
      text += part;
    } else {
      text += ` ${part}`;
    }
  }

  text = text.replace(/\s+/g, " ").trim();
  if (text === "") return "";
  return /[.?!]$/.test(text) ? text : `${text}.`;
}

/** Assemble a paragraph from sentences, skipping the ones that did not apply. */
export function paragraph(...sentences: Array<string | false | null | undefined>): string {
  return compact(sentences).join(" ").trim();
}

/** "a", "a and b", "a, b and c" — the serial comma left out, British style. */
export function list(items: Array<string | false | null | undefined>): string {
  const parts = compact(items);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Salutation and valediction
// ---------------------------------------------------------------------------

/**
 * British convention, which is what most of the world's formal correspondence
 * follows and what visa offices expect: a named recipient closes "Yours
 * sincerely", an unnamed one closes "Yours faithfully". Getting this pair wrong
 * is the most common tell that a letter was not written by someone used to
 * writing them.
 */
export function addressing(recipientName?: string): {
  salutation: string;
  valediction: string;
} {
  const name = clean(recipientName);
  if (name === "") {
    return { salutation: "Dear Sir or Madam", valediction: "Yours faithfully" };
  }
  return { salutation: `Dear ${name}`, valediction: "Yours sincerely" };
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse an ISO date without letting the local timezone shift the day. */
function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(clean(iso));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/**
 * Long form by default: "17 August 2026". Day-first is the majority convention
 * and is unambiguous in a way that 08/17/2026 is not, so nobody has to guess
 * whether a date is August or May.
 */
export function formatDate(iso: string, format: DateFormat = "long-day-first"): string {
  const parts = parseIso(iso);
  if (!parts) return "";
  const { y, m, d } = parts;
  if (format === "iso") return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (format === "long-month-first") return `${MONTHS[m - 1]} ${d}, ${y}`;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Add days to an ISO date, returning ISO. Used for notice periods. */
export function addDays(iso: string, days: number): string {
  const parts = parseIso(iso);
  if (!parts) return "";
  const date = new Date(Date.UTC(parts.y, parts.m - 1, parts.d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Whole months, clamped to the end of a shorter month (31 Jan + 1 = 28 Feb). */
export function addMonths(iso: string, months: number): string {
  const parts = parseIso(iso);
  if (!parts) return "";
  const target = new Date(Date.UTC(parts.y, parts.m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(parts.d, lastDay));
  return target.toISOString().slice(0, 10);
}

/** "3 nights", "1 night" — small thing, but "1 nights" reads as a machine. */
export function plural(count: number, singular: string, pluralForm?: string): string {
  const word = count === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${count} ${word}`;
}

/** Inclusive night count between two ISO dates, or null if either is missing. */
export function nightsBetween(from: string, to: string): number | null {
  const a = parseIso(from);
  const b = parseIso(to);
  if (!a || !b) return null;
  const start = Date.UTC(a.y, a.m - 1, a.d);
  const end = Date.UTC(b.y, b.m - 1, b.d);
  const nights = Math.round((end - start) / 86_400_000);
  return nights > 0 ? nights : null;
}
