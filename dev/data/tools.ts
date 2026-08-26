/**
 * The thirteen developer tools. One entry per route, and the single source for the
 * launcher on the home page, the tool switcher and every SEO page.
 */

export type ToolSlug =
  | "json"
  | "base64"
  | "url"
  | "uuid"
  | "hash"
  | "jwt"
  | "regex"
  | "diff"
  | "timestamp"
  | "cron"
  | "color"
  | "markdown"
  | "json-to-csv"
  | "convert-data";

export type Faq = { q: string; a: string };

/**
 * The shelf a tool sits on. The landing groups by these so fourteen tools read
 * as four short, labelled sets rather than one grid, which is easier to scan.
 * The order here is the order the sections appear.
 */
export type Category = "data" | "encode" | "text" | "time";

export const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: "data", label: "Data and formats" },
  { id: "encode", label: "Encode and decode" },
  { id: "text", label: "Text" },
  { id: "time", label: "Time and IDs" },
];

export type Tool = {
  slug: ToolSlug;
  title: string;
  /** One line, on the tile and in the switcher. */
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  faq: Faq[];
  category: Category;
};

/** The answer every one of these pages needs first. */
const PRIVACY: Faq = {
  q: "Is what I paste sent anywhere?",
  a: "No. Every tool in this kit runs in the page itself. There is no server here that receives what you paste, and you can check it in your browser's network tab: using a tool produces no request carrying your input at all.",
};

