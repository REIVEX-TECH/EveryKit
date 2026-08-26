/**
 * The kit registry. Single source of truth for both the directory on `/` and
 * the JSON served at `/kits.json`, so the page and the file every kit reads can
 * never disagree.
 *
 * Adding a kit means adding an entry here and nothing else.
 */

export type KitStatus = "live" | "soon";

/**
 * Which shelf a kit sits on in the directory. Additive: the kits' cross-promo
 * strips parse this same file and ignore fields they do not know about, so new
 * ones may be added but existing names and shapes never change.
 */
export type KitCategory = "photos" | "documents" | "everyday" | "developers" | "teachers";

export type Kit = {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  status: KitStatus;
  category: KitCategory;
  /** A glyph this app serves, referenced by the registry so kits can use it too. */
  icon: string;
  /**
   * What the kit hands back, described for the thumbnail's alt text. Kept
   * beside the kit so the directory does not need a lookup table.
   */
  outputAlt: string;
};

export type KitTool = {
  name: string;
  path: string;
  /** Short keywords: other names for the same tool, matched by the search. */
  synonyms: string[];
  /**
   * Whole-need phrases, the way someone describes the job to an assistant
   * rather than the tool's name: "passport photo for us visa", "scan paper to
   * pdf", "compress image to 100kb". The command bar matches these so a person
   * who knows what they want but not what we call it still lands on the tool.
   * Optional: a tool whose name already is the search term does not need them.
   */
  intents?: string[];
};

/**
 * Every tool on the platform, by kit slug.
 *
 * The hub cannot import a kit's own data across projects, so the catalogue is
 * declared here. It is the backbone the hub search and the "all tools" listing
 * both read, and it travels in kits.json for the cross-promo strips. The two
 * launcher kits with programmatic sub-pages, Photos and Letters, are each one
 * entry with broad synonyms rather than a row per country or per letter.
 */
