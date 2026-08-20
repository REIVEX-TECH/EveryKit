/**
 * Citations in APA 7 and MLA 9, from fields you type.
 *
 * What this does and does not claim, stated here and on the page: it formats
 * what you give it. It does not look anything up, it does not resolve a DOI,
 * and it cannot tell you whether the author's name is spelled right or whether
 * the source exists. Formatting is a mechanical problem and this solves it;
 * verification is a different problem and pretending to solve it would be
 * worse than not offering it.
 *
 * A citation is built as segments rather than as a string, because the italics
 * are part of being correct. A plain string cannot carry them, and rendering
 * italics by wrapping words in asterisks is a markdown convention, not a
 * citation style. The segments render to HTML for the page and for a rich text
 * copy, and flatten to plain text for the other one.
 */

export type Style = "apa" | "mla";

export type Segment = { text: string; italic?: boolean };

export type Fields = {
  /** One per line, either "Last, First" or "First Last". */
  authors: string;
  title: string;
  /** The container: a journal, a website, a publisher. */
  source: string;
  year: string;
  url: string;
  /** ISO date, from a date input. */
  accessed: string;
};

export const EMPTY_FIELDS: Fields = {
  authors: "",
  title: "",
  source: "",
  year: "",
  url: "",
  accessed: "",
};

type Name = { last: string; first: string; middle: string };

/**
 * Split one typed name into parts.
 *
 * Both orders are accepted because both are typed. A comma means the author
 * wrote it surname first; without one, the last word is the surname. That is
 * wrong for a few naming traditions, and the page says as much rather than
 * quietly mangling somebody's name.
 */
export function parseName(raw: string): Name | null {
  const text = raw.trim().replace(/\s+/g, " ");
  if (text === "") return null;

  if (text.includes(",")) {
    const [last, rest = ""] = text.split(",");
    const given = rest.trim().split(" ").filter(Boolean);
    return { last: last.trim(), first: given[0] ?? "", middle: given.slice(1).join(" ") };
  }

  const parts = text.split(" ");
  if (parts.length === 1) return { last: parts[0], first: "", middle: "" };
  return {
    last: parts[parts.length - 1],
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
  };
}

export function parseAuthors(raw: string): Name[] {
  return raw
    .split(/[\n;]+/)
    .map(parseName)
    .filter((name): name is Name => name !== null);
}