export const tools: Tool[] = [
  {
    slug: "json",
    category: "data",
    title: "JSON formatter",
    blurb: "Format, minify and validate",
    seoTitle: "JSON formatter and validator, with the error line and column",
    description:
      "Format, minify and validate JSON in your browser. Invalid input gets the line and column of the problem, not a character offset. Handles multi-megabyte documents.",
    intro: [
      "Paste JSON and format it, shrink it, or just check it. Nothing is uploaded.",
      "When it does not parse, you get the line and the column with the offending character marked, which is the part most formatters leave you to work out.",
    ],
    faq: [
      PRIVACY,
      {
        q: "How large a document can it take?",
        a: "Five megabytes is comfortable and larger works. The parsing runs in a worker thread rather than in the page, so the tab stays responsive while it happens instead of freezing and looking crashed.",
      },
      {
        q: "Why a line and column rather than the position the browser reports?",
        a: "Because a character offset of 41,206 tells you nothing about where to look. The offset is converted to a line and a column and the line itself is quoted back with a caret under the character, the way a compiler does it.",
      },
      {
        q: "Does formatting change my data?",
        a: "Only its whitespace. The document is parsed and written back out, so key order is preserved and values are untouched. One thing to know: JSON has no comments and no trailing commas, so a file with either is not JSON and will be reported as invalid rather than silently repaired.",
      },
      {
        q: "Are very large numbers safe?",
        a: "Not entirely, and that is JSON's problem rather than this tool's. JavaScript numbers lose precision above about 9 quadrillion, so an integer larger than that comes back rounded. If your document carries large ids, keep them as strings.",
      },
    ],
  },
  {
    slug: "base64",
    category: "encode",
    title: "Base64 encoder",
    blurb: "Encode and decode, text or file",
    seoTitle: "Base64 encode and decode, UTF-8 correct, files too",
    description:
      "Encode and decode base64 in your browser, for text or for a file. Correct for emoji, Urdu, Arabic and every other script, both directions.",
    intro: [
      "Text or a file, in either direction. The file side hands back a download rather than printing bytes at you.",
      "Text goes through a real UTF-8 encoder, so an emoji or a line of Urdu survives the round trip exactly. The workaround most answers online suggest does not.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Why do other base64 tools mangle emoji?",
        a: "Because the browser's built-in btoa works on bytes, and a JavaScript string is not bytes. Passing it anything outside Latin-1 either throws or, with the usual workaround, silently produces the wrong bytes. Here the text is run through a UTF-8 encoder first, which is what makes a round trip exact.",
      },
      {
        q: "Can it read base64 that is wrapped across lines?",
        a: "Yes. Line breaks and spaces are ignored, missing padding is added, and the URL-safe alphabet that uses minus and underscore is accepted too, since that is the form JWT parts arrive in.",
      },
      {
        q: "Why does decoding my file give a download instead of text?",
        a: "Because the bytes of a PNG are not text. Showing them would fill the screen with replacement characters and lose the file. Base64 does not record what kind of file it held either, so the extension on the download is yours to set.",
      },
      {
        q: "Is base64 encryption?",
        a: "No. It is a way of writing bytes using 64 printable characters, and anybody can reverse it in a second, on this page. It hides nothing.",
      },
    ],
  },
  {
    slug: "url",
    category: "encode",
    title: "URL encoder",
    blurb: "Encode and decode, two rules",
    seoTitle: "URL encoder and decoder, component or whole URL",
    description:
      "Percent-encode and decode URLs in your browser, with the difference between encoding a component and encoding a whole URL made explicit.",
    intro: [
      "Two rules, and picking the wrong one is the reason most links break.",
      "The note under the switch says what each rule does to the characters that give a URL its structure.",
    ],
    faq: [
      PRIVACY,
      {
        q: "What is the difference between the two rules?",
        a: "The component rule escapes everything that is not a plain letter, digit or one of a few marks, including the slash, colon, question mark, ampersand and equals. Use it for a value going inside a URL. The whole URL rule leaves those structural characters alone. Use it for a URL that only needs its spaces and accents made safe.",
      },
      {
        q: "What happens if I pick the wrong one?",
        a: "Escaping a whole URL with the component rule turns every slash into %2F and produces a link that goes nowhere. Escaping a query value with the whole URL rule leaves an ampersand intact, which splits your own parameter in two at the other end.",
      },
      {
        q: "Why does decoding sometimes fail?",
        a: "Because a percent sign that is not followed by two hex digits is not valid in a URL. A literal percent has to be written %25. The tool says so rather than throwing.",
      },
    ],
  },
  {
    slug: "uuid",
    category: "time",
    title: "UUID generator",
    blurb: "Version 4, one to a hundred",
    seoTitle: "UUID v4 generator, up to 100 at once, cryptographically random",
    description:
      "Generate version 4 UUIDs in your browser, from your device's cryptographic randomness. One at a time or a hundred, copy one or copy all.",
    intro: [
      "Version 4 UUIDs, generated on this page from your browser's own cryptographic randomness.",
      "Nothing is stored and nothing repeats: reload and you get a different set.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Where does the randomness come from?",
        a: "From crypto.getRandomValues, which is the browser's cryptographic random source. Not Math.random, which is a fast sequence rather than a random source: values from it can collide and can be predicted from earlier ones.",
      },
      {
        q: "What makes it version 4?",
        a: "Two fixed pieces among the random bits: a 4 in one position marking the version, and two bits in another marking the RFC 4122 variant. Without them it is 128 random bits that no parser will agree is a v4 UUID. Both are set here.",
      },
      {
        q: "Could two of these ever be the same?",
        a: "In principle, and not in practice. There are 122 random bits, so you would need to generate billions per second for a lifetime before a collision became likely.",
      },
    ],
  },
  {
    slug: "hash",
    category: "encode",
    title: "Hash generator",
    blurb: "SHA-256, SHA-1 and MD5 at once",
    seoTitle: "SHA-256, SHA-1 and MD5 hash generator, text or file",
    description:
      "Hash text or a file with SHA-256, SHA-1 and MD5 in your browser, all three at once. Paste a published checksum and it says which one matches.",
    intro: [
      "All three at once, because the page that published the checksum you are checking rarely says which algorithm it used.",
      "Files are read in slices in this page rather than uploaded, and the progress is real.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Which of the three should I use?",
        a: "SHA-256 for anything that matters. SHA-1 and MD5 are both broken for security: two different files can be made to share a digest deliberately. They are here because a great many checksums and older APIs still quote them, and checking a download against a published MD5 is a reasonable thing to want to do.",
      },
      {
        q: "How is text hashed?",
        a: "As its UTF-8 bytes, which is what every other correct tool does. That means text in any language gives the answer you can check against any other implementation.",
      },
      {
        q: "How large a file can it handle?",
        a: "The MD5 streams properly, a slice at a time, so size is not the limit there. The browser's built-in digest has no streaming interface, so for SHA the slices are joined before hashing, which does cost memory on a very large file. That is a real limit and it is better said than hidden.",
      },
    ],
  },
  {
    slug: "jwt",
    category: "encode",
    title: "JWT decoder",
    blurb: "Header, payload and expiry",
    seoTitle: "JWT decoder, header and payload, nothing sent anywhere",
    description:
      "Decode a JSON Web Token in your browser. Header and payload pretty-printed, expiry in local time. The signature is not verified and the token is not sent anywhere.",
    intro: [
      "Paste a token and see what is inside it. The expiry is shown in your own timezone and as a relative time.",
      "The signature is not checked, and the token never leaves this page. Both of those are said again on the tool itself, because a decoder that looks like a validator is how production tokens end up pasted into other people's servers.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Does this verify the signature?",
        a: "No, and it will not. Verifying needs the signing key, and a page that asked you to paste your signing key into a text box would deserve everything that followed. A token that decodes cleanly here is well formed, which is not the same as valid.",
      },
      {
        q: "Is it safe to paste a real token here?",
        a: "The token is read in this page and no request carries it, which you can confirm in your network tab. That said, a JWT is a credential: anyone who has it can use it until it expires. Treat pasting one anywhere, here included, the way you would treat pasting a password.",
      },
      {
        q: "What do exp, iat and nbf mean?",
        a: "Expires at, issued at, and not valid before. All three are counted in seconds since 1970 per the spec, and all three are shown here in your local time as well as raw.",
      },
      {
        q: "Why can I read the payload without a key?",
        a: "Because a JWT payload is base64, not encryption. It is signed so it cannot be changed without detection, not hidden. Anything secret does not belong in one.",
      },
    ],
  },
  {
    slug: "regex",
    category: "text",
    title: "Regex tester",
    blurb: "Live matches, groups and flags",
    seoTitle: "JavaScript regex tester with named groups and a runaway guard",
    description:
      "Test a JavaScript regular expression against sample text in your browser. Live highlighting, named groups listed, and a two second kill so a runaway pattern cannot lock the tab.",
    intro: [
      "Write a pattern, pick your flags, and watch the matches highlight as you type.",
      "Matching runs in a worker with a two second limit, so a pattern that would otherwise hang the tab is stopped instead.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Why does matching get stopped after two seconds?",
        a: "Because a pattern that nests one repeat inside another, like (a+)+b, can take longer than the universe has left on input that nearly matches. JavaScript cannot interrupt a regex once it starts, so the only way to get the page back is to run it somewhere that can be terminated. That is what the worker is for.",
      },
      {
        q: "Which flavour of regex is this?",
        a: "JavaScript's own, exactly as your browser implements it. So lookbehind and named groups work, and things that only exist in PCRE, like recursion or possessive quantifiers, do not.",
      },
      {
        q: "Are named groups supported?",
        a: "Yes. Write (?<name>...) and every match lists the group by name as well as by number.",
      },
      {
        q: "Why does it stop at a thousand matches?",
        a: "Because past that the list stops being something you read and starts being a memory problem. The tool says when it has stopped early rather than quietly showing you part of the answer.",
      },
    ],
  },
  {
    slug: "diff",
    category: "text",
    title: "Text diff",
    blurb: "Compare two blocks, by line or word",
    seoTitle: "Text diff tool, line and word modes, nothing uploaded",
    description:
      "Compare two blocks of text in your browser. Line mode with numbers on both sides, word mode for prose, additions and removals marked by shape as well as colour.",
    intro: [
      "Paste two versions and see what changed. Line mode for code and configuration, word mode for prose.",
      "Additions carry a plus and an underline, removals a minus and a strike, so the two are told apart without depending on colour.",
    ],
    faq: [
      PRIVACY,
      {
        q: "When should I use word mode instead of line mode?",
        a: "For prose. A line diff reports a whole paragraph as changed because one word in the middle of it moved, which tells you nothing. Word mode finds the word.",
      },
      {
        q: "Does a trailing newline count as a difference?",
        a: "No. Both sides are normalised to end the same way before comparing, because one file ending in a newline and another not is a difference nobody means and every editor produces. Windows line endings are normalised too, so a CRLF file against an LF one is not reported as entirely different.",
      },
      {
        q: "Is whitespace inside a line ignored?",
        a: "No. Two lines differing only by indentation are a real difference, and in a language where indentation is syntax it is the whole difference.",
      },
    ],
  },
  {
    slug: "timestamp",
    category: "time",
    title: "Timestamp converter",
    blurb: "Unix time to a date, and back",
    seoTitle: "Unix timestamp converter, seconds and milliseconds, local and UTC",
    description:
      "Convert a unix timestamp to local time and UTC, or a date back to a timestamp. Seconds and milliseconds told apart automatically. Runs in your browser.",
    intro: [
      "A timestamp in, a date out, in your own timezone and in UTC, with a relative phrasing so the number means something.",
      "Seconds and milliseconds are told apart by the size of the number, and you can override the guess.",
    ],
    faq: [
      PRIVACY,
      {
        q: "How does it know whether my number is seconds or milliseconds?",
        a: "By how many digits it has. Ten digits is seconds until roughly the year 2286 and thirteen is milliseconds over the same span, so the size is a reliable signal. It says which way it read your number, and you can set it by hand.",
      },
      {
        q: "Which timezone is the local time in?",
        a: "Whichever one your browser is set to, named above the row so there is no doubt. Typing a date is read the same way, because a time you type is a time where you are.",
      },
      {
        q: "Does it handle dates before 1970?",
        a: "Yes. A negative timestamp is a time before the epoch and converts normally.",
      },
    ],
  },
  {
    slug: "cron",
    category: "time",
    title: "Cron explainer",
    blurb: "A schedule, in plain English",
    seoTitle: "Cron expression explainer, in plain English, with the next run times",
    description:
      "Read a cron expression in plain English and see its next five run times in your timezone. Ranges, steps, lists and names, with clear errors on anything else.",
    intro: [
      "Paste a cron expression and read what it actually does, then check that against when it would next fire.",
      "Both together on purpose: a sentence can be misread and five times could be a coincidence, and the two agreeing is what makes them convincing.",
    ],
    faq: [
      PRIVACY,
      {
        q: "Which syntax does it understand?",
        a: "The standard five fields: minute, hour, day of month, month, day of week. Ranges like 1-5, steps like */15 and 0-30/10, lists like 1,15,30, and names like MON or JAN, in any case. Sunday can be written 0 or 7.",
      },
      {
        q: "Why does setting both the day of month and the day of week run more often than I expect?",
        a: "Because cron treats them as either, not both. An expression like 0 0 13 * FRI runs on the 13th of every month AND on every Friday. It looks like a bug, every cron implementation shares it, and the explanation says so out loud whenever both fields are set.",
      },
      {
        q: "Are @daily and the other shorthands supported?",
        a: "No, and deliberately. Half-supporting a syntax is how somebody comes to trust an answer that is wrong. The tool says what @daily is in five fields rather than guessing.",
      },
      {
        q: "Why does it say a schedule never runs?",
        a: "Because some cannot. The 30th of February is a valid expression that no clock will ever match. Rather than search forever, the tool looks eight years ahead and tells you it found nothing.",
      },
    ],
  },
  {
    slug: "color",
    category: "data",
    title: "Colour converter",
    blurb: "Hex, RGB, HSL, and a contrast check",
    seoTitle: "Colour converter and WCAG contrast checker, free",
    description:
      "Convert a colour between hex, RGB and HSL with a live swatch, and check the WCAG contrast between two colours. Runs in your browser.",
    intro: [
      "Type a colour in any of the three notations and get the other two, with a swatch that updates as you go.",
      "Below that, check whether one colour is readable on another against the WCAG thresholds, which is the part that decides whether text passes an accessibility audit.",
    ],
    faq: [
      PRIVACY,
      { q: "Which formats does it read?", a: "Hex, with or without the hash and in three or six digits; rgb() and rgba(); and hsl() and hsla(). Any alpha is ignored, because a contrast check is about the colours themselves." },
      { q: "What do AA and AAA mean?", a: "They are the two WCAG contrast levels. AA is the usual legal and practical target: 4.5 to 1 for normal text, 3 to 1 for large. AAA is stricter, at 7 to 1 and 4.5 to 1. The tool shows all four cells so you can see exactly which your pairing passes." },
      { q: "What counts as large text?", a: "18 point and over, or 14 point and over if it is bold. Large text is held to a lower contrast ratio because it is easier to read at the same contrast." },
      { q: "Why does my HSL come back slightly different?", a: "Hex and RGB store whole numbers per channel, and HSL is a different shape of the same space, so a round trip rounds to the nearest whole value. It stays within a point or two, which is not visible." },
    ],
  },
  {
    slug: "markdown",
    category: "text",
    title: "Markdown preview",
    blurb: "Live preview, and copy the HTML",
    seoTitle: "Markdown preview and to-HTML converter, free",
    description:
      "Write Markdown and see it rendered side by side, then copy the HTML. Runs in your browser; a safe subset that escapes everything.",
    intro: [
      "Type Markdown on the left and see it rendered on the right as you go. When it looks right, copy the HTML.",
      "It renders a safe subset: headings, bold, italic, code, links, lists, quotes and rules. Everything you type is escaped first, so nothing in the source can run in the preview.",
    ],
    faq: [
      PRIVACY,
      { q: "Which Markdown does it support?", a: "The common core: headings, bold and italic, inline code and fenced code blocks, links, unordered and ordered lists, blockquotes and horizontal rules. It is a subset for readmes and comments, not a full engine with tables and footnotes." },
      { q: "Is the preview safe?", a: "Yes, by construction. Every character you type is HTML-escaped before anything else happens, and the renderer only ever emits a fixed set of tags. A script tag in your source shows up as text, not as a running script, and a javascript: link is left as plain text rather than made clickable." },
      { q: "Can I copy the HTML?", a: "Yes. The Copy HTML button gives you exactly what the preview shows, ready to paste into a page. There is also a button to copy the Markdown back." },
      { q: "Does it support tables?", a: "Not yet. Tables and other extended syntax are outside this subset. For a readme, a comment or a description, what is here covers it." },
    ],
  },
  {
    slug: "json-to-csv",
    category: "data",
    title: "JSON to CSV",
    blurb: "An array of objects into a spreadsheet",
    seoTitle: "JSON to CSV converter online, free",
    description:
      "Turn a JSON array of objects into CSV, with a choice of separator. Handles one level of nesting. Runs in your browser.",
    intro: [
      "Paste a JSON array of objects and get CSV back, with the columns taken from the keys. Pick comma, semicolon or tab for the separator.",
      "It handles one level of nesting by making dotted columns like address.city. Anything deeper, or an array, is written as its JSON text in a single cell, which the tool says plainly rather than dropping it.",
    ],
    faq: [
      PRIVACY,
      { q: "What shape of JSON does it take?", a: "An array of objects, which is the usual shape of exported records. A single object is treated as one row. An array of plain values or of arrays is not a table, and the tool says so rather than guessing." },
      { q: "How does it handle nested data?", a: "One level deep becomes dotted columns: an address object turns into address.city and address.zip. Anything deeper than that, and any array, is written as its JSON text in one cell, because forcing it into columns would either lose data or invent structure." },
      { q: "What about commas inside a value?", a: "They are handled. A value containing the separator, a quote or a line break is wrapped in quotes with its own quotes doubled, which is the standard CSV escaping, so the row never splits in the wrong place." },
      { q: "Which separator should I use?", a: "Comma for a .csv that opens anywhere. Semicolon if your spreadsheet is set to a locale that uses the comma as a decimal point. Tab for a .tsv, which avoids the comma question entirely." },
    ],
  },
  {
    slug: "convert-data",
    category: "data",
    title: "Data file converter",
    blurb: "CSV, JSON and Excel, in any direction",
    seoTitle: "Convert CSV, JSON and XLSX online, free",
    description:
      "Convert between CSV, JSON and Excel in any direction, in your browser. Choose the delimiter, pick a sheet, nothing uploaded.",
    intro: [
      "Pick what you have and what you want, drop in a file or paste the data, and convert. CSV, JSON and Excel all go to each other, so a spreadsheet becomes JSON and an API dump becomes something Excel opens.",
      "It all runs in the page. The file is read, converted and saved on your own device, and no server here receives it.",
    ],
    faq: [
      PRIVACY,
      { q: "Which conversions does it do?", a: "All six directions between CSV, JSON and Excel (XLSX). Everything goes through a table in memory, so the same tool reads whatever you have and writes whatever you want." },
      { q: "Can I choose the delimiter?", a: "Yes, for CSV in and out: comma, semicolon, tab or pipe. Excel in some locales writes semicolons, so reading a file that came from there is a matter of picking the right one." },
      { q: "My Excel file has several sheets. Which one?", a: "When a workbook has more than one sheet, a picker appears and you choose which sheet to convert. One sheet becomes one table." },
      { q: "How does it handle nested JSON?", a: "A table is flat, so a nested object or array inside a JSON row is written as its JSON text in one cell rather than spread across columns. For turning JSON into CSV with dotted columns for one level of nesting, the JSON to CSV tool is the more specific choice." },
      { q: "Are big files a problem?", a: "It works on what fits in your browser's memory, which is comfortably most everyday files. A very large export can be slow, because the whole table is held in memory to convert it, the same as any spreadsheet app opening it." },
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
