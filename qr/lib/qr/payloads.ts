/**
 * Turning what someone typed into the exact string a scanner expects.
 *
 * This is where the bugs in QR tools actually are. The encoder is a solved
 * problem — every library gets the modules right — but a Wi-Fi password
 * containing a semicolon, or a surname containing a comma, will silently
 * produce a code that scans cleanly and joins the wrong network or saves a
 * mangled contact. The formats each have their own escaping rules and none of
 * them are optional.
 *
 * Every function here is pure and returns the payload string, so the tests can
 * assert on the exact bytes that will be encoded.
 */

export type QrKind = "url" | "text" | "wifi" | "vcard" | "whatsapp";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = <T,>(error: string): Result<T> => ({ ok: false, error });

// ---------------------------------------------------------------------------
// Link
// ---------------------------------------------------------------------------

/**
 * A web address, with the scheme filled in when it was left off.
 *
 * People type "example.com". A QR code containing exactly that is not a link —
 * most scanners will offer it as a search, some will do nothing. Assuming
 * https is the useful default, and it is stated in the UI rather than done
 * behind the user's back.
 */
export function buildUrl(input: string): Result<string> {
  const raw = input.trim();
  if (raw === "") return fail("Type or paste a web address.");

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return fail("That does not look like a web address.");
  }

  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    // A hostname with no dot is almost always a typo rather than an intranet
    // name, and a QR code that goes nowhere is worse than an error message.
    if (!parsed.hostname.includes(".")) {
      return fail("That address is missing a domain, like .com or .org.");
    }
  }

  return ok(parsed.toString());
}

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

export function buildText(input: string): Result<string> {
  // Deliberately not trimmed beyond the ends: someone encoding a serial number
  // or a short note gets exactly what they typed.
  const value = input.replace(/^\s+|\s+$/g, "");
  if (value === "") return fail("Type the text you want in the code.");
  return ok(value);
}

// ---------------------------------------------------------------------------
// Wi-Fi
// ---------------------------------------------------------------------------

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type WifiInput = {
  ssid: string;
  password: string;
  security: WifiSecurity;
  /** A network that does not broadcast its name. */
  hidden: boolean;
};

/**
 * Escape a value for the WIFI: format.
 *
 * The separators are `;` and `:`, so both have to be escaped, along with the
 * escape character itself and the comma. This is the whole reason a password
 * like `pa;ss` fails on tools that skip it: the scanner reads the password as
 * `pa` and treats `ss` as a stray field.
 *
 * The backslash must be replaced first, or the backslashes introduced by the
 * later replacements would themselves be escaped.
 */
function escapeWifi(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:")
    .replace(/"/g, '\\"');
}

export function buildWifi(input: WifiInput): Result<string> {
  const ssid = input.ssid.trim();
  if (ssid === "") return fail("Type the network name.");

  if (input.security !== "nopass" && input.password === "") {
    return fail("Type the password, or set the network to open.");
  }

  const parts = [`T:${input.security}`, `S:${escapeWifi(ssid)}`];
  if (input.security !== "nopass") {
    parts.push(`P:${escapeWifi(input.password)}`);
  }
  if (input.hidden) parts.push("H:true");

  // The trailing `;;` is part of the format: one to close the last field and
  // one to close the record.
  return ok(`WIFI:${parts.join(";")};;`);
}

// ---------------------------------------------------------------------------
// Contact card
// ---------------------------------------------------------------------------

export type VCardInput = {
  firstName: string;
  lastName: string;
  organisation: string;
  title: string;
  phone: string;
  email: string;
  url: string;
};

/**
 * Escape a value for a vCard property.
 *
 * Commas and semicolons separate the components of structured fields like N,
 * so a surname of "Smith, Jr" would otherwise turn into two name parts.
 * Newlines become the literal two characters backslash-n, which is how vCard
 * carries a line break inside a value.
 */
function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

export function buildVCard(input: VCardInput): Result<string> {
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (first === "" && last === "") return fail("Type at least a first or last name.");

  const full = [first, last].filter(Boolean).join(" ");

  const lines = [
    "BEGIN:VCARD",
    // 3.0 rather than 4.0: it is what phone address books actually import
    // without complaint, and nothing here needs a 4.0 property.
    "VERSION:3.0",
    `N:${escapeVCard(last)};${escapeVCard(first)};;;`,
    `FN:${escapeVCard(full)}`,
  ];

  if (input.organisation.trim()) lines.push(`ORG:${escapeVCard(input.organisation.trim())}`);
  if (input.title.trim()) lines.push(`TITLE:${escapeVCard(input.title.trim())}`);
  if (input.phone.trim()) lines.push(`TEL;TYPE=CELL:${escapeVCard(input.phone.trim())}`);
  if (input.email.trim()) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(input.email.trim())}`);

  if (input.url.trim()) {
    const url = buildUrl(input.url);
    if (!url.ok) return fail("The website address is not valid.");
    // A URL is not escaped: its own syntax uses the same characters, and
    // escaping them would break the link rather than protect it.
    lines.push(`URL:${url.value}`);
  }

  lines.push("END:VCARD");

  // CRLF is what the spec says, and some Android importers are strict about it.
  return ok(lines.join("\r\n"));
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

export type WhatsAppInput = { phone: string; message: string };

/**
 * A wa.me link, which opens a chat with a number.
 *
 * wa.me wants digits only, in full international form with no plus, no spaces
 * and no dashes. Handing it a prettily formatted number is the usual reason
 * one of these codes opens WhatsApp to nothing.
 */
export function buildWhatsApp(input: WhatsAppInput): Result<string> {
  const digits = input.phone.replace(/[\s()+.-]/g, "");

  if (digits === "") return fail("Type the phone number, including the country code.");
  if (!/^[0-9]+$/.test(digits)) {
    return fail("A phone number can only contain digits, spaces, brackets, + and -.");
  }
  if (digits.startsWith("0")) {
    return fail("Start with the country code rather than a 0 — 44 rather than 044.");
  }
  if (digits.length < 8 || digits.length > 15) {
    return fail("That is not a full international number. Include the country code.");
  }

  const base = `https://wa.me/${digits}`;
  const message = input.message.trim();
  if (message === "") return ok(base);

  return ok(`${base}?text=${encodeURIComponent(message)}`);
}