export const kitTools: Record<string, KitTool[]> = {
  photos: [
    { name: "Passport & visa photo", path: "/", synonyms: ["passport", "visa", "id photo", "biometric", "2x2", "35x45", "headshot"], intents: ["passport photo for us visa", "make a passport photo at home", "biometric photo from a selfie", "2x2 inch id photo to print", "schengen visa photo size"] },
  ],
  letters: [
    { name: "Formal letter generator", path: "/", synonyms: ["letter", "resignation", "complaint", "refund", "visa invitation", "sponsorship", "notice to vacate", "experience certificate", "salary certificate", "internship", "character reference", "bank account closure", "cover letter", "noc"], intents: ["write a resignation letter", "write a complaint letter", "ask for a refund in writing", "letter to my landlord to move out", "visa invitation letter"] },
  ],
  pdf: [
    { name: "Merge PDFs", path: "/merge", synonyms: ["combine", "join", "join pdf"], intents: ["combine several pdfs into one", "join two pdf files", "put pdfs together in order"] },
    { name: "Split a PDF", path: "/split", synonyms: ["divide", "separate"], intents: ["split a pdf into separate files", "break one pdf into pages"] },
    { name: "Extract pages", path: "/extract", synonyms: ["pull pages", "take pages"], intents: ["pull a few pages out of a pdf", "save just some pages of a pdf"] },
    { name: "Organise pages", path: "/organize", synonyms: ["reorder", "rotate", "rearrange"], intents: ["reorder pages in a pdf", "rotate a sideways pdf page"] },
    { name: "Delete pages", path: "/delete-pages", synonyms: ["remove pages"], intents: ["remove a page from a pdf", "delete blank pages from a pdf"] },
    { name: "Add page numbers", path: "/page-numbers", synonyms: ["number pages", "pagination"], intents: ["add page numbers to a pdf"] },
    { name: "Watermark a PDF", path: "/watermark", synonyms: ["stamp", "draft mark"], intents: ["stamp draft on a pdf", "add a watermark to a pdf"] },
    { name: "Scan with your phone", path: "/scan", synonyms: ["scanner", "scan document", "phone scanner", "camera scan"], intents: ["scan paper to pdf", "scan a document with my phone", "turn a photo of a page into a pdf", "make a scan without a scanner"] },
    { name: "Get the text out (OCR)", path: "/ocr", synonyms: ["ocr", "image to text", "pdf to text", "extract text"], intents: ["get the text out of a scanned pdf", "copy text from an image", "ocr a photo of a page", "read text from a picture"] },
    { name: "PDF to images", path: "/pdf-to-images", synonyms: ["pdf to jpg", "pdf to png", "convert pdf to image"], intents: ["turn a pdf into jpg images", "save pdf pages as pictures"] },
    { name: "Images to PDF", path: "/images-to-pdf", synonyms: ["jpg to pdf", "png to pdf", "photos to pdf"], intents: ["combine photos into one pdf", "turn jpgs into a pdf"] },
    { name: "Compress a PDF", path: "/compress", synonyms: ["shrink", "reduce size", "smaller pdf"], intents: ["make a pdf smaller to email", "reduce a pdf under 2mb"] },
  ],
  qr: [
    { name: "Link QR code", path: "/url", synonyms: ["url", "website qr"], intents: ["qr code for a website link", "make a qr code for my page"] },
    { name: "Text QR code", path: "/text", synonyms: ["plain text qr"], intents: ["qr code with plain text"] },
    { name: "Wi-Fi QR code", path: "/wifi", synonyms: ["wifi", "network", "password qr"], intents: ["qr code so guests can join my wifi", "share wifi password with a qr code"] },
    { name: "Email QR code", path: "/email", synonyms: ["mailto qr"], intents: ["qr code that opens an email"] },
    { name: "SMS QR code", path: "/sms", synonyms: ["text message qr"], intents: ["qr code that sends a text"] },
    { name: "Calendar event QR code", path: "/event", synonyms: ["ics qr", "add to calendar"], intents: ["qr code to add an event to a calendar"] },
    { name: "Contact card QR code", path: "/vcard", synonyms: ["vcard", "business card qr"], intents: ["qr code for my contact details", "business card qr code"] },
    { name: "WhatsApp QR code", path: "/whatsapp", synonyms: ["wa.me qr", "chat qr"], intents: ["qr code to start a whatsapp chat"] },
  ],
  images: [
    { name: "Resize images", path: "/resize", synonyms: ["scale", "shrink image", "dimensions"], intents: ["resize a photo to exact pixels", "make an image a set width"] },
    { name: "Convert format", path: "/convert", synonyms: ["jpg to png", "png to webp", "heic"], intents: ["convert heic to jpg", "change png to jpg", "webp to png"] },
    { name: "Crop an image", path: "/crop", synonyms: ["trim", "square crop", "aspect ratio"], intents: ["crop a photo to a square", "crop an image to 16:9"] },
    { name: "Compress an image", path: "/compress", synonyms: ["reduce image size", "target size", "smaller photo"], intents: ["compress image to 100kb", "make a photo under 1mb", "shrink a jpg file size"] },
    { name: "Flip and rotate", path: "/flip-rotate", synonyms: ["mirror", "turn", "rotate photo", "sideways"], intents: ["rotate a sideways photo", "mirror an image"] },
    { name: "Make a favicon", path: "/favicon", synonyms: ["favicon", "site icon", "ico"], intents: ["make a favicon for my site", "turn a logo into a favicon"] },
    { name: "Remove EXIF", path: "/strip-exif", synonyms: ["strip metadata", "remove gps", "location"], intents: ["remove location data from a photo", "strip metadata before sharing a picture"] },
  ],
  background: [
    { name: "Remove the background", path: "/", synonyms: ["background remover", "cut out", "transparent"], intents: ["remove background from a product photo", "cut out a person from a photo", "erase the background of an image"] },
    { name: "Transparent background", path: "/transparent-background", synonyms: ["png transparent", "remove background"], intents: ["make a logo background transparent", "transparent png of a picture"] },
    { name: "White background", path: "/white-background", synonyms: ["white bg", "product photo"], intents: ["put a photo on a white background", "white background for a product listing"] },
  ],
  text: [
    { name: "Word counter", path: "/word-counter", synonyms: ["character count", "count words", "reading time"], intents: ["count the words in my text", "how many characters is this"] },
    { name: "Case converter", path: "/case-converter", synonyms: ["uppercase", "lowercase", "title case", "sentence case"], intents: ["change text to title case", "make text all uppercase"] },
    { name: "Clean text", path: "/clean-text", synonyms: ["remove line breaks", "tidy", "whitespace"], intents: ["remove line breaks from pasted text", "clean up messy spacing"] },
    { name: "Find and replace", path: "/find-replace", synonyms: ["search replace", "regex replace"], intents: ["find and replace across text"] },
    { name: "Remove duplicate lines", path: "/remove-duplicate-lines", synonyms: ["dedupe", "unique lines"], intents: ["remove duplicate lines from a list"] },
    { name: "Sort lines", path: "/sort-lines", synonyms: ["alphabetise", "order lines", "shuffle"], intents: ["sort a list alphabetically"] },
    { name: "Lorem ipsum", path: "/lorem-ipsum", synonyms: ["placeholder text", "dummy text", "filler"], intents: ["generate placeholder text"] },
  ],
  sign: [
    { name: "Draw your signature", path: "/", synonyms: ["signature", "sign", "handwritten"], intents: ["draw my signature to use online", "make a signature image"] },
    { name: "Type your signature", path: "/type", synonyms: ["typed signature", "font signature"], intents: ["type a signature in a handwriting font"] },
    { name: "Sign a PDF", path: "/sign-pdf", synonyms: ["e-sign", "add signature to pdf"], intents: ["sign a pdf contract", "add my signature to a pdf", "e-sign a document without an account"] },
  ],
  invoice: [
    { name: "Invoice maker", path: "/", synonyms: ["invoice", "bill", "pdf invoice"], intents: ["make an invoice for a client", "create a pdf invoice with my totals", "bill a customer"] },
    { name: "Quote maker", path: "/quote", synonyms: ["quote", "estimate"], intents: ["send a client a quote", "make a price estimate"] },
    { name: "Receipt maker", path: "/receipt", synonyms: ["receipt", "paid receipt"], intents: ["make a paid receipt", "give a customer a receipt"] },
  ],
  ringtone: [
    { name: "Make a ringtone", path: "/", synonyms: ["ringtone", "cut audio", "trim mp3", "fade"], intents: ["cut a song into a ringtone", "trim an mp3 for a ringtone"] },
    { name: "Convert audio to MP3", path: "/convert", synonyms: ["wav to mp3", "m4a to mp3", "ogg to mp3"], intents: ["convert m4a to mp3", "turn a wav into an mp3"] },
    { name: "Change the volume", path: "/volume", synonyms: ["louder", "quieter", "gain", "normalise"], intents: ["make an audio file louder", "normalise the volume of a track"] },
  ],
  dev: [
    { name: "JSON formatter", path: "/json", synonyms: ["format json", "validate json", "pretty print"], intents: ["pretty print some json", "check if my json is valid"] },
    { name: "Base64 encode and decode", path: "/base64", synonyms: ["base64", "encode", "decode"], intents: ["decode a base64 string", "encode text to base64"] },
    { name: "URL encode and decode", path: "/url", synonyms: ["percent encode", "escape url"], intents: ["url encode a query string"] },
    { name: "UUID generator", path: "/uuid", synonyms: ["uuid", "guid", "unique id"], intents: ["generate a uuid"] },
    { name: "Hash generator", path: "/hash", synonyms: ["md5", "sha256", "checksum"], intents: ["get the sha256 of some text", "make an md5 hash"] },
    { name: "JWT decoder", path: "/jwt", synonyms: ["json web token", "decode jwt"], intents: ["decode a jwt to see its claims"] },
    { name: "Regex tester", path: "/regex", synonyms: ["regular expression", "test regex"], intents: ["test a regular expression against text"] },
    { name: "Text diff", path: "/diff", synonyms: ["compare", "difference", "changes"], intents: ["compare two blocks of text", "see what changed between two versions"] },
    { name: "Timestamp converter", path: "/timestamp", synonyms: ["unix time", "epoch"], intents: ["convert a unix timestamp to a date"] },
    { name: "Cron parser", path: "/cron", synonyms: ["crontab", "schedule", "cron expression"], intents: ["explain a cron expression in words"] },
    { name: "Colour converter", path: "/color", synonyms: ["hex rgb hsl", "contrast checker", "wcag"], intents: ["convert hex to rgb", "check colour contrast for accessibility"] },
    { name: "Markdown preview", path: "/markdown", synonyms: ["md to html", "render markdown"], intents: ["preview markdown as html"] },
    { name: "JSON to CSV", path: "/json-to-csv", synonyms: ["json csv", "convert json"], intents: ["convert json to a csv"] },
  ],
  study: [
    { name: "GPA calculator", path: "/gpa", synonyms: ["grade point average", "gpa"], intents: ["work out my gpa", "calculate grade point average"] },
    { name: "Final grade calculator", path: "/final-grade", synonyms: ["what do i need", "exam grade"], intents: ["what do i need on my final", "grade i need to pass the class"] },
    { name: "Citation generator", path: "/citation", synonyms: ["apa", "mla", "reference", "bibliography"], intents: ["make an apa citation", "cite a source in mla"] },
    { name: "Reading time", path: "/reading-time", synonyms: ["how long to read", "words per minute"], intents: ["how long will this take to read"] },
    { name: "Study timer", path: "/timer", synonyms: ["pomodoro", "countdown timer"], intents: ["pomodoro timer for studying"] },
    { name: "Exam countdown", path: "/exam-countdown", synonyms: ["days until exam", "countdown"], intents: ["days until my exam"] },
  ],
  calc: [
    { name: "Age calculator", path: "/age", synonyms: ["how old", "date of birth"], intents: ["work out my exact age", "how old am i from my date of birth"] },
    { name: "Date difference", path: "/date-difference", synonyms: ["days between", "date calculator"], intents: ["how many days between two dates"] },
    { name: "Unit converter", path: "/units", synonyms: ["metric imperial", "convert units", "temperature"], intents: ["convert cm to inches", "celsius to fahrenheit"] },
    { name: "Loan and EMI", path: "/emi", synonyms: ["loan", "instalment", "repayment"], intents: ["work out a monthly loan payment", "car loan emi"] },
    { name: "Percentage calculator", path: "/percentage", synonyms: ["percent", "percentage change"], intents: ["what percent is x of y", "percentage increase between two numbers"] },
    { name: "Discount calculator", path: "/discount", synonyms: ["sale price", "percent off", "saving"], intents: ["price after a percent off", "how much i save in a sale"] },
    { name: "VAT and GST", path: "/vat", synonyms: ["vat", "gst", "sales tax", "add tax"], intents: ["add vat to a price", "work out gst on a bill"] },
    { name: "Trip fuel cost", path: "/trip-cost", synonyms: ["fuel cost", "petrol", "mileage", "split cost"], intents: ["fuel cost for a road trip", "split petrol cost between friends"] },
  ],
  teach: [
    { name: "Rubric maker", path: "/rubric", synonyms: ["rubric", "marking grid", "criteria", "grading rubric"], intents: ["make a marking rubric", "grading grid for an assignment"] },
    { name: "Gradebook", path: "/gradebook", synonyms: ["gradebook", "weighted grades", "class marks", "grade calculator"], intents: ["work out weighted grades for a class", "gradebook with letter grades"] },
    { name: "Worksheet maker", path: "/worksheet", synonyms: ["worksheet", "question sheet", "handout", "practice sheet"], intents: ["make a printable worksheet"] },
    { name: "Grade curve", path: "/curve", synonyms: ["curve grades", "z-score", "bell curve", "scale marks", "normalise marks"], intents: ["curve my class marks", "apply a bell curve to grades", "scale exam marks up", "z-score grade boundaries"] },
    { name: "Bubble answer sheet", path: "/bubble-sheet", synonyms: ["omr", "answer sheet", "multiple choice sheet", "scantron", "bubble sheet"], intents: ["printable multiple choice answer sheet", "make an omr bubble sheet", "answer key sheet for a quiz"] },
    { name: "Result cards", path: "/result-cards", synonyms: ["report card", "result slip", "marksheet", "report cards"], intents: ["make student result cards from marks", "print report slips for a class", "marks to a report card with grades"] },
    { name: "Random name picker", path: "/random-picker", synonyms: ["random student", "pick a name", "cold call", "name picker"], intents: ["pick a random student to answer"] },
    { name: "Group maker", path: "/groups", synonyms: ["random groups", "teams", "split class", "group generator"], intents: ["split a class into random groups", "make teams from a class list"] },
    { name: "Seating plan", path: "/seating", synonyms: ["seating chart", "seat plan", "classroom layout"], intents: ["make a seating chart for my class"] },
    { name: "Attendance sheet", path: "/attendance", synonyms: ["register", "roll call", "attendance register", "class list"], intents: ["printable attendance register", "roll call sheet for a date range"] },
    { name: "Name labels", path: "/name-labels", synonyms: ["desk tags", "name tags", "name badges", "labels", "tent cards"], intents: ["printable name labels for a class", "make desk name tags", "name badges from a roster"] },
    { name: "Award certificate", path: "/certificate", synonyms: ["certificate", "award", "star of the week", "reward"], intents: ["make an award certificate for a student"] },
    { name: "Weekly timetable", path: "/timetable", synonyms: ["timetable", "class schedule", "lesson planner", "weekly schedule"], intents: ["make a weekly class timetable"] },
    { name: "Classroom timer", path: "/timer", synonyms: ["countdown", "stopwatch", "class timer", "activity timer"], intents: ["big countdown timer for the class board"] },
  ],
};