/** "Ahmed" plus "Sara" becomes "S." Initials carry a full stop, per both styles. */
function initials(name: Name): string {
  const bits = [name.first, ...name.middle.split(" ")]
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`);
  return bits.join(" ");
}

/**
 * APA 7 author list.
 *
 * Surname then initials, an ampersand before the last, and a comma before the
 * ampersand even with two authors, which is the part everybody gets wrong. From
 * twenty-one authors APA lists the first nineteen, then an ellipsis, then the
 * final one.
 */
export function apaAuthors(names: Name[]): string {
  if (names.length === 0) return "";
  const formatted = names.map((name) => {
    const given = initials(name);
    return given ? `${name.last}, ${given}` : name.last;
  });

  if (formatted.length === 1) return formatted[0];
  if (formatted.length <= 20) {
    return `${formatted.slice(0, -1).join(", ")}, & ${formatted[formatted.length - 1]}`;
  }
  return `${formatted.slice(0, 19).join(", ")}, ... ${formatted[formatted.length - 1]}`;
}

/**
 * MLA 9 author list.
 *
 * First author surname first, a second author in normal order after "and", and
 * three or more collapsed to the first plus "et al." That last rule is MLA 9;
 * MLA 8 and earlier listed all of them.
 */
export function mlaAuthors(names: Name[]): string {
  if (names.length === 0) return "";

  const inverted = (name: Name) => {
    const given = [name.first, name.middle].filter(Boolean).join(" ");
    return given ? `${name.last}, ${given}` : name.last;
  };
  const normal = (name: Name) => [name.first, name.middle, name.last].filter(Boolean).join(" ");

  if (names.length === 1) return inverted(names[0]);
  if (names.length === 2) return `${inverted(names[0])}, and ${normal(names[1])}`;
  return `${inverted(names[0])}, et al.`;
}

const MLA_MONTHS = [
  "Jan.", "Feb.", "Mar.", "Apr.", "May", "June",
  "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
];

const APA_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** An ISO date as MLA writes it: 5 Aug. 2026. */
export function mlaDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  const [, y, m, d] = match;
  return `${Number(d)} ${MLA_MONTHS[Number(m) - 1]} ${y}`;
}

/** An ISO date as APA writes it: August 5, 2026. */
export function apaDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  const [, y, m, d] = match;
  return `${APA_MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

/** A sentence ends in exactly one full stop, whatever the field already had. */
function endStop(text: string): string {
  const trimmed = text.trim();
  if (trimmed === "") return "";
  return /[.?!]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function clean(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * APA 7.
 *
 * Author, A. A. (Year). Title in sentence case. *Source*. URL
 *
 * The title is italic when there is no separate container and upright when
 * there is, because in APA the italics mark the larger work: a standalone
 * report is italic, an article inside a journal is not and the journal is.
 */
export function apa(fields: Fields): Segment[] {
  const names = parseAuthors(fields.authors);
  const out: Segment[] = [];

  const authors = apaAuthors(names);
  if (authors) out.push({ text: `${endStop(authors)} ` });

  const year = clean(fields.year);
  out.push({ text: year ? `(${year}). ` : "(n.d.). " });

  const title = clean(fields.title);
  const source = clean(fields.source);

  if (title) {
    if (source) out.push({ text: `${endStop(title)} ` });
    else out.push({ text: endStop(title), italic: true }, { text: " " });
  }

  if (source) out.push({ text: source, italic: true }, { text: ". " });

  const accessed = apaDate(fields.accessed);
  const url = clean(fields.url);
  if (url) {
    // APA 7 asks for a retrieval date only where the content is expected to
    // change. Given one, it is included; not given one, it is left out rather
    // than invented.
    if (accessed) out.push({ text: `Retrieved ${accessed}, from ${url}` });
    else out.push({ text: url });
  }

  return tidy(out);
}

/**
 * MLA 9.
 *
 * Author Last, First. "Title." *Container*, Year, URL. Accessed 5 Aug. 2026.
 */
export function mla(fields: Fields): Segment[] {
  const names = parseAuthors(fields.authors);
  const out: Segment[] = [];

  const authors = mlaAuthors(names);
  if (authors) out.push({ text: `${endStop(authors)} ` });

  const title = clean(fields.title);
  const source = clean(fields.source);

  if (title) {
    if (source) {
      // The full stop goes inside the quotation marks, which is the MLA rule
      // and the one most people write the other way round.
      out.push({ text: `“${title.replace(/[.]$/, "")}.” ` });
    } else {
      out.push({ text: title.replace(/[.]$/, ""), italic: true }, { text: ". " });
    }
  }

  if (source) out.push({ text: source, italic: true }, { text: ", " });

  const year = clean(fields.year);
  if (year) out.push({ text: `${year}, ` });

  const url = clean(fields.url);
  if (url) out.push({ text: `${url}. ` });

  const accessed = mlaDate(fields.accessed);
  if (accessed) out.push({ text: `Accessed ${accessed}.` });

  return tidy(out);
}

/**
 * Join the loose ends a half-filled form leaves.
 *
 * Missing fields leave stray commas and doubled spaces, and a citation with ", ."
 * in the middle of it looks broken in a way that makes a student distrust the
 * whole thing.
 */
function tidy(segments: Segment[]): Segment[] {
  const merged: Segment[] = [];
  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (previous && !!previous.italic === !!segment.italic) previous.text += segment.text;
    else merged.push({ ...segment });
  }

  return merged
    .map((segment) => ({
      ...segment,
      text: segment.text.replace(/\s+/g, " ").replace(/,\s*([,.])/g, "$1").replace(/\.\s*\./g, "."),
    }))
    .filter((segment) => segment.text !== "")
    .map((segment, index, all) =>
      index === all.length - 1 ? { ...segment, text: segment.text.replace(/[\s,]+$/, "") } : segment,
    );
}

export function build(fields: Fields, style: Style): Segment[] {
  return style === "apa" ? apa(fields) : mla(fields);
}

/** The citation as plain text, for a plain paste. */
export function toPlainText(segments: Segment[]): string {
  return segments.map((segment) => segment.text).join("").trim();
}

/** The same, with the italics kept, for a paste into a word processor. */
export function toHtml(segments: Segment[]): string {
  const escape = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return segments
    .map((segment) => (segment.italic ? `<i>${escape(segment.text)}</i>` : escape(segment.text)))
    .join("")
    .trim();
}