/**
 * The flagship row on the hub home, the six tools shown under "Start here".
 *
 * These are the jobs an AI chat cannot do for you: they hand back a file, at an
 * exact size, byte for byte, without your original ever leaving the device.
 * That is the thing worth putting first, so the row is small and every tile is
 * one of these rather than a commodity a chat does fine.
 *
 * Kept as data, keyed by kit slug and path so the tile reuses the kit's own
 * launcher glyph and tint and the link is built from the registry's own URL.
 * The outcome line says what you get back, in concrete terms, not what the tool
 * is called.
 */
export type Flagship = {
  kitSlug: string;
  path: string;
  label: string;
  outcome: string;
};

export const flagships: Flagship[] = [
  { kitSlug: "photos", path: "/", label: "Passport & visa photos", outcome: "A compliant print sheet at exact size." },
  { kitSlug: "pdf", path: "/scan", label: "Scan to PDF", outcome: "A phone photo straightened into a clean page." },
  { kitSlug: "background", path: "/", label: "Background remover", outcome: "Your subject cut out on a clear background." },
  { kitSlug: "pdf", path: "/merge", label: "Merge PDFs", outcome: "Several files combined into one, in order." },
  { kitSlug: "teach", path: "/curve", label: "Grade curve", outcome: "Class marks curved, with the maths shown." },
  { kitSlug: "invoice", path: "/", label: "Invoice maker", outcome: "A tidy PDF invoice, totals added up." },
];

/** The flagship row with each tile's absolute link resolved from the registry. */
export function flagshipLinks(): Array<Flagship & { href: string }> {
  return flagships.map((f) => {
    const kit = kits.find((k) => k.slug === f.kitSlug);
    const base = (kit?.url ?? "").replace(/\/$/, "");
    return { ...f, href: f.path === "/" ? base : `${base}${f.path}` };
  });
}

export type CatalogEntry = {
  kitSlug: string;
  kitName: string;
  category: KitCategory;
  tool: KitTool;
  href: string;
};

/** Every tool, flattened, with an absolute link. The hub search reads this. */
export function catalog(): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  for (const kit of kits) {
    if (kit.status !== "live") continue;
    const tools = kitTools[kit.slug] ?? [];
    const base = kit.url.replace(/\/$/, "");
    for (const tool of tools) {
      const href = tool.path === "/" ? base : `${base}${tool.path}`;
      entries.push({ kitSlug: kit.slug, kitName: kit.name, category: kit.category, tool, href });
    }
  }
  return entries;
}

export const kits: Kit[] = [
  {
    slug: "photos",
    name: "EveryKit ID Photos",
    tagline: "Passport & visa photos from a selfie",
    url: "https://photos.useeverykit.com",
    status: "live",
    category: "photos",
    icon: "/icons/photos.svg",
    outputAlt:
      "A square passport photo with guide lines marking where the top of the head and the chin must fall",
  },
  {
    slug: "letters",
    name: "EveryKit Letters",
    tagline: "Formal letters, written for you",
    url: "https://letters.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/letters.svg",
    outputAlt: "A page of a formal letter",
  },
  {
    slug: "pdf",
    name: "EveryKit PDF",
    tagline: "Merge, split and shrink PDFs",
    url: "https://pdf.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/pdf.svg",
    outputAlt: "Two pages being combined into a single document",
  },
  {
    slug: "qr",
    name: "EveryKit QR",
    tagline: "QR codes that never expire",
    url: "https://qr.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/qr.svg",
    outputAlt: "A QR code, with the three squares a scanner looks for at its corners",
  },
  {
    slug: "images",
    name: "EveryKit Images",
    tagline: "Resize, convert and clean up photos",
    url: "https://images.useeverykit.com",
    status: "live",
    category: "photos",
    icon: "/icons/images.svg",
    outputAlt: "A large photo being reduced to a smaller one",
  },
  {
    slug: "background",
    name: "EveryKit Background",
    tagline: "Remove backgrounds in your browser, nothing uploaded",
    url: "https://background.useeverykit.com",
    status: "live",
    category: "photos",
    icon: "/icons/background.svg",
    outputAlt: "A person cut out from their background, on a chequerboard",
  },
  {
    slug: "text",
    name: "EveryKit Text",
    tagline: "Count, convert and clean text in a click",
    url: "https://text.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/text.svg",
    outputAlt: "Lines of text with a count beside them",
  },
  {
    slug: "sign",
    name: "EveryKit Sign",
    tagline: "Draw your signature, sign a PDF, done",
    url: "https://sign.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/sign.svg",
    outputAlt: "A signature written across a document",
  },
  {
    slug: "invoice",
    name: "EveryKit Invoice",
    tagline: "A clean PDF invoice in two minutes",
    url: "https://invoice.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/invoice.svg",
    outputAlt: "An invoice with a totals block",
  },
  {
    slug: "ringtone",
    name: "EveryKit Ringtone",
    tagline: "Trim any song into a ringtone",
    url: "https://ringtone.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/ringtone.svg",
    outputAlt: "A waveform with a short span of it marked as the part that is kept",
  },
  {
    slug: "dev",
    name: "EveryKit Dev",
    tagline: "Small developer tools, nothing leaves your browser",
    url: "https://dev.useeverykit.com",
    status: "live",
    category: "developers",
    icon: "/icons/dev.svg",
    outputAlt: "Ten small tool squares laid out like a launcher",
  },
  {
    slug: "study",
    name: "EveryKit Study",
    tagline: "Calculators and helpers for students",
    url: "https://study.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/study.svg",
    outputAlt: "A graduation cap above a row of calculator keys",
  },
  {
    slug: "calc",
    name: "EveryKit Calc",
    tagline: "Everyday calculators that just answer",
    url: "https://calc.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/calc.svg",
    outputAlt: "A calculator with an answer on its display",
  },
  {
    slug: "teach",
    name: "EveryKit Teach",
    tagline: "Classroom tools that save teachers time",
    url: "https://teach.useeverykit.com",
    status: "live",
    category: "teachers",
    icon: "/icons/teach.svg",
    outputAlt: "A marking grid beside a row of small classroom tool squares",
  },
];

/** Exactly the shape published at /kits.json, per the shared registry schema. */
export function registryPayload(): {
  kits: Array<Omit<Kit, "outputAlt">>;
} {
  return {
    kits: kits.map(({ slug, name, tagline, url, status, category, icon }) => ({
      slug,
      name,
      tagline,
      url,
      status,
      // Additive. Existing consumers read the first five and ignore these.
      category,
      icon,
      // The kit's tools, so a cross-promo strip can deep-link into them.
      tools: kitTools[slug] ?? [],
    })),
  };
}

export const CATEGORIES: Array<{ id: KitCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "photos", label: "Photos & ID" },
  { id: "documents", label: "Documents & letters" },
  { id: "everyday", label: "Everyday" },
  { id: "developers", label: "For developers" },
  { id: "teachers", label: "For teachers" },
];
